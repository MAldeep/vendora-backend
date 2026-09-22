import { OrderStatus, PaymentStatus } from "@prisma/client";
import prisma from "../config/prisma.js";

export class WebhookServices {
  static async handlePaymentSuccess(
    masterOrderId: string,
    gateway: string = "STRIPE",
  ) {
    return await prisma.$transaction(async (tx) => {
      // update master order
      const updatedMasterOrder = await tx.masterOrder.update({
        where: { id: masterOrderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paymentGateway: gateway,
        },
      });
      // update tenants orders
      await tx.tenantOrder.updateMany({
        where: { masterOrderId },
        data: {
          orderStatus: OrderStatus.PROCESSING,
        },
      });
      return updatedMasterOrder;
    });
  }
  static async handlePaymentFailure(masterOrderId: string) {
    return await prisma.masterOrder.update({
      where: { id: masterOrderId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
      },
    });
  }
}
