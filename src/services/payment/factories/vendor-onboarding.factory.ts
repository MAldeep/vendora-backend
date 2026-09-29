import { IVendorOnboardingProvider } from "../interfaces/vendor-onboarding.interface.js";
import { PaymobVendorProvider } from "../providers/paymob-vendor.provider.js";
import { StripeVendorProvider } from "../providers/stripe-vendor.provider.js";

export type PaymentProviderType = "STRIPE" | "PAYMOB";

export class VendorOnboardingFactory {
  private static providers: Map<PaymentProviderType, IVendorOnboardingProvider> = new Map();

  public static getProvider(
    provider: PaymentProviderType,
  ): IVendorOnboardingProvider {
    const normalizedProvider = provider.toUpperCase() as PaymentProviderType;

    if (!this.providers.has(normalizedProvider)) {
      switch (normalizedProvider) {
        case "STRIPE":
          this.providers.set(normalizedProvider, new StripeVendorProvider());
          break;
        case "PAYMOB":
          this.providers.set(normalizedProvider, new PaymobVendorProvider());
          break;
        default:
          throw new Error(
            `Unsupported vendor onboarding provider: ${provider}`,
          );
      }
    }

    return this.providers.get(normalizedProvider)!;
  }
}
