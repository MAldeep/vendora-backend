import { stripe } from "../../../config/stripe.js";
import {
  CheckoutSessionResult,
  CreateCheckoutSessionInput,
  IPaymentGatewayProvider,
} from "../interfaces/payment-gateway.interface.js";

export class StripePaymentProvider implements IPaymentGatewayProvider {
  async createCheckoutSeesion(
    input: CreateCheckoutSessionInput,
  ): Promise<CheckoutSessionResult> {
    // Prepare Items in Stripe Format
    const lineItems = input.items.map((item) => ({
      price_data: {
        currency: input.currency.toLowerCase(),
        product_data: {
          name: item.name,
          description: item.description,
        },
        unit_amount: item.unitAmount,
      },
      quantity: item.quantity,
    }));
    // Configure Session Params
    const sessionParams: any = {
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      customer_email: input.customerEmail,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        tenantId: input.tenantId,
        orderId: input.orderId,
      },
    };
    if (input.vendorProviderAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: input.platformFeeAmount || 0,
        transfer_data: {
          destination: input.vendorProviderAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return {
      sessionId: session.id,
      chechoutUrl: session.url!,
    };
  }

  async refundPayment(
    transactionId: string,
    amount?: number,
  ): Promise<{ refundId: string; status: string }> {
    const refund = await stripe.refunds.create({
      payment_intent: transactionId,
      amount: amount,
    });
    return {
      refundId: refund.id,
      status: refund.status || "succeeded",
    };
  }
}
