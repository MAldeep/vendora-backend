import { PaymentStatus, OrderStatus, StockMovementReason, } from "@prisma/client";
import { WebhookHandlerFactory } from "./payment/factories/webhook-handler.factory.js";
import prisma from "../config/prisma.js";
import { AppError } from "../utils/appError.js";
import { env } from "../config/env.js";
export class WebhookService {
    /**
      Handle Payment Success
     */
    static async handlePaymentSuccess(event, provider) {
        const { orderId, providerTransactionId, amount, currency, rawPayload } = event.data;
        if (!orderId) {
            throw new AppError(`Payment success event ${event.eventId} missing orderId.`, 400);
        }
        return await prisma.$transaction(async (tx) => {
            // Create the payment in payment Transaction table
            const transaction = await tx.paymentTransaction.create({
                data: {
                    eventId: event.eventId,
                    eventType: event.type,
                    masterOrderId: orderId,
                    amount: amount ? amount / 100 : undefined,
                    currency: currency || "EGP",
                    status: "SUCCESS",
                    rawPayload: rawPayload || {},
                },
            });
            // update master order to paid status
            const updatedMasterOrder = await tx.masterOrder.update({
                where: { id: orderId },
                data: {
                    paymentStatus: PaymentStatus.PAID,
                    ...(provider === "STRIPE" && providerTransactionId
                        ? { stripePaymentIntentId: providerTransactionId }
                        : {}),
                },
            });
            // update tenant order to proccessing
            await tx.tenantOrder.updateMany({
                where: { masterOrderId: orderId },
                data: { orderStatus: OrderStatus.PROCESSING },
            });
            return {
                processed: true,
                masterOrderId: updatedMasterOrder.id,
                transactionId: transaction.id,
            };
        });
    }
    /**
    Handle Payment Failure
     */
    static async handlePaymentFailed(event, _provider) {
        const { orderId, amount, currency, rawPayload } = event.data;
        if (!orderId) {
            // For documentation reasons
            await prisma.paymentTransaction.create({
                data: {
                    eventId: event.eventId,
                    eventType: event.type,
                    status: "FAILED",
                    rawPayload: rawPayload || {},
                },
            });
            return { processed: true, status: "FAILED_WITHOUT_ORDER" };
        }
        return await prisma.$transaction(async (tx) => {
            const transaction = await tx.paymentTransaction.create({
                data: {
                    eventId: event.eventId,
                    eventType: event.type,
                    masterOrderId: orderId,
                    amount: amount ? amount / 100 : undefined,
                    currency: currency || "EGP",
                    status: "FAILED",
                    rawPayload: rawPayload || {},
                },
            });
            // update master order
            await tx.masterOrder.update({
                where: { id: orderId },
                data: { paymentStatus: PaymentStatus.FAILED },
            });
            // update tenant orders
            await tx.tenantOrder.updateMany({
                where: { masterOrderId: orderId },
                data: { orderStatus: OrderStatus.CANCELLED },
            });
            const tenantOrders = await tx.tenantOrder.findMany({
                where: { masterOrderId: orderId },
                include: { orderItems: true },
            });
            for (const tOrder of tenantOrders) {
                for (const item of tOrder.orderItems) {
                    // Restock
                    await tx.productVariant.update({
                        where: { id: item.variantId },
                        data: { stockQuantity: { increment: item.quantity } },
                    });
                    // Stock movement
                    await tx.stockMovement.create({
                        data: {
                            tenantId: tOrder.tenantId,
                            variantId: item.variantId,
                            quantity: item.quantity,
                            reason: StockMovementReason.ORDER_CANCELLED,
                            referenceId: tOrder.id,
                            note: `Payment failed for MasterOrder: ${orderId}. Restored reserved stock.`,
                        },
                    });
                }
            }
            return {
                processed: true,
                masterOrderId: orderId,
                transactionId: transaction.id,
            };
        });
    }
    /**
      Onboarding Status Updates
     */
    static async handleAccountUpdated(event, _provider) {
        const { tenantId, rawPayload } = event.data;
        // PaymentTransaction update
        const transaction = await prisma.paymentTransaction.create({
            data: {
                eventId: event.eventId,
                eventType: event.type,
                tenantId: tenantId || null,
                status: "ACCOUNT_UPDATED",
                rawPayload: rawPayload || {},
            },
        });
        return {
            processed: true,
            transactionId: transaction.id,
        };
    }
    /*
    Handling Webhooks
     */
    static async handleWebhook(params) {
        const { provider, rawBody, signature, secret } = params;
        // secret
        const webhookSecret = params.secret ||
            (provider === "STRIPE"
                ? env.STRIPE_WEBHOOK_SECRET
                : env.PAYMOB_HMAC_SECRET);
        // get the provider and return webhook event
        const handler = WebhookHandlerFactory.getProvider(provider);
        const event = await handler.verifyAndParseEvent(rawBody, signature, secret);
        // Idempotency check
        const existingTransaction = await prisma.paymentTransaction.findUnique({
            where: { eventId: event.eventId },
        });
        if (existingTransaction) {
            return {
                processed: false,
                reason: "EVENT_ALREADY_PROCESSED",
                eventId: event.eventId,
            };
        }
        // Directing the process acc. to event type
        switch (event.type) {
            case "PAYMENT_SUCCESS":
                return await this.handlePaymentSuccess(event, provider);
            case "PAYMENT_FAILED":
                return await this.handlePaymentFailed(event, provider);
            case "ACCOUNT_UPDATED":
                return await this.handleAccountUpdated(event, provider);
            default:
                await prisma.paymentTransaction.create({
                    data: {
                        eventId: event.eventId,
                        eventType: `UNKNOWN_${provider}_EVENT`,
                        status: "IGNORED",
                        rawPayload: event.data.rawPayload || {},
                    },
                });
                return { processed: true, status: "IGNORED" };
        }
    }
}
