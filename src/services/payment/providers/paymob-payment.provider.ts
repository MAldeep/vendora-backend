import axios from "axios";
import {
  CheckoutSessionResult,
  CreateCheckoutSessionInput,
  IPaymentGatewayProvider,
} from "../interfaces/payment-gateway.interface.js";
import { paymobConfig } from "../../../config/paymob.js";

export class PaymobPaymentProvider implements IPaymentGatewayProvider {
  // for getting Auth Token
  private async getAuthToken(): Promise<string> {
    const response = await axios.post(`${paymobConfig.baseUrl}/auth/tokens`, {
      api_key: paymobConfig.apiKey,
    });
    return response.data.token;
  }

  async createCheckoutSeesion(
    input: CreateCheckoutSessionInput,
  ): Promise<CheckoutSessionResult> {
    const authToken = await this.getAuthToken();
    const totalAmountCents = input.items.reduce(
      (sum, item) => sum + item.unitAmount * item.quantity,
      0,
    );

    const orderResponse = await axios.post(
      `${paymobConfig.baseUrl}/ecommerce/orders`,
      {
        auth_token: authToken,
        delivery_needed: "false",
        amount_cents: totalAmountCents,
        currency: input.currency,
        merchant_order_id: input.orderId,
        items: input.items.map((item) => ({
          name: item.name,
          amount_cents: item.unitAmount,
          quantity: item.quantity,
          description: item.description || "",
        })),
      },
    );

    const paymobOrderId = orderResponse.data.id;

    const paymentKeyResponse = await axios.post(
      `${paymobConfig.baseUrl}/acceptance/payment_keys`,
      {
        auth_token: authToken,
        amount_cents: totalAmountCents,
        expiration: 3600,
        order_id: paymobOrderId,
        billing_data: {
          email: input.customerEmail,
          first_name: "Customer",
          last_name: "Guest",
          phone_number: "+201000000000",
          country: "EGP",
          city: "Cairo",
          street: "NA",
          building: "NA",
          floor: "NA",
          apartment: "NA",
        },
        currency: input.currency,
        integration_id: Number(paymobConfig.integrationIdCard),
        lock_order_when_paid: "true",
      },
    );

    const paymentToken = paymentKeyResponse.data.token;

    const checkoutUrl = `https://accept.paymob.com/api/acceptance/iframes/${paymobConfig.integrationIdCard}?payment_token=${paymentToken}`;

    return {
      sessionId: paymobOrderId.toString(),
      chechoutUrl: checkoutUrl,
    };
  }

  async refundPayment(
    transactionId: string,
    amount?: number,
  ): Promise<{ refundId: string; status: string }> {
    const authToken = await this.getAuthToken();

    const response = await axios.post(
      `${paymobConfig.baseUrl}/acceptance/void_refund/refund`,
      {
        auth_token: authToken,
        transaction_id: transactionId,
        amount_cents: amount,
      },
    );

    return {
      refundId: response.data.id.toString(),
      status: response.data.success ? "succeeded" : "failed",
    };
  }
}
