import { stripe } from "../../../config/stripe.js";
export class StripeVendorProvider {
    async createVendorAccount(ownerEmail, tenantData) {
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
    async generateOnboardingLink(providerAccountId, options) {
        const accountLink = await stripe.accountLinks.create({
            account: providerAccountId,
            refresh_url: options.refreshUrl,
            return_url: options.returnUrl,
            type: "account_onboarding",
        });
        return accountLink.url;
    }
    async checkAccountStatus(providerAccountId) {
        const account = await stripe.accounts.retrieve(providerAccountId);
        return {
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            detailsSubmitted: account.details_submitted,
        };
    }
}
