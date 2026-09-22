import Stripe from "stripe";
import { env } from "../config/env.js";
import { catchAsync } from "../utils/catchAsync.js";
import { Request, Response } from "express";
import { WebhookServices } from "../services/payment/webhook.services.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia" as any,
});

export class WebhookController {
  static handleStripeWebhook = catchAsync(
    async (req: Request, res: Response) => {
      const signature = req.headers["stripe-signature"] as string;
      const webhookSecret = env.STRIPE_WEBHOOK_SECRET!;
      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          webhookSecret,
        );
      } catch (err: any) {
        console.error(`Webhook Signature Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      switch (event.type) {
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const masterOrderId = paymentIntent.metadata.masterOrderId;

          if (masterOrderId) {
            await WebhookServices.handlePaymentSuccess(masterOrderId, "STRIPE");
            console.log(`Payment confirmed for MasterOrder: ${masterOrderId}`);
          }
          break;
        }

        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const masterOrderId = paymentIntent.metadata.masterOrderId;

          if (masterOrderId) {
            await WebhookServices.handlePaymentFailure(masterOrderId);
            console.log(`Payment failed for MasterOrder: ${masterOrderId}`);
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.status(200).json({ received: true });
    },
  );
}
