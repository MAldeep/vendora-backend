import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requireTenant } from "../middleware/requireTenant.middleware.js";
import { requirePermission } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.middleware.js";
import { adjustStockSchema, getLowStockSchema, getMovementsSchema, } from "../validation/inventory.schema.js";
import { InventoryControllers } from "../controllers/inventory.controllers.js";
const inventoryRouter = Router({ mergeParams: true });
inventoryRouter.use(protect);
/**
 * @openapi
 * /api/v1/inventory/{variantId}/adjust:
 *   patch:
 *     summary: Adjust stock quantity for a product variant and record the movement
 *     tags:
 *       - Inventory
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the variant
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product variant ID to adjust
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantityDelta
 *               - reason
 *             properties:
 *               quantityDelta:
 *                 type: integer
 *                 description: Positive to add stock, negative to reduce stock
 *                 example: -3
 *               reason:
 *                 type: string
 *                 enum:
 *                   - PURCHASE_RESTOCK
 *                   - ORDER_RESERVATION
 *                   - ORDER_CANCELLED
 *                   - MANUAL_ADJUSTMENT
 *                   - RETURN_REFUND
 *                 example: MANUAL_ADJUSTMENT
 *               note:
 *                 type: string
 *                 maxLength: 500
 *                 nullable: true
 *                 example: Stock corrected after physical count
 *               referenceId:
 *                 type: string
 *                 nullable: true
 *                 example: INV-1024
 *     responses:
 *       200:
 *         description: Stock updated and movement recorded.
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
 *                   example: Stock adjusted Successfully !
 *                 variant:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     tenantId:
 *                       type: string
 *                     productId:
 *                       type: string
 *                     title:
 *                       type: string
 *                     sku:
 *                       type: string
 *                     stockQuantity:
 *                       type: integer
 *                 movement:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     tenantId:
 *                       type: string
 *                     variantId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     reason:
 *                       type: string
 *                     note:
 *                       type: string
 *                       nullable: true
 *                     referenceId:
 *                       type: string
 *                       nullable: true
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
inventoryRouter.patch("/:variantId/adjust", requireTenant, requirePermission("UPDATE_PRODUCT"), validate(adjustStockSchema), InventoryControllers.adjustStock);
/**
 * @openapi
 * /api/v1/inventory/low-stock:
 *   get:
 *     summary: Get product variants that are at or below the threshold stock level
 *     tags:
 *       - Inventory
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the inventory
 *       - in: query
 *         name: threshold
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 5
 *     responses:
 *       200:
 *         description: Low stock variants returned successfully.
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
 *                 message:
 *                   type: string
 *                   example: This is low stock variants
 *                 data:
 *                   type: object
 *                   properties:
 *                     variants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           product:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               slug:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                           stockQuantity:
 *                             type: integer
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
inventoryRouter.get("/low-stock", requireTenant, requirePermission("VIEW_PRODUCTS"), validate(getLowStockSchema), InventoryControllers.getLowStock);
/**
 * @openapi
 * /api/v1/inventory/movements:
 *   get:
 *     summary: Get inventory movement history for a tenant with filtering and pagination
 *     tags:
 *       - Inventory
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the inventory history
 *       - in: query
 *         name: variantId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by product variant ID
 *       - in: query
 *         name: reason
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - PURCHASE_RESTOCK
 *             - ORDER_RESERVATION
 *             - ORDER_CANCELLED
 *             - MANUAL_ADJUSTMENT
 *             - RETURN_REFUND
 *         description: Filter by stock movement reason
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Search note/reference text
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Items per page
 *       - in: query
 *         name: sort
 *         required: false
 *         schema:
 *           type: string
 *         description: Sort expression, e.g. createdAt:desc
 *     responses:
 *       200:
 *         description: Inventory movement history retrieved successfully.
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
 *                 message:
 *                   type: string
 *                   example: Movment history is retrieved !
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 data:
 *                   type: object
 *                   properties:
 *                     movements:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           variantId:
 *                             type: string
 *                           reason:
 *                             type: string
 *                           quantity:
 *                             type: integer
 *                           note:
 *                             type: string
 *                             nullable: true
 *                           referenceId:
 *                             type: string
 *                             nullable: true
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
inventoryRouter.get("/movements", requireTenant, requirePermission("VIEW_PRODUCTS"), validate(getMovementsSchema), InventoryControllers.getMovementsHistory);
export default inventoryRouter;
