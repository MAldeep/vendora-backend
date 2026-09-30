import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/restrictTo.js";
import { requireTenant } from "../middleware/requireTenant.middleware.js";
import { CustomRoleControllers } from "../controllers/customRole.controllers.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createCustomRoleSchema,
  customRoleIdParamSchema,
  updateCustomRoleSchema,
} from "../validation/customRole.schemas.js";

const router = Router();

router.use(protect);
router.use(requireTenant);
router.use(restrictTo("OWNER", "MANAGER"));

/**
 * @openapi
 * /api/v1/customRoles/roles:
 *   get:
 *     summary: Get all custom roles for the current tenant
 *     tags:
 *       - Custom Roles
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the custom roles
 *     responses:
 *       200:
 *         description: Custom roles successfully retrieved.
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                         nullable: true
 *                       permissions:
 *                         type: array
 *                         items:
 *                           type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       _count:
 *                         type: object
 *                         properties:
 *                           tenantUserRoles:
 *                             type: integer
 *       403:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router
  .route("/roles")
  .get(CustomRoleControllers.getAll)
  .post(validate(createCustomRoleSchema), CustomRoleControllers.create);

/**
 * @openapi
 * /api/v1/customRoles/roles:
 *   post:
 *     summary: Create a custom role for the tenant
 *     tags:
 *       - Custom Roles
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the custom role
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - permissions
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: Support Lead
 *               description:
 *                 type: string
 *                 maxLength: 255
 *                 nullable: true
 *                 example: Manages customer support workflows
 *               permissions:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: string
 *                   enum:
 *                     - MANAGE_TENANT_SETTINGS
 *                     - VIEW_ANALYTICS
 *                     - CREATE_PRODUCT
 *                     - UPDATE_PRODUCT
 *                     - DELETE_PRODUCT
 *                     - VIEW_PRODUCTS
 *                     - MANAGE_ORDERS
 *                     - VIEW_ORDERS
 *                     - INVITE_USER
 *                     - DELETE_USER
 *                 example:
 *                   - VIEW_PRODUCTS
 *                   - VIEW_ORDERS
 *                   - INVITE_USER
 *     responses:
 *       201:
 *         description: Custom role created successfully.
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
 *                   example: Role Added Successfully!
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                       nullable: true
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     tenantId:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */

/**
 * @openapi
 * /api/v1/customRoles/roles/{id}:
 *   get:
 *     summary: Get a custom role by ID with assigned user members
 *     tags:
 *       - Custom Roles
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the custom role
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Custom role ID
 *     responses:
 *       200:
 *         description: Custom role fetched successfully.
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
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                       nullable: true
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     tenantUserRoles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               fullName:
 *                                 type: string
 *                               email:
 *                                 type: string
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router
  .route("/roles/:id")
  .get(validate(customRoleIdParamSchema), CustomRoleControllers.getById)
  .patch(validate(updateCustomRoleSchema), CustomRoleControllers.update)
  .delete(validate(customRoleIdParamSchema), CustomRoleControllers.delete);

/**
 * @openapi
 * /api/v1/customRoles/roles/{id}:
 *   patch:
 *     summary: Update a custom role in the current tenant
 *     tags:
 *       - Custom Roles
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the custom role
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Custom role ID
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
 *                 maxLength: 50
 *                 example: Operations Lead
 *               description:
 *                 type: string
 *                 maxLength: 255
 *                 nullable: true
 *                 example: Updated role description
 *               permissions:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: string
 *                   enum:
 *                     - MANAGE_TENANT_SETTINGS
 *                     - VIEW_ANALYTICS
 *                     - CREATE_PRODUCT
 *                     - UPDATE_PRODUCT
 *                     - DELETE_PRODUCT
 *                     - VIEW_PRODUCTS
 *                     - MANAGE_ORDERS
 *                     - VIEW_ORDERS
 *                     - INVITE_USER
 *                     - DELETE_USER
 *                 example:
 *                   - VIEW_PRODUCTS
 *                   - INVITE_USER
 *     responses:
 *       200:
 *         description: Custom role updated successfully.
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
 *                   example: Role updated successfully
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */

/**
 * @openapi
 * /api/v1/customRoles/roles/{id}:
 *   delete:
 *     summary: Delete a custom role from the tenant if it is not assigned to any users
 *     tags:
 *       - Custom Roles
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the custom role
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Custom role ID to delete
 *     responses:
 *       200:
 *         description: Custom role deleted successfully.
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
 *                   example: Custom role deleted successfully!
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */

export default router;
