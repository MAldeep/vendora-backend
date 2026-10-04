import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import { requireTenant } from "../middleware/requireTenant.middleware.js";
import { CategoryControllers } from "../controllers/category.controllers.js";
import { createCategorySchema, categoryIdParamSchema, updateCategorySchema, } from "../validation/category.schemas.js";
const categoryRouter = Router();
categoryRouter.use(requireTenant);
/**
 * @openapi
 * /api/v1/categories:
 *   post:
 *     summary: Create a category for the current tenant
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Electronics
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
 *                 example: electronics
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 nullable: true
 *                 example: Consumer electronics and accessories
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: "11111111-1111-1111-1111-111111111111"
 *     responses:
 *       201:
 *         description: Category created successfully.
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
 *                   example: Category Created Successfully !
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
categoryRouter.post("/", validate(createCategorySchema), CategoryControllers.create);
/**
 * @openapi
 * /api/v1/categories:
 *   get:
 *     summary: Get all categories for the current tenant
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the category listing
 *     responses:
 *       200:
 *         description: Tenant categories retrieved successfully.
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
 *                       slug:
 *                         type: string
 *                       description:
 *                         type: string
 *                         nullable: true
 *                       isActive:
 *                         type: boolean
 *                       parentId:
 *                         type: string
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       parent:
 *                         type: object
 *                         nullable: true
 *                       children:
 *                         type: array
 *                         items:
 *                           type: object
 *                       _count:
 *                         type: object
 *                         properties:
 *                           products:
 *                             type: integer
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
categoryRouter.get("/", CategoryControllers.getAll);
/**
 * @openapi
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Get a tenant category by ID
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the category
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category details retrieved successfully.
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
 *                     slug:
 *                       type: string
 *                     description:
 *                       type: string
 *                       nullable: true
 *                     isActive:
 *                       type: boolean
 *                     parentId:
 *                       type: string
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     parent:
 *                       type: object
 *                       nullable: true
 *                     children:
 *                       type: array
 *                       items:
 *                         type: object
 *                     _count:
 *                       type: object
 *                       properties:
 *                         products:
 *                           type: integer
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
categoryRouter.get("/:id", validate(categoryIdParamSchema), CategoryControllers.getById);
/**
 * @openapi
 * /api/v1/categories/{id}:
 *   patch:
 *     summary: Update a category in the current tenant
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the category
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID to update
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
 *                 maxLength: 100
 *                 example: Home Appliances
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
 *                 example: home-appliances
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 nullable: true
 *                 example: Updated description
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: "22222222-2222-2222-2222-222222222222"
 *     responses:
 *       200:
 *         description: Category updated successfully.
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
 *                   example: Category updated successfully!
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
categoryRouter.patch("/:id", validate(updateCategorySchema), CategoryControllers.update);
/**
 * @openapi
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: Delete a category from the current tenant
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the category
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID to delete
 *     responses:
 *       200:
 *         description: Category deleted successfully.
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
 *                   example: Category deleted successfully!
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
categoryRouter.delete("/:id", validate(categoryIdParamSchema), CategoryControllers.delete);
export default categoryRouter;
