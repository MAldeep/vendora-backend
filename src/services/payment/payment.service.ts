import { PaymentFactory } from "./payment.factory.js";
import {
  PaymentPayload,
  PaymentResult,
} from "./interfaces/payment-strategy.interface.js";

export class PaymentService {
  static async processPayment(
    gateway: string,
    payload: PaymentPayload,
  ): Promise<PaymentResult> {
    const strategy = PaymentFactory.getStrategy(gateway);

    return await strategy.processPayment(payload);
  }
}
