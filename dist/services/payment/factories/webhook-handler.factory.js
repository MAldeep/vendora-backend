import { PaymobWebhookProvider } from "../providers/paymob-webhook.provider.js";
import { StripeWebhookProvider } from "../providers/stripe-webhook.provider.js";
export class WebhookHandlerFactory {
    static providers = new Map();
    static getProvider(provider) {
        const normalizedProvider = provider.toUpperCase();
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
        return this.providers.get(normalizedProvider);
    }
}
