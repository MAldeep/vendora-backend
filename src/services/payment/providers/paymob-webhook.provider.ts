import { paymobConfig } from "../../../config/paymob.js";
import { AppError } from "../../../utils/appError.js";
import {
  IWebhookHandlerProvider,
  StandardWebhookEvent,
} from "../interfaces/webhook-handler.interface.js";
import crypto from "crypto";
export class PaymobWebhookProvider implements IWebhookHandlerProvider {
  async verifyAndParseEvent(
    rawBody: Buffer | string,
    signature: string | Record<string, unknown>,
    secret?: string,
  ): Promise<StandardWebhookEvent> {
    const hmacSecret = secret || paymobConfig.hmacSecret;

    const payload: Record<string, any> =
      typeof signature === "object" && signature !== null ? signature : {};
    const obj: Record<string, any> = payload.obj || payload;
    const receivedHmac = payload.hmac || payload["obj[hmac]"];

    if (!receivedHmac) {
      throw new AppError("Paymob HMAC signature is missing.", 400);
    }

    const concatenatedParams = [
      obj.amount_cents,
      obj.created_at,
      obj.currency,
      obj.error_occured,
      obj.has_parent_transaction,
      obj.id,
      obj.integration_id,
      obj.is_3d_secure,
      obj.is_auth,
      obj.is_capture,
      obj.is_refunded,
      obj.is_standalone_payment,
      obj.pending,
      obj.owner,
      obj.order?.id ?? obj["order.id"],
    ].join("");

    const calculatedHmac = crypto
      .createHmac("sha512", hmacSecret)
      .update(concatenatedParams)
      .digest("hex");

    if (calculatedHmac.toLowerCase() !== String(receivedHmac).toLowerCase()) {
      throw new Error("Paymob HMAC signature verification failed.");
    }

    const isSuccess =
      (obj.success === true || obj.success === "true") &&
      (obj.pending === false || obj.pending === "false");

    const eventType: StandardWebhookEvent["type"] = isSuccess
      ? "PAYMENT_SUCCESS"
      : "PAYMENT_FAILED";

    return {
      type: eventType,
      eventId: String(obj.id),
      data: {
        orderId: String(
          obj.order?.merchant_order_id || obj.merchant_order_id || "",
        ),
        providerTransactionId: String(obj.id),
        amount: Number(obj.amount_cents),
        currency: String(obj.currency).toUpperCase(),
        rawPayload: payload,
      },
    };
  }
}
