import { env } from "../../../config/env.js";
import { stripe } from "../../../config/stripe.js";
import { AppError } from "../../../utils/appError.js";
import {
  IWebhookHandlerProvider,
  StandardWebhookEvent,
} from "../interfaces/webhook-handler.interface.js";

export class StripeWebhookProvider implements IWebhookHandlerProvider {
  async verifyAndParseEvent(
    rawBody: Buffer | string,
    signature: string | Record<string, unknown>,
    secret?: string,
  ): Promise<StandardWebhookEvent> {
    // webhook secret
    const webhookSecret = secret || env.STRIPE_WEBHOOK_SECRET;
    // signature
    const sigString =
      typeof signature === "string"
        ? signature
        : (signature["stripe-signature"] as string);
    if (!sigString) {
      throw new AppError("Stripe signature header is missing.", 400);
    }
    const event = stripe.webhooks.constructEvent(
      rawBody,
      sigString,
      webhookSecret,
    );

    let eventType: StandardWebhookEvent["type"] = "UNKNOWN";
    const data: StandardWebhookEvent["data"] = {
      rawPayload: event,
    };

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        eventType = "PAYMENT_SUCCESS";
        data.tenantId = session.metadata?.tenantId;
        data.orderId = session.metadata?.orderId;
        data.providerTransactionId = session.payment_intent as string;
        data.amount = session.amount_total ?? undefined;
        data.currency = session.currency?.toUpperCase();
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as any;
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
