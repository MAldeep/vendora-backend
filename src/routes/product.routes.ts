import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createProductSchema,
  productIdParamSchema,
  updateProductSchema,
} from "../validation/product.schemas.js";
import { ProductControllers } from "../controllers/product.controllers.js";
import { uploadProductImages } from "../middleware/upload.middleware.js";
import variantRouter from "./productVariants.routes.js";
import { requireTenant } from "../middleware/requireTenant.middleware.js";

const router = Router();

router.use(protect);
router.use(requireTenant);
/*
  Variants Routes
*/
router.use("/:id/variants", variantRouter);
/*
  Product Routes
*/
/**
 * @openapi
 * /api/v1/products:
 *   get:
 *     summary: Get all products for the current tenant with filtering and pagination
 *     tags:
 *       - Products
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for product queries
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
 *       - in: query
 *         name: sort
 *         required: false
 *         schema:
 *           type: string
 *         description: Sort field like price:asc or createdAt:desc
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Search text across title, slug, or sku
 *     responses:
 *       200:
 *         description: Products retrieved successfully.
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
 *                   example: Products retrieved successfully!
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 meta:
 *                   type: object
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router
  .route("/")
  .get(requirePermission("VIEW_PRODUCTS"), ProductControllers.getAll)
  .post(
    requirePermission("CREATE_PRODUCT"),
    uploadProductImages,
    validate(createProductSchema),
    ProductControllers.create,
  );

/**
 * @openapi
 * /api/v1/products:
 *   post:
 *     summary: Create a product with optional images and variants for the current tenant
 *     tags:
 *       - Products
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the new product
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - categoryId
 *               - price
 *               - sku
 *             properties:
 *               title:
 *                 type: string
 *                 example: Wireless Headphones
 *               slug:
 *                 type: string
 *                 example: wireless-headphones
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 example: "11111111-1111-1111-1111-111111111111"
 *               description:
 *                 type: string
 *                 example: Noise-cancelling wireless headphones
 *               price:
 *                 type: number
 *                 example: 899.99
 *               compareAtPrice:
 *                 type: number
 *                 example: 1099.99
 *               sku:
 *                 type: string
 *                 example: WH-100
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED, ARCHIVED]
 *                 example: PUBLISHED
 *               isFeatured:
 *                 type: boolean
 *                 example: true
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: Black
 *                     sku:
 *                       type: string
 *                       example: WH-100-BLK
 *                     price:
 *                       type: number
 *                       example: 899.99
 *                     stockQuantity:
 *                       type: integer
 *                       example: 25
 *                     attributes:
 *                       type: object
 *                       additionalProperties:
 *                         anyOf:
 *                           - type: string
 *                           - type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Product created successfully.
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
 *                   example: Product created successfully!
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */

/**
 * @openapi
 * /api/v1/products/{id}:
 *   get:
 *     summary: Get a product by ID within the current tenant
 *     tags:
 *       - Products
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the product
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully.
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
 *                   example: Product retrieved successfully
 *                 data:
 *                   type: object
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router
  .route("/:id")
  .get(
    requirePermission("VIEW_PRODUCTS"),
    validate(productIdParamSchema),
    ProductControllers.getById,
  )
  .patch(
    requirePermission("UPDATE_PRODUCT"),
    uploadProductImages,
    validate(updateProductSchema),
    ProductControllers.update,
  )
  .delete(
    requirePermission("DELETE_PRODUCT"),
    validate(productIdParamSchema),
    ProductControllers.delete,
  );

/**
 * @openapi
 * /api/v1/products/{id}:
 *   patch:
 *     summary: Update a product in the current tenant
 *     tags:
 *       - Products
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the product
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Headphones
 *               slug:
 *                 type: string
 *                 example: updated-headphones
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               compareAtPrice:
 *                 type: number
 *               sku:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED, ARCHIVED]
 *               isFeatured:
 *                 type: boolean
 *               stockQuantity:
 *                 type: integer
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Product updated successfully.
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
 *                   example: Product updated successfully!
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */

/**
 * @openapi
 * /api/v1/products/{id}:
 *   delete:
 *     summary: Delete a product from the current tenant
 *     tags:
 *       - Products
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the product
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully.
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
 *                   example: Product deleted successfully!
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
export default router;
