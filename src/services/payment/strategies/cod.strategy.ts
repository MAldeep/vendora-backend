import {
  IPaymentStrategy,
  PaymentPayload,
  PaymentResult,
} from "../interfaces/payment-strategy.interface.js";

export class CodStrategy implements IPaymentStrategy {
  async processPayment(payload: PaymentPayload): Promise<PaymentResult> {
    return {
      success: true,
      clientSecret: null,
      redirectUrl: null,
      transactionId: null,
    };
  }
}
