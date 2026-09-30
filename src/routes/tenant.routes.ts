import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import {
  createTenantSchema,
  getBySlugSchema,
} from "../validation/tenant.schemas.js";
import { TenantControllers } from "../controllers/tenant.controllers.js";
import { protect } from "../middleware/auth.middleware.js";
import { requireTenant } from "../middleware/requireTenant.middleware.js";
import { restrictTo } from "../middleware/restrictTo.js";
import inventoryRouter from "./inventory.routes.js";
import { uploadSingleImage } from "../middleware/upload.middleware.js";

const router = Router();

/*
  Inventory Routes
*/
router.use("/inventory", inventoryRouter);

/**
 * @openapi
 * /api/v1/tenants:
 *   post:
 *     summary: Create a new tenant/store for the authenticated user
 *     tags:
 *       - Tenants
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: Vendora HQ
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9-]+$'
 *                 example: vendora-hq
 *     responses:
 *       201:
 *         description: Tenant created successfully.
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
 *                   example: Tenant created successfully !
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       401:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router
  .route("/")
  .post(protect, validate(createTenantSchema), TenantControllers.create)
  /**
   * @openapi
   * /api/v1/tenants:
   *   get:
   *     summary: Get all tenants accessible to the authenticated user
   *     tags:
   *       - Tenants
   *     security:
   *       - BearerAuth: []
   *     parameters:
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
   *         description: Sort field like name:asc or createdAt:desc
   *       - in: query
   *         name: search
   *         required: false
   *         schema:
   *           type: string
   *         description: Search by tenant name or slug
   *     responses:
   *       200:
   *         description: Tenants retrieved successfully.
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
   *                   example: 2
   *                 data:
   *                   type: object
   *                   properties:
   *                     tenants:
   *                       type: array
   *                       items:
   *                         type: object
   *                     meta:
   *                       type: object
   *       401:
   *         $ref: '#/components/schemas/AppErrorResponse'
   */
  .get(protect, TenantControllers.getAll);

/**
 * @openapi
 * /api/v1/tenants/{slug}:
 *   get:
 *     summary: Get a tenant by its unique slug
 *     tags:
 *       - Tenants
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant slug
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slug
 *             properties:
 *               slug:
 *                 type: string
 *                 example: vendora-hq
 *     responses:
 *       200:
 *         description: Tenant found.
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
 *                   example: Tenant found
 *                 data:
 *                   type: object
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router
  .route("/:slug")
  .get(protect, validate(getBySlugSchema), TenantControllers.getBySlug);

/**
 * @openapi
 * /api/v1/tenants/{id}:
 *   patch:
 *     summary: Update a tenant record for the owner
 *     tags:
 *       - Tenants
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context being updated
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tenant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: Updated Store Name
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9-]+$'
 *                 example: updated-store-name
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Tenant updated successfully.
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
 *                   example: Tenant Updated Successfully !
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router
  .route("/:id")
  .patch(protect, requireTenant, restrictTo("OWNER"), TenantControllers.update)
  /**
   * @openapi
   * /api/v1/tenants/{id}:
   *   delete:
   *     summary: Delete an existing tenant/store
   *     tags:
   *       - Tenants
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: header
   *         name: x-tenant-id
   *         required: true
   *         schema:
   *           type: string
   *         description: Tenant context being deleted
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Tenant ID
   *     responses:
   *       200:
   *         description: Tenant deleted successfully.
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
   *                   example: Tenant deleted successfully
   *       403:
   *         $ref: '#/components/schemas/AppErrorResponse'
   *       404:
   *         $ref: '#/components/schemas/AppErrorResponse'
   */
  .delete(
    protect,
    requireTenant,
    restrictTo("OWNER"),
    TenantControllers.delete,
  );

/**
 * @openapi
 * /api/v1/tenants/status:
 *   patch:
 *     summary: Toggle the active/inactive status of the current tenant
 *     tags:
 *       - Tenants
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context whose status will change
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 example: "11111111-1111-1111-1111-111111111111"
 *     responses:
 *       200:
 *         description: Tenant status updated successfully.
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
 *                   example: Tenant's Status Updated Successfully !
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.patch(
  "/status",
  protect,
  requireTenant,
  restrictTo("OWNER"),
  TenantControllers.toggleStatus,
);

/**
 * @openapi
 * /api/v1/tenants/logo:
 *   patch:
 *     summary: Upload or replace the current tenant logo
 *     tags:
 *       - Tenants
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant whose logo is being updated
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Tenant logo image file
 *     responses:
 *       200:
 *         description: Tenant logo updated successfully.
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
 *                   example: Tenant Logo Updated Successfully !
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.patch(
  "/logo",
  protect,
  requireTenant,
  restrictTo("OWNER", "MANAGER"),
  uploadSingleImage,
  TenantControllers.addOrUpdateLogo,
);

export default router;
