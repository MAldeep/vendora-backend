import { stripe } from "../../../config/stripe.js";
import {
  AccountStatusResult,
  IVendorOnboardingProvider,
  OnboardingLinkOptions,
} from "../interfaces/vendor-onboarding.interface.js";

export class StripeVendorProvider implements IVendorOnboardingProvider {
  async createVendorAccount(
    ownerEmail: string,
    tenantData: { id: string; name: string; slug: string },
  ): Promise<string> {
    const account = await stripe.accounts.create({
      type: "express",
      email: ownerEmail,
      metadata: {
        tenantId: tenantData.id,
        tenantSlug: tenantData.slug,
      },
      business_profile: {
        name: tenantData.name,
      },
    });
    return account.id;
  }
  async generateOnboardingLink(
    providerAccountId: string,
    options: OnboardingLinkOptions,
  ): Promise<string | null> {
    const accountLink = await stripe.accountLinks.create({
      account: providerAccountId,
      refresh_url: options.refreshUrl,
      return_url: options.returnUrl,
      type: "account_onboarding",
    });
    return accountLink.url;
  }
  async checkAccountStatus(
    providerAccountId: string,
  ): Promise<AccountStatusResult> {
    const account = await stripe.accounts.retrieve(providerAccountId);
    return {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    };
  }
}
