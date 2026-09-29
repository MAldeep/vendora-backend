import prisma from "../config/prisma.js";
import { AppError } from "../utils/appError.js";
import {
  PaymentProviderType,
  VendorOnboardingFactory,
} from "./payment/factories/vendor-onboarding.factory.js";

export class TenantOnboardingService {
  static async initiateOnboarding(params: {
    tenantId: string;
    provider: PaymentProviderType;
    returnUrl: string;
    refreshUrl: string;
  }) {
    const { tenantId, provider, refreshUrl, returnUrl } = params;
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
      },
      include: { owner: true },
    });
    if (!tenant) {
      throw new AppError(`Tenant with ID ${tenantId} not found.`, 404);
    }
    const onboardingProvider = VendorOnboardingFactory.getProvider(provider);
    let providerAccountId =
      provider === "STRIPE"
        ? tenant.stripeAccountId
        : tenant.paymobSubMerchantId;
    // IF no provider Account Id registered in db
    if (!providerAccountId) {
      // create one
      providerAccountId = await onboardingProvider.createVendorAccount(
        tenant.owner.email,
        {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
      );
      // update provider in db immediately
      if (provider === "STRIPE") {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { stripeAccountId: providerAccountId },
        });
      } else if (provider === "PAYMOB") {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { paymobSubMerchantId: providerAccountId },
        });
      }
    }

    const onboardingUrl = await onboardingProvider.generateOnboardingLink(
      providerAccountId,
      { returnUrl, refreshUrl },
    );
    return {
      providerAccountId,
      onboardingUrl,
    };
  }

  static async syncAccountStatus(
    tenantId: string,
    provider: PaymentProviderType,
  ) {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new AppError(`Tenant with ID ${tenantId} not found.`, 404);
    }
    const providerAccountId =
      provider === "STRIPE"
        ? tenant.stripeAccountId
        : tenant.paymobSubMerchantId;

    if (!providerAccountId) {
      throw new AppError(
        `No \({provider} account ID found for tenant\){tenantId}.`,
        404,
      );
    }
    const onboardingProvider = VendorOnboardingFactory.getProvider(provider);
    const status =
      await onboardingProvider.checkAccountStatus(providerAccountId);
    if (provider === "STRIPE") {
      return await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          stripeChargesEnabled: status.chargesEnabled,
          stripePayoutsEnabled: status.payoutsEnabled,
          stripeOnboardingComplete: status.detailsSubmitted,
        },
      });
    } else {
      return await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          paymobOnboardingComplete: status.detailsSubmitted,
        },
      });
    }
  }
}
