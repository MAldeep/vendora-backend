export interface OnboardingLinkOptions {
  returnUrl: string;
  refreshUrl: string;
}

export interface AccountStatusResult {
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted?: boolean;
}

export interface IVendorOnboardingProvider {
  createVendorAccount(
    ownerEmail: string,
    tenantData: { id: string; name: string; slug: string },
  ): Promise<string>;

  generateOnboardingLink(
    providerAccountId: string,
    options: OnboardingLinkOptions,
  ): Promise<string | null>;

  checkAccountStatus(providerAccountId: string): Promise<AccountStatusResult>;
}
