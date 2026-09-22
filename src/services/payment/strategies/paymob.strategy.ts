import axios from "axios";
import {
  IPaymentStrategy,
  PaymentPayload,
  PaymentResult,
} from "../interfaces/payment-strategy.interface.js";
import { env } from "../../../config/env.js";

export class PaymobStrategy implements IPaymentStrategy {
  private baseUrl = "https://accept.paymob.com/api";

  async processPayment(payload: PaymentPayload): Promise<PaymentResult> {
    const amountInCents = Math.round(payload.amount * 100);

    const authResponse = await axios.post(`${this.baseUrl}/auth/tokens`, {
      api_key: env.PAYMOB_API_KEY,
    });
    const authToken = authResponse.data.token;

    const orderResponse = await axios.post(`${this.baseUrl}/ecommerce/orders`, {
      auth_token: authToken,
      delivery_needed: "false",
      amount_cents: amountInCents,
      currency: payload.currency || "EGP",
      merchant_order_id: payload.orderId,
    });
    const paymobOrderId = orderResponse.data.id;

    const paymentKeyResponse = await axios.post(
      `${this.baseUrl}/acceptance/payment_keys`,
      {
        auth_token: authToken,
        amount_cents: amountInCents,
        expiration: 3600,
        order_id: paymobOrderId,
        billing_data: {
          first_name: payload.customer?.name || "Guest",
          last_name: "Customer",
          email: payload.customer?.email || "guest@example.com",
          phone_number: payload.customer?.phone || "01000000000",
          country: "EG",
          city: "NA",
          street: "NA",
          building: "NA",
          floor: "NA",
          apartment: "NA",
        },
        currency: payload.currency || "EGP",
        integration_id: Number(env.PAYMOB_INTEGRATION_ID),
      },
    );

    const paymentToken = paymentKeyResponse.data.token;
    const iframeId = env.PAYMOB_IFRAME_ID;

    return {
      success: true,
      redirectUrl: `${this.baseUrl}/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`,
      transactionId: String(paymobOrderId),
    };
  }
}
