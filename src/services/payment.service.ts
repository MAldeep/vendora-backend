import Stripe from "stripe";
import { env } from "../config/env.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-08-26.dahlia" as any,
});

export class PaymentService {
  static async createStripePaymentIntent(
    masterOrderId: string,
    totalAmount: number,
    currency: string = "egp",
  ) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: currency.toLowerCase(),
      metadata: {
        masterOrderId: masterOrderId,
      },
    });
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }
}
