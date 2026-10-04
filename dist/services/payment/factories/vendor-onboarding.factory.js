import { PaymobVendorProvider } from "../providers/paymob-vendor.provider.js";
import { StripeVendorProvider } from "../providers/stripe-vendor.provider.js";
export class VendorOnboardingFactory {
    static providers = new Map();
    static getProvider(provider) {
        const normalizedProvider = provider.toUpperCase();
        if (!this.providers.has(normalizedProvider)) {
            switch (normalizedProvider) {
                case "STRIPE":
                    this.providers.set(normalizedProvider, new StripeVendorProvider());
                    break;
                case "PAYMOB":
                    this.providers.set(normalizedProvider, new PaymobVendorProvider());
                    break;
                default:
                    throw new Error(`Unsupported vendor onboarding provider: ${provider}`);
            }
        }
        return this.providers.get(normalizedProvider);
    }
}
