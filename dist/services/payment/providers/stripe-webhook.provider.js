import { env } from "../../../config/env.js";
import { stripe } from "../../../config/stripe.js";
import { AppError } from "../../../utils/appError.js";
export class StripeWebhookProvider {
    async verifyAndParseEvent(rawBody, signature, secret) {
        // webhook secret
        const webhookSecret = secret || env.STRIPE_WEBHOOK_SECRET;
        // signature
        const sigString = typeof signature === "string"
            ? signature
            : signature["stripe-signature"];
        if (!sigString) {
            throw new AppError("Stripe signature header is missing.", 400);
        }
        const event = stripe.webhooks.constructEvent(rawBody, sigString, webhookSecret);
        let eventType = "UNKNOWN";
        const data = {
            rawPayload: event,
        };
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                eventType = "PAYMENT_SUCCESS";
                data.tenantId = session.metadata?.tenantId;
                data.orderId = session.metadata?.orderId;
                data.providerTransactionId = session.payment_intent;
                data.amount = session.amount_total ?? undefined;
                data.currency = session.currency?.toUpperCase();
                break;
            }
            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object;
                eventType = "PAYMENT_FAILED";
                data.tenantId = paymentIntent.metadata?.tenantId;
                data.orderId = paymentIntent.metadata?.orderId;
                data.providerTransactionId = paymentIntent.id;
                break;
            }
            case "account.updated": {
                eventType = "ACCOUNT_UPDATED";
                break;
            }
        }
        return {
            type: eventType,
            eventId: event.id,
            data,
        };
    }
}
