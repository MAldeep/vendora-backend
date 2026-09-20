import { StockMovementReason } from "@prisma/client";
import prisma from "../config/prisma.js";
import { AppError } from "../utils/appError.js";

interface CheckoutDTO {
  userId?: string;
  sessionId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  shippingAddress: Record<string, any>;
  paymentGateway?: string;
}
export class OrderServices {
  static async checkoutOrder(dto: CheckoutDTO) {
    const {
      userId,
      sessionId,
      guestName,
      guestEmail,
      guestPhone,
      shippingAddress,
      paymentGateway = "COD",
    } = dto;

    // 1- check for identity
    if (!userId && !sessionId && !guestEmail) {
      throw new AppError(
        "User identification (Auth token, Session ID, or Guest details) is required",
        400,
      );
    }

    // 2- transaction
    return await prisma.$transaction(async (tx) => {
      // a. get all carts
      const carts = await tx.cart.findMany({
        where: {
          ...(userId ? { userId } : { sessionId }),
        },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    select: {
                      id: true,
                      title: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // b. get all items in all carts and check for zero condition
      const allCartItems = carts.flatMap((cart) => cart.items);

      if (allCartItems.length === 0) {
        throw new AppError("Your cart is empty. Cannot process checkout", 400);
      }

      // check for all items status && stock qty
      for (const item of allCartItems) {
        if (item.variant.product.status !== "PUBLISHED") {
          throw new AppError(
            `Product "${item.variant.product.title}" is no longer available`,
            400,
          );
        }

        if (item.variant.stockQuantity < item.quantity) {
          throw new AppError(
            `Insufficient stock for product variant "${item.variant.sku}". Requested: ${item.quantity}, Available: ${item.variant.stockQuantity}`,
            400,
          );
        }
      }

      // c. prepare items
      const itemsByTenant = new Map<string, typeof allCartItems>();

      for (const item of allCartItems) {
        const tenantId = item.variant.tenantId;
        const tenantItems = itemsByTenant.get(tenantId) || [];
        tenantItems.push(item);
        itemsByTenant.set(tenantId, tenantItems);
      }

      // master amount
      let masterTotalAmount = 0;

      // d. create the master order (with zero amount to be precisely calculated later)
      const masterOrder = await tx.masterOrder.create({
        data: {
          userId: userId || null,
          guestName: userId ? null : guestName,
          guestEmail: userId ? null : guestEmail,
          guestPhone: userId ? null : guestPhone,
          shippingAddress,
          paymentGateway,
          paymentStatus: "PENDING",
          totalAmount: 0,
        },
      });

      // e. create tenant order and create stock movement
      for (const [tenantId, items] of itemsByTenant.entries()) {
        let tenantSubTotal = 0;

        // tenant subtotal
        for (const item of items) {
          const unitPrice = Number(item.variant.price ?? 0);
          tenantSubTotal += unitPrice * item.quantity;
        }

        masterTotalAmount += tenantSubTotal;

        // create tenant order
        const tenantOrder = await tx.tenantOrder.create({
          data: {
            tenantId,
            masterOrderId: masterOrder.id,
            subTotal: tenantSubTotal,
            orderStatus: "PENDING",
          },
        });

        // order item && decrement qty in stock && log stock movement
        for (const item of items) {
          const unitPrice = Number(item.variant.price ?? 0);
          const totalPrice = unitPrice * item.quantity;

          await tx.orderItem.create({
            data: {
              tenantOrderId: tenantOrder.id,
              productId: item.variant.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice,
              totalPrice,
            },
          });

          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });

          await tx.stockMovement.create({
            data: {
              tenantId,
              variantId: item.variantId,
              quantity: -item.quantity,
              reason: StockMovementReason.ORDER_RESERVATION,
              referenceId: tenantOrder.id,
              note: `Customer order placement (TenantOrder: ${tenantOrder.id})`,
              createdById: userId || null,
            },
          });
        }
      }

      // master order with master total
      const updatedMasterOrder = await tx.masterOrder.update({
        where: { id: masterOrder.id },
        data: { totalAmount: masterTotalAmount },
        include: {
          tenantOrders: {
            include: {
              orderItems: true,
            },
          },
        },
      });

      // clear carts
      const cartIds = carts.map((c) => c.id);
      await tx.cartItem.deleteMany({
        where: { cartId: { in: cartIds } },
      });
      await tx.cart.deleteMany({
        where: { id: { in: cartIds } },
      });
      return updatedMasterOrder;
    });
  }
}
