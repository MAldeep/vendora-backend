import axios from "axios";
import { paymobConfig } from "../../../config/paymob.js";
export class PaymobVendorProvider {
    async createVendorAccount(ownerEmail, tenantData) {
        const response = await axios.post(`${paymobConfig.baseUrl}/api/ecommerce/sub-merchants`, {
            email: ownerEmail,
            name: tenantData.name,
            metadata: {
                tenantId: tenantData.id,
                tenantSlug: tenantData.slug,
            },
        }, {
            headers: {
                Authorization: `Token ${paymobConfig.apiKey}`,
            },
        });
        return response.data.id.toString();
    }
    async generateOnboardingLink(_providerAccountId, _options) {
        return null;
    }
    async checkAccountStatus(providerAccountId) {
        const response = await axios.get(`${paymobConfig.baseUrl}/api/ecommerce/sub-merchants/${providerAccountId}`, {
            headers: {
                Authorization: `Token ${paymobConfig.apiKey}`,
            },
        });
        const isApproved = response.data.is_approved ?? false;
        return {
            chargesEnabled: isApproved,
            payoutsEnabled: isApproved,
            detailsSubmitted: true,
        };
    }
}
