import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requireTenant } from "../middleware/requireTenant.middleware.js";
import { requirePermission } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.middleware.js";
import { getTenantOrdersSchema, updateOrderStatusSchema, } from "../validation/order.schema.js";
import { OrderControllers } from "../controllers/order.controllers.js";
const router = Router();
router.use(protect);
/**
 * @openapi
 * /api/v1/tenantsOrders:
 *   get:
 *     summary: Get all orders for the current tenant
 *     tags:
 *       - Tenant Orders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for order queries
 *       - in: query
 *         name: orderStatus
 *         required: false
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Search by order ID or master order ID
 *       - in: query
 *         name: sort
 *         required: false
 *         schema:
 *           type: string
 *         description: Sort field like createdAt:desc
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Tenant orders retrieved successfully.
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
 *                   example: 4
 *                 pagination:
 *                   type: object
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.get("/", requireTenant, requirePermission("VIEW_ORDERS"), validate(getTenantOrdersSchema), OrderControllers.getTenantOrders);
/**
 * @openapi
 * /api/v1/tenantsOrders/{orderId}/status:
 *   patch:
 *     summary: Update the status of a tenant order and optionally restock on cancellation
 *     tags:
 *       - Tenant Orders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the order being updated
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tenant order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *                 example: SHIPPED
 *     responses:
 *       200:
 *         description: Order status updated successfully.
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
 *                   example: Order status updated to SHIPPED successfully
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.patch("/:orderId/status", requireTenant, requirePermission("MANAGE_ORDERS"), validate(updateOrderStatusSchema), OrderControllers.updateOrderStatus);
export default router;
