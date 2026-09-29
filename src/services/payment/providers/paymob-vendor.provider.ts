import axios from "axios";
import {
  AccountStatusResult,
  IVendorOnboardingProvider,
  OnboardingLinkOptions,
} from "../interfaces/vendor-onboarding.interface.js";
import { paymobConfig } from "../../../config/paymob.js";

export class PaymobVendorProvider implements IVendorOnboardingProvider {
  async createVendorAccount(
    ownerEmail: string,
    tenantData: { id: string; name: string; slug: string },
  ): Promise<string> {
    const response = await axios.post(
      `${paymobConfig.baseUrl}/api/ecommerce/sub-merchants`,
      {
        email: ownerEmail,
        name: tenantData.name,
        metadata: {
          tenantId: tenantData.id,
          tenantSlug: tenantData.slug,
        },
      },
      {
        headers: {
          Authorization: `Token ${paymobConfig.apiKey}`,
        },
      },
    );
    return response.data.id.toString();
  }

  async generateOnboardingLink(
    _providerAccountId: string,
    _options: OnboardingLinkOptions,
  ): Promise<string | null> {
    return null;
  }

  async checkAccountStatus(
    providerAccountId: string,
  ): Promise<AccountStatusResult> {
    const response = await axios.get(
      `${paymobConfig.baseUrl}/api/ecommerce/sub-merchants/${providerAccountId}`,
      {
        headers: {
          Authorization: `Token ${paymobConfig.apiKey}`,
        },
      },
    );

    const isApproved = response.data.is_approved ?? false;

    return {
      chargesEnabled: isApproved,
      payoutsEnabled: isApproved,
      detailsSubmitted: true,
    };
  }
}
