import axios from "axios";
import {
  IVendorOnboardingProvider,
  OnboardingLinkOptions,
  AccountStatusResult,
} from "../interfaces/vendor-onboarding.interface.js";
import { env } from "../../../config/env.js";

export class PaymobVendorProvider implements IVendorOnboardingProvider {
  private readonly baseUrl = "https://accept.paymob.com/api";

  private async getAuthToken(): Promise<string> {
    const apiKey = env.PAYMOB_API_KEY;
    if (!apiKey) {
      throw new Error("PAYMOB_API_KEY is missing in environment variables");
    }

    try {
      const response = await axios.post<{ token: string }>(
        `${this.baseUrl}/auth/tokens`,
        { api_key: apiKey },
      );
      return response.data.token;
    } catch (error: any) {
      throw new Error(
        `Paymob auth failed: ${
          error?.response?.data
            ? JSON.stringify(error.response.data)
            : error.message
        }`,
      );
    }
  }

  async createVendorAccount(
    ownerEmail: string,
    tenantData: { id: string; name: string; slug: string },
  ): Promise<string> {
    const token = await this.getAuthToken();

    try {
      const response = await axios.post<{ id: number | string }>(
        `${this.baseUrl}/ecommerce/sub-merchants`,
        {
          email: ownerEmail,
          company_name: tenantData.name,
          commercial_name: tenantData.slug,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return String(response.data.id);
    } catch (error: any) {
      throw new Error(
        `Failed to create Paymob sub-merchant: ${
          error?.response?.data
            ? JSON.stringify(error.response.data)
            : error.message
        }`,
      );
    }
  }

  async generateOnboardingLink(
    providerAccountId: string,
    options: OnboardingLinkOptions,
  ): Promise<string | null> {
    return null;
  }

  async checkAccountStatus(
    providerAccountId: string,
  ): Promise<AccountStatusResult> {
    try {
      const token = await this.getAuthToken();

      const response = await axios.get<{
        is_active?: boolean;
        is_verified?: boolean;
      }>(`${this.baseUrl}/ecommerce/sub-merchants/${providerAccountId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return {
        chargesEnabled: Boolean(response.data.is_active),
        payoutsEnabled: Boolean(response.data.is_active),
        detailsSubmitted: Boolean(response.data.is_verified),
      };
    } catch {
      return {
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      };
    }
  }
}
