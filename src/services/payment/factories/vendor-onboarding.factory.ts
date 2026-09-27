import { PaymentGateway } from "@prisma/client";
import { IVendorOnboardingProvider } from "../interfaces/vendor-onboarding.interface.js";
import { StripeVendorProvider } from "../providers/stripe-vendor.provider.js";
import { PaymobVendorProvider } from "../providers/paymob-vendor.provider.js";

export class VendorOnboardingFactory {
  private static stripeProvider = new StripeVendorProvider();
  private static paymobProvider = new PaymobVendorProvider();

  static getProvider(gateway: PaymentGateway): IVendorOnboardingProvider {
    switch (gateway) {
      case PaymentGateway.STRIPE:
        return this.stripeProvider;

      case PaymentGateway.PAYMOB:
        return this.paymobProvider;

      default:
        throw new Error(
          `Onboarding is not supported for payment gateway: ${gateway}`,
        );
    }
  }
}
