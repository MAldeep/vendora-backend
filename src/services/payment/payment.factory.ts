import { IPaymentStrategy } from "./interfaces/payment-strategy.interface.js";
import { StripeStrategy } from "./strategies/stripe.strategy.js";
import { PaymobStrategy } from "./strategies/paymob.strategy.js";
import { CodStrategy } from "./strategies/cod.strategy.js";

export class PaymentFactory {
  private static strategies: Map<string, IPaymentStrategy> = new Map([
    ["STRIPE", new StripeStrategy()],
    ["PAYMOB", new PaymobStrategy()],
    ["COD", new CodStrategy()],
  ]);

  static getStrategy(gateway: string): IPaymentStrategy {
    const strategy = this.strategies.get(gateway.toUpperCase());

    if (!strategy) {
      throw new Error(`Payment gateway "${gateway}" is not supported`);
    }

    return strategy;
  }
}
