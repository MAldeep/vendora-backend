import { IWebhookHandlerProvider } from "../interfaces/webhook-handler.interface.js";
import { PaymobWebhookProvider } from "../providers/paymob-webhook.provider.js";
import { StripeWebhookProvider } from "../providers/stripe-webhook.provider.js";
import { PaymentProviderType } from "./vendor-onboarding.factory.js";

export class WebhookHandlerFactory {
  private static providers: Map<PaymentProviderType, IWebhookHandlerProvider> =
    new Map();

  public static getProvider(
    provider: PaymentProviderType,
  ): IWebhookHandlerProvider {
    const normalizedProvider = provider.toUpperCase() as PaymentProviderType;

    if (!this.providers.has(normalizedProvider)) {
      switch (normalizedProvider) {
        case "STRIPE":
          this.providers.set(normalizedProvider, new StripeWebhookProvider());
          break;
        case "PAYMOB":
          this.providers.set(normalizedProvider, new PaymobWebhookProvider());
          break;
        default:
          throw new Error(`Unsupported webhook handler provider: ${provider}`);
      }
    }

    return this.providers.get(normalizedProvider)!;
  }
}
