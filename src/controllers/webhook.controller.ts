import { WebhookService } from "../services/webhook.service.js";
import { AppError } from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { Request, Response } from "express";

export class WebhookController {
  static handleStripeWebhook = catchAsync(
    async (req: Request, res: Response) => {
      const signature = req.headers["stripe-signature"] as string;
      if (!signature) {
        throw new AppError("Missing stripe-signature header", 400);
      }
      const rawBody = req.body;
      const result = await WebhookService.handleWebhook({
        provider: "STRIPE",
        rawBody: rawBody,
        signature: signature,
      });
      res.status(200).json({
        received: true,
        result,
      });
    },
  );
  static handlePaymobWebhook = catchAsync(
    async (req: Request, res: Response) => {
      const signature =
        (req.query.hmac as string) ||
        (req.body.obj?.hmac as string) ||
        (req.headers["x-paymob-hmac"] as string);

      const payload = req.body;

      const result = await WebhookService.handleWebhook({
        provider: "PAYMOB",
        rawBody:
          typeof payload === "string" ? payload : JSON.stringify(payload),
        signature: signature || "",
      });

      res.status(200).json({
        received: true,
        result,
      });
    },
  );
}
