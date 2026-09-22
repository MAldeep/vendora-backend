import { Router, raw } from "express";
import { WebhookController } from "../controllers/webhook.controller.js";

const router = Router();

router.post(
  "/stripe",
  raw({ type: "application/json" }),
  WebhookController.handleStripeWebhook,
);

export default router;
