import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import {
  cancelOrderSchema,
  checkoutSchema,
  trackOrderSchema,
} from "../validation/order.schema.js";
import { OrderControllers } from "../controllers/order.controllers.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();
/**
 * @openapi
 * /api/v1/payments/checkout:
 *   post:
 *     summary: Process cart checkout and generate payment gateway session
 *     tags:
 *       - Payments
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         schema:
 *           type: string
 *         description: Optional tenant ID context if applicable
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *               - paymentGateway
 *             properties:
 *               shippingAddress:
 *                 type: string
 *                 example: "123 Nile Street, Cairo, Egypt"
 *               paymentGateway:
 *                 type: string
 *                 enum: [STRIPE, PAYMOB]
 *                 example: "STRIPE"
 *               sessionId:
 *                 type: string
 *                 example: "cart_sess_98765"
 *               guestName:
 *                 type: string
 *                 example: "Ahmed Mohamed"
 *               guestEmail:
 *                 type: string
 *                 example: "ahmed@example.com"
 *               guestPhone:
 *                 type: string
 *                 example: "+201001234567"
 *     responses:
 *       201:
 *         description: MasterOrder created and payment session initialized successfully.
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.post(
  "/checkout",
  optionalAuth,
  validate(checkoutSchema),
  OrderControllers.checkout,
);
router.get("/my-orders", protect, OrderControllers.getMyOrders);
router.get("/track", validate(trackOrderSchema), OrderControllers.trackOrder);
router.patch(
  "/:orderId/cancel",
  optionalAuth,
  validate(cancelOrderSchema),
  OrderControllers.cancelOrder,
);
export default router;
