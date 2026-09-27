import { stripe } from "../../../config/stripe.js";
import {
  IVendorOnboardingProvider,
  OnboardingLinkOptions,
  AccountStatusResult,
} from "../interfaces/vendor-onboarding.interface.js";

export class StripeVendorProvider implements IVendorOnboardingProvider {
  async createVendorAccount(
    ownerEmail: string,
    tenantData: { id: string; name: string; slug: string },
  ): Promise<string> {
    const account = await stripe.accounts.create({
      type: "express",
      email: ownerEmail,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        tenantId: tenantData.id,
        tenantSlug: tenantData.slug,
      },
    });

    return account.id;
  }

  async generateOnboardingLink(
    stripeAccountId: string,
    options: OnboardingLinkOptions,
  ): Promise<string> {
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: options.refreshUrl,
      return_url: options.returnUrl,
      type: "account_onboarding",
    });

    return accountLink.url;
  }

  async checkAccountStatus(
    stripeAccountId: string,
  ): Promise<AccountStatusResult> {
    const account = await stripe.accounts.retrieve(stripeAccountId);

    return {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    };
  }
}
