import { OrderStatus, StockMovementReason } from "@prisma/client";
import prisma from "../config/prisma.js";
import { AppError } from "../utils/appError.js";
import { PrismaAPIFeatures } from "../utils/apiFeatures.js";
import { PaymentGatewayFactory } from "./payment/factories/payment-gateway.factory.js";
import { PaymentProviderType } from "./payment/factories/vendor-onboarding.factory.js";
import {
  CreateCheckoutSessionInput,
  PaymentItem,
} from "./payment/interfaces/payment-gateway.interface.js";
import { env } from "../config/env.js";

interface CheckoutDTO {
  userId?: string;
  sessionId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  shippingAddress: Record<string, any>;
  paymentGateway: PaymentProviderType;
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

    // 1- User identity validation
    if (!userId && !guestEmail) {
      throw new AppError(
        "Customer identification (User account or Guest email) is required",
        400,
      );
    }

    let customerProfile = {
      name: guestName || "Guest Customer",
      email: guestEmail || "",
      phone: guestPhone || "",
    };

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true, email: true, phoneNumber: true },
      });

      if (user) {
        customerProfile = {
          name: user.fullName || customerProfile.name,
          email: user.email || customerProfile.email,
          phone: user.phoneNumber || customerProfile.phone,
        };
      }
    }

    // 2- DB Transaction
    const masterOrder = await prisma.$transaction(
      async (tx) => {
        // a- Fetch carts
        const carts = await tx.cart.findMany({
          where: userId ? { userId } : { sessionId },
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

        const allCartItems = carts.flatMap((cart) => cart.items);

        if (allCartItems.length === 0) {
          throw new AppError(
            "Your cart is empty. Cannot process checkout",
            400,
          );
        }

        // b- Validate products status & stock before processing
        for (const item of allCartItems) {
          if (item.variant.product.status !== "PUBLISHED") {
            throw new AppError(
              `Product "${item.variant.product.title}" is no longer available`,
              400,
            );
          }

          if (item.variant.stockQuantity < item.quantity) {
            throw new AppError(
              `Insufficient stock for product variant "\({item.variant.sku}". Requested:\){item.quantity}, Available: ${item.variant.stockQuantity}`,
              400,
            );
          }
        }

        // Group items by tenant
        const itemsByTenant = new Map();
        for (const item of allCartItems) {
          const tenantId = item.variant.tenantId;
          const tenantItems = itemsByTenant.get(tenantId) || [];
          tenantItems.push(item);
          itemsByTenant.set(tenantId, tenantItems);
        }

        let masterTotalAmount = 0;

        // c- Create Master Order
        const masterOrderRecord = await tx.masterOrder.create({
          data: {
            userId: userId || null,
            guestName: userId ? null : customerProfile.name,
            guestEmail: userId ? null : customerProfile.email,
            guestPhone: userId ? null : customerProfile.phone,
            shippingAddress,
            paymentGateway,
            paymentStatus: "PENDING",
            totalAmount: 0,
          },
        });

        // d- Process Tenants Orders & Atomic Stock Decrement
        for (const [tenantId, items] of itemsByTenant.entries()) {
          let tenantSubTotal = 0;

          for (const item of items) {
            const unitPrice = Number(item.variant.price ?? 0);
            tenantSubTotal += unitPrice * item.quantity;
          }

          masterTotalAmount += tenantSubTotal;

          const tenantOrder = await tx.tenantOrder.create({
            data: {
              tenantId,
              masterOrderId: masterOrderRecord.id,
              subTotal: tenantSubTotal,
              orderStatus: "PENDING",
            },
          });

          const orderItemsData = [];
          const stockMovementsData = [];

          for (const item of items) {
            const unitPrice = Number(item.variant.price ?? 0);
            const totalPrice = unitPrice * item.quantity;

            // Atomic Stock Decrement to prevent Race Condition
            const stockUpdate = await tx.productVariant.updateMany({
              where: {
                id: item.variantId,
                stockQuantity: { gte: item.quantity },
              },
              data: {
                stockQuantity: { decrement: item.quantity },
              },
            });

            if (stockUpdate.count === 0) {
              throw new AppError(
                `Stock changed during checkout for variant "${item.variant.sku}". Please try again.`,
                400,
              );
            }

            orderItemsData.push({
              tenantOrderId: tenantOrder.id,
              productId: item.variant.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice,
              totalPrice,
            });

            stockMovementsData.push({
              tenantId,
              variantId: item.variantId,
              quantity: -item.quantity,
              reason: StockMovementReason.ORDER_RESERVATION,
              referenceId: tenantOrder.id,
              note: `Customer order placement (TenantOrder: ${tenantOrder.id})`,
              createdById: userId || null,
            });
          }

          // Batch inserts for better DB performance
          await tx.orderItem.createMany({ data: orderItemsData });
          await tx.stockMovement.createMany({ data: stockMovementsData });
        }

        // e- Update Master Order Total
        const updatedMasterOrder = await tx.masterOrder.update({
          where: { id: masterOrderRecord.id },
          data: { totalAmount: masterTotalAmount },
          include: {
            tenantOrders: {
              include: {
                orderItems: {
                  include: {
                    product: { select: { title: true } },
                  },
                },
                tenant: {
                  select: {
                    id: true,
                    name: true,
                    stripeAccountId: true,
                    paymobSubMerchantId: true,
                  },
                },
              },
            },
          },
        });

        // f- Delete Carts
        const cartIds = carts.map((c) => c.id);
        await tx.cartItem.deleteMany({
          where: { cartId: { in: cartIds } },
        });
        await tx.cart.deleteMany({
          where: { id: { in: cartIds } },
        });

        return updatedMasterOrder;
      },
      { timeout: 15000 },
    );

    // 3- Prepare Payment Payload
    const paymentItems: PaymentItem[] = masterOrder.tenantOrders.flatMap(
      (tOrder) =>
        tOrder.orderItems.map((item) => ({
          name: item.product.title,
          unitAmount: Number(item.unitPrice),
          quantity: Number(item.quantity),
        })),
    );

    const primaryTenantOrder = masterOrder.tenantOrders[0];
    const vendorProviderAccountId =
      paymentGateway === "STRIPE"
        ? (primaryTenantOrder?.tenant.stripeAccountId ?? undefined)
        : (primaryTenantOrder?.tenant.paymobSubMerchantId ?? undefined);

    const frontendUrl = env.CLIENT_URL || "http://localhost:3000";

    const sessionInput: CreateCheckoutSessionInput = {
      tenantId: primaryTenantOrder?.tenantId || "",
      orderId: masterOrder.id,
      customerEmail: customerProfile.email,
      currency: "EGP",
      items: paymentItems,
      successUrl: `\({frontendUrl}/checkout/success?orderId=\){masterOrder.id}`,
      cancelUrl: `\({frontendUrl}/checkout/cancel?orderId=\){masterOrder.id}`,
      vendorProviderAccountId,
      platformFeeAmount: 0,
    };

    const gatewayProvider = PaymentGatewayFactory.getProvider(paymentGateway);
    const paymentSession =
      await gatewayProvider.createCheckoutSeesion(sessionInput);

    return {
      masterOrder,
      paymentSession,
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
