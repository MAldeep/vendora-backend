import { AppError } from "../../../utils/appError.js";
import { IPaymentGatewayProvider } from "../interfaces/payment-gateway.interface.js";
import { PaymobPaymentProvider } from "../providers/paymob-payment.provider.js";
import { StripePaymentProvider } from "../providers/stripe-payment.provider.js";
import { PaymentProviderType } from "./vendor-onboarding.factory.js";

export class PaymentGatewayFactory {
  private static providers: Map<PaymentProviderType, IPaymentGatewayProvider> =
    new Map();

  public static getProvider(
    provider: PaymentProviderType,
  ): IPaymentGatewayProvider {
    const normalizedProvider = provider.toUpperCase() as PaymentProviderType;

    if (!this.providers.has(normalizedProvider)) {
      switch (normalizedProvider) {
        case "STRIPE":
          this.providers.set(normalizedProvider, new StripePaymentProvider());
          break;
        case "PAYMOB":
          this.providers.set(normalizedProvider, new PaymobPaymentProvider());
          break;
        default:
          throw new AppError(
            `Unsupported payment gateway provider: ${provider}`,
            500,
          );
      }
    }

    return this.providers.get(normalizedProvider)!;
  }
}
