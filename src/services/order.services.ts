import { OrderStatus, StockMovementReason } from "@prisma/client";
import prisma from "../config/prisma.js";
import { AppError } from "../utils/appError.js";
import { PrismaAPIFeatures } from "../utils/apiFeatures.js";
import { PaymentService } from "./payment/payment.service.js";

interface CheckoutDTO {
  userId?: string;
  sessionId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  shippingAddress: Record<string, any>;
  paymentGateway: string;
}
export class OrderServices {
  /*
    Checkout
  */
  static async checkoutOrder(dto: CheckoutDTO) {
    const {
      userId,
      sessionId,
      guestName,
      guestEmail,
      guestPhone,
      shippingAddress,
      paymentGateway,
    } = dto;

    // 1- check for identity
    if (!userId && !sessionId && !guestEmail) {
      throw new AppError(
        "User identification (Auth token, Session ID, or Guest details) is required",
        400,
      );
    }

    // 2- transaction
    const masterOrder = await prisma.$transaction(async (tx) => {
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

    const paymentResult = await PaymentService.processPayment(paymentGateway, {
      orderId: masterOrder.id,
      amount: Number(masterOrder.totalAmount),
      currency: "EGP",
      customer: {
        name: masterOrder.guestName,
        email: masterOrder.guestEmail,
        phone: masterOrder.guestPhone,
      },
    });

    return {
      masterOrder,
      paymentResult,
    };
  }
  /* 
    Get All Tenants Orders (Tenant perspective)
  */
  static async getTenantOrders(
    tenantId: string,
    queryString: Record<string, any>,
  ) {
    const features = new PrismaAPIFeatures(queryString, {
      searchFields: ["id", "masterOrderId"],
    })
      .filter()
      .sort()
      .paginate();

    const builtQuery = features.build();

    const where = {
      ...builtQuery.where,
      tenantId,
    };

    const [orders, total] = await Promise.all([
      prisma.tenantOrder.findMany({
        ...builtQuery,
        where,
        include: {
          masterOrder: {
            select: {
              id: true,
              userId: true,
              guestName: true,
              guestEmail: true,
              guestPhone: true,
              shippingAddress: true,
              paymentStatus: true,
              paymentGateway: true,
              createdAt: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: { title: true },
              },
              variant: {
                select: { sku: true, title: true, attributes: true },
              },
            },
          },
        },
      }),
      prisma.tenantOrder.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        total,
        page: features.page,
        limit: features.take,
        totalPages: Math.ceil(total / features.take),
      },
    };
  }

  /*
    Update order status or restock if cancelled order (Tenant perspective)
  */
  static async updateOrderStatus(
    tenantId: string,
    tenantOrderId: string,
    status: OrderStatus,
    userId?: string,
  ) {
    return await prisma.$transaction(async (tx) => {
      // get order and check it
      const existingOrder = await tx.tenantOrder.findFirst({
        where: {
          id: tenantOrderId,
          tenantId,
        },
        include: {
          orderItems: true,
        },
      });

      if (!existingOrder) {
        throw new AppError("Tenant order not found", 404);
      }

      // CASE : order cancelled (and was not) , restock
      if (
        status === OrderStatus.CANCELLED &&
        existingOrder.orderStatus !== OrderStatus.CANCELLED
      ) {
        for (const item of existingOrder.orderItems) {
          // increment stock
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockQuantity: {
                increment: item.quantity,
              },
            },
          });

          // log stock movement
          await tx.stockMovement.create({
            data: {
              tenantId,
              variantId: item.variantId,
              quantity: item.quantity,
              reason: StockMovementReason.ORDER_CANCELLED,
              referenceId: existingOrder.id,
              note: `Order #${existingOrder.id} cancelled. Stock restored.`,
              createdById: userId || null,
            },
          });
        }
      }

      const updatedOrder = await tx.tenantOrder.update({
        where: { id: tenantOrderId },
        data: { orderStatus: status },
        include: {
          orderItems: true,
        },
      });
      return updatedOrder;
    });
  }

  /*
    get all orders (customer perspective)
  */
  static async getMyOrders(userId: string, queryString: Record<string, any>) {
    const features = new PrismaAPIFeatures(queryString, {
      searchFields: ["id"],
    })
      .filter()
      .sort()
      .paginate();

    const builtQuery = features.build();

    const where = {
      ...builtQuery.where,
      userId,
    };

    const [orders, total] = await Promise.all([
      prisma.masterOrder.findMany({
        ...builtQuery,
        where,
        include: {
          tenantOrders: {
            include: {
              orderItems: {
                include: {
                  product: { select: { title: true } },
                  variant: { select: { title: true, sku: true } },
                },
              },
            },
          },
        },
      }),
      prisma.masterOrder.count({ where }),
    ]);
    return {
      orders,
      pagination: {
        total,
        page: features.page,
        limit: features.take,
        totalPages: Math.ceil(total / features.take),
      },
    };
  }

  /* 
    Track Order (customer perspective)
  */
  static async trackOrder(orderId: string, email: string) {
    const masterOrder = await prisma.masterOrder.findFirst({
      where: {
        id: orderId,
        OR: [{ guestEmail: email }, { user: { email: email } }],
      },
      include: {
        tenantOrders: {
          include: {
            orderItems: {
              include: {
                product: { select: { title: true } },
                variant: { select: { title: true, attributes: true } },
              },
            },
          },
        },
      },
    });

    if (!masterOrder) {
      throw new AppError("Order not found or email does not match", 404);
    }

    return masterOrder;
  }

  /*
    Cancel order if still pending (customer perspective)
  */
  static async cancelCustomerOrder(params: {
    orderId: string;
    userId?: string;
    guestEmail?: string;
    cancelReason?: string;
  }) {
    const { orderId, userId, guestEmail, cancelReason } = params;

    return await prisma.$transaction(async (tx) => {
      // get master order and check for it
      const masterOrder = await tx.masterOrder.findFirst({
        where: {
          id: orderId,
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(guestEmail ? [{ guestEmail }] : []),
          ],
        },
        include: {
          tenantOrders: {
            include: {
              orderItems: true,
            },
          },
        },
      });

      if (!masterOrder) {
        throw new AppError(
          "Order not found or you do not have permission to cancel it",
          404,
        );
      }

      // get tenants orders and check for status
      const isEligibleForCancellation = masterOrder.tenantOrders.every(
        (tenantOrder) => tenantOrder.orderStatus === OrderStatus.PENDING,
      );

      if (!isEligibleForCancellation) {
        throw new AppError(
          "Cannot cancel order as one or more items are already being processed, shipped, or delivered",
          400,
        );
      }

      // cancel and restock
      for (const tenantOrder of masterOrder.tenantOrders) {
        if (tenantOrder.orderStatus === OrderStatus.CANCELLED) continue;

        await tx.tenantOrder.update({
          where: { id: tenantOrder.id },
          data: { orderStatus: OrderStatus.CANCELLED },
        });

        for (const item of tenantOrder.orderItems) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockQuantity: {
                increment: item.quantity,
              },
            },
          });

          // log stock movement
          await tx.stockMovement.create({
            data: {
              tenantId: tenantOrder.tenantId,
              variantId: item.variantId,
              quantity: item.quantity, // بالموجب
              reason: StockMovementReason.ORDER_CANCELLED,
              referenceId: tenantOrder.id,
              note: `Order cancelled by customer. ${
                cancelReason ? `Reason: ${cancelReason}` : ""
              }`.trim(),
              createdById: userId || null,
            },
          });
        }
      }

      // updated master order
      return await tx.masterOrder.findUnique({
        where: { id: orderId },
        include: {
          tenantOrders: {
            include: {
              orderItems: true,
            },
          },
        },
      });
    });
  }
}
