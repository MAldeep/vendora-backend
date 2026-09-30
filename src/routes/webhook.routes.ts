import { Router, raw } from "express";
import { WebhookController } from "../controllers/webhook.controller.js";

const router = Router();

/**
 * @openapi
 * /api/v1/webhooks/stripe:
 *   post:
 *     summary: Receive Stripe webhook events for payment and account updates
 *     tags:
 *       - Webhooks
 *     security: []
 *     parameters:
 *       - in: header
 *         name: stripe-signature
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe event signature used to verify the request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Raw Stripe event payload
 *     responses:
 *       200:
 *         description: Stripe webhook processed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *                 result:
 *                   type: object
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.post(
  "/stripe",
  raw({ type: "application/json" }),
  WebhookController.handleStripeWebhook,
);

/**
 * @openapi
 * /api/v1/webhooks/paymob:
 *   post:
 *     summary: Receive Paymob webhook events for payment and account status updates
 *     tags:
 *       - Webhooks
 *     security: []
 *     parameters:
 *       - in: query
 *         name: hmac
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional Paymob HMAC value passed in the query string
 *       - in: header
 *         name: x-paymob-hmac
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional Paymob HMAC value passed in headers
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Paymob webhook payload
 *     responses:
 *       200:
 *         description: Paymob webhook processed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *                 result:
 *                   type: object
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.post("/paymob", WebhookController.handlePaymobWebhook);

export default router;
