import { AppError } from "../utils/appError.js";
import { env } from "./env.js";
const getPaymobConfig = () => {
    const apiKey = env.PAYMOB_API_KEY;
    const hmacSecret = env.PAYMOB_HMAC_SECRET;
    if (!apiKey) {
        throw new AppError("PAYMOB_API_KEY is missing in environment variables", 400);
    }
    if (!hmacSecret) {
        throw new AppError("PAYMOB_HMAC_SECRET is missing in environment variables", 400);
    }
    return {
        apiKey,
        hmacSecret,
        baseUrl: process.env.PAYMOB_BASE_URL || "https://accept.paymob.com/api",
        integrationIdCard: env.PAYMOB_INTEGRATION_ID,
        merchantId: env.PAYMOB_MERCHANT_ID,
    };
};
export const paymobConfig = getPaymobConfig();
