import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.middleware.js";
import { createVariantSchema, updateVariantSchema, } from "../validation/productVariant.schema.js";
import { ProductVariantsControllers } from "../controllers/productVariant.controllers.js";
const variantRouter = Router({ mergeParams: true });
variantRouter.use(protect);
/**
 * @openapi
 * /api/v1/products/{id}/variants:
 *   get:
 *     summary: Get all variants for a product in the current tenant
 *     tags:
 *       - Product Variants
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the product variant list
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product variants retrieved successfully.
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
 *                   example: Product variants retrieved successfully!
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
variantRouter
    .route("/")
    .get(requirePermission("VIEW_PRODUCTS"), ProductVariantsControllers.getAllByProductId)
    .post(requirePermission("CREATE_PRODUCT", "UPDATE_PRODUCT"), validate(createVariantSchema), ProductVariantsControllers.create);
/**
 * @openapi
 * /api/v1/products/{id}/variants:
 *   post:
 *     summary: Create a product variant for a product in the current tenant
 *     tags:
 *       - Product Variants
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the product variant
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - sku
 *               - attributes
 *             properties:
 *               title:
 *                 type: string
 *                 example: Red / XL
 *               sku:
 *                 type: string
 *                 example: SH-001-RED-XL
 *               price:
 *                 type: number
 *                 example: 499.99
 *               stockQuantity:
 *                 type: integer
 *                 example: 30
 *               attributes:
 *                 type: object
 *                 additionalProperties:
 *                   anyOf:
 *                     - type: string
 *                     - type: number
 *                 example:
 *                   color: Red
 *                   size: XL
 *     responses:
 *       201:
 *         description: Product variant created successfully.
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
 *                   example: Product Variant Created Successfully!
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
/**
 * @openapi
 * /api/v1/products/{id}/variants/{variantId}:
 *   get:
 *     summary: Get a single product variant by ID
 *     tags:
 *       - Product Variants
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the product variant
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Variant ID
 *     responses:
 *       200:
 *         description: Product variant retrieved successfully.
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
 *                   example: Product variant retrieved successfully!
 *                 data:
 *                   type: object
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
variantRouter
    .route("/:variantId")
    .get(requirePermission("VIEW_PRODUCTS"), ProductVariantsControllers.getById)
    .patch(requirePermission("UPDATE_PRODUCT"), validate(updateVariantSchema), ProductVariantsControllers.update)
    .delete(requirePermission("DELETE_PRODUCT"), ProductVariantsControllers.delete);
/**
 * @openapi
 * /api/v1/products/{id}/variants/{variantId}:
 *   patch:
 *     summary: Update a product variant in the current tenant
 *     tags:
 *       - Product Variants
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the product variant
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Variant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Green / L
 *               sku:
 *                 type: string
 *                 example: SH-001-GRN-L
 *               price:
 *                 type: number
 *                 example: 519.99
 *               stockQuantity:
 *                 type: integer
 *                 example: 20
 *               attributes:
 *                 type: object
 *                 additionalProperties:
 *                   anyOf:
 *                     - type: string
 *                     - type: number
 *     responses:
 *       200:
 *         description: Product variant updated successfully.
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
 *                   example: Product variant updated successfully!
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
/**
 * @openapi
 * /api/v1/products/{id}/variants/{variantId}:
 *   delete:
 *     summary: Delete a product variant from the current tenant
 *     tags:
 *       - Product Variants
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the product variant
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Variant ID
 *     responses:
 *       200:
 *         description: Product variant deleted successfully.
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
 *                   example: Product variant deleted successfully!
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
export default variantRouter;
