import Stripe from "stripe";
import {
  IPaymentStrategy,
  PaymentPayload,
  PaymentResult,
} from "../interfaces/payment-strategy.interface.js";
import { env } from "../../../config/env.js";

export class StripeStrategy implements IPaymentStrategy {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-08-26.dahlia",
    });
  }

  async processPayment(payload: PaymentPayload): Promise<PaymentResult> {
    const amountInCents = Math.round(payload.amount * 100);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountInCents,
      currency: payload.currency || "egp",
      metadata: {
        masterOrderId: payload.orderId,
      },
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      transactionId: paymentIntent.id,
    };
  }
}
