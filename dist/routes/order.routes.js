import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import { cancelOrderSchema, checkoutSchema, trackOrderSchema, } from "../validation/order.schema.js";
import { OrderControllers } from "../controllers/order.controllers.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { protect } from "../middleware/auth.middleware.js";
const router = Router();
/**
 * @openapi
 * /api/v1/orders/checkout:
 *   post:
 *     summary: Create a checkout session from the current cart and reserve stock for the order
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: header
 *         name: x-session-id
 *         required: false
 *         schema:
 *           type: string
 *         description: Guest cart session ID used when the customer is not logged in
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 required:
 *                   - fullName
 *                   - street
 *                   - city
 *                   - country
 *                   - phone
 *                 properties:
 *                   fullName:
 *                     type: string
 *                     example: Ahmed Mohamed
 *                   street:
 *                     type: string
 *                     example: 12 Nile Street
 *                   city:
 *                     type: string
 *                     example: Cairo
 *                   state:
 *                     type: string
 *                     nullable: true
 *                     example: Cairo Governorate
 *                   postalCode:
 *                     type: string
 *                     nullable: true
 *                     example: "11511"
 *                   country:
 *                     type: string
 *                     example: Egypt
 *                   phone:
 *                     type: string
 *                     example: "+201001234567"
 *               paymentGateway:
 *                 type: string
 *                 enum: [STRIPE, PAYMOB, COD]
 *                 default: COD
 *                 example: STRIPE
 *               sessionId:
 *                 type: string
 *                 nullable: true
 *                 example: guest-cart-session-123
 *               guestName:
 *                 type: string
 *                 nullable: true
 *                 example: Ahmed Mohamed
 *               guestEmail:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *                 example: guest@example.com
 *               guestPhone:
 *                 type: string
 *                 nullable: true
 *                 example: "+201001234567"
 *     responses:
 *       201:
 *         description: Checkout session created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Order placed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     masterOrder:
 *                       type: object
 *                     paymentSession:
 *                       type: object
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.post("/checkout", optionalAuth, validate(checkoutSchema), OrderControllers.checkout);
/**
 * @openapi
 * /api/v1/orders/my-orders:
 *   get:
 *     summary: Get the authenticated user's order history
 *     tags:
 *       - Orders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Rows per page
 *       - in: query
 *         name: sort
 *         required: false
 *         schema:
 *           type: string
 *         description: Sort expression such as createdAt:desc
 *     responses:
 *       200:
 *         description: User orders retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.get("/my-orders", protect, OrderControllers.getMyOrders);
/**
 * @openapi
 * /api/v1/orders/track:
 *   get:
 *     summary: Track an order by order ID and email
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: query
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Master order ID to track
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email linked to the order or guest account
 *     responses:
 *       200:
 *         description: Order details retrieved for tracking.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: object
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.get("/track", validate(trackOrderSchema), OrderControllers.trackOrder);
/**
 * @openapi
 * /api/v1/orders/{orderId}/cancel:
 *   patch:
 *     summary: Cancel a pending order for the logged-in user or guest customer
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID to cancel
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *                 example: guest@example.com
 *               reason:
 *                 type: string
 *                 nullable: true
 *                 example: Customer changed mind
 *     responses:
 *       200:
 *         description: Order cancelled successfully and stock restored.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Order cancelled successfully and stock restored
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: object
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.patch("/:orderId/cancel", optionalAuth, validate(cancelOrderSchema), OrderControllers.cancelOrder);
export default router;
