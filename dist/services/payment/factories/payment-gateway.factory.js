import { AppError } from "../../../utils/appError.js";
import { PaymobPaymentProvider } from "../providers/paymob-payment.provider.js";
import { StripePaymentProvider } from "../providers/stripe-payment.provider.js";
export class PaymentGatewayFactory {
    static providers = new Map();
    static getProvider(provider) {
        const normalizedProvider = provider.toUpperCase();
        if (!this.providers.has(normalizedProvider)) {
            switch (normalizedProvider) {
                case "STRIPE":
                    this.providers.set(normalizedProvider, new StripePaymentProvider());
                    break;
                case "PAYMOB":
                    this.providers.set(normalizedProvider, new PaymobPaymentProvider());
                    break;
                default:
                    throw new AppError(`Unsupported payment gateway provider: ${provider}`, 500);
            }
        }
        return this.providers.get(normalizedProvider);
    }
}
