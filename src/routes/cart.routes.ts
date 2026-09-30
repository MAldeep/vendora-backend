import { Router } from "express";
import { requireTenant } from "../middleware/requireTenant.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  addToCartSchema,
  clearCartSchema,
  getCartSchema,
  removeCartItemSchema,
  updateCartItemSchema,
} from "../validation/cart.schema.js";
import { CartControllers } from "../controllers/cart.controllers.js";
import { optionalAuth } from "../middleware/optionalAuth.js";

const cartRouter = Router();
cartRouter.use(optionalAuth);

/**
 * @openapi
 * /api/v1/cart/items:
 *   post:
 *     summary: Add a product variant to the tenant cart for either a logged-in user or guest session
 *     tags:
 *       - Cart
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the cart
 *       - in: header
 *         name: x-session-id
 *         required: false
 *         schema:
 *           type: string
 *         description: Guest cart session ID when the user is not authenticated
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - variantId
 *               - quantity
 *             properties:
 *               variantId:
 *                 type: string
 *                 format: uuid
 *                 example: "7f4d1a9e-1b08-4d54-97d6-3b0b29d9d3cf"
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *               sessionId:
 *                 type: string
 *                 nullable: true
 *                 example: "guest-cart-session-123"
 *     responses:
 *       200:
 *         description: Product variant was added to the cart successfully.
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
 *                   example: Item added to cart successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     cart:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         items:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               variantId:
 *                                 type: string
 *                               productTitle:
 *                                 type: string
 *                               variantTitle:
 *                                 type: string
 *                               sku:
 *                                 type: string
 *                               image:
 *                                 type: string
 *                                 nullable: true
 *                               unitPrice:
 *                                 type: number
 *                               quantity:
 *                                 type: integer
 *                               totalPrice:
 *                                 type: number
 *                               stockAvailable:
 *                                 type: integer
 *                               isAvailable:
 *                                 type: boolean
 *                         totalItems:
 *                           type: integer
 *                         subTotal:
 *                           type: number
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
cartRouter.post(
  "/items",
  requireTenant,
  validate(addToCartSchema),
  CartControllers.addToCart,
);

/**
 * @openapi
 * /api/v1/cart/items:
 *   get:
 *     summary: Fetch the current tenant cart for the logged-in user or guest session
 *     tags:
 *       - Cart
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the cart
 *       - in: query
 *         name: sessionId
 *         required: false
 *         schema:
 *           type: string
 *         description: Guest cart session identifier if the user is not authenticated
 *       - in: header
 *         name: x-session-id
 *         required: false
 *         schema:
 *           type: string
 *         description: Alternate guest session identifier header
 *     responses:
 *       200:
 *         description: Cart fetched successfully.
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
 *                     cart:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           nullable: true
 *                         items:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               variantId:
 *                                 type: string
 *                               productTitle:
 *                                 type: string
 *                               variantTitle:
 *                                 type: string
 *                               sku:
 *                                 type: string
 *                               image:
 *                                 type: string
 *                                 nullable: true
 *                               unitPrice:
 *                                 type: number
 *                               quantity:
 *                                 type: integer
 *                               totalPrice:
 *                                 type: number
 *                               stockAvailable:
 *                                 type: integer
 *                               isAvailable:
 *                                 type: boolean
 *                         totalItems:
 *                           type: integer
 *                         subTotal:
 *                           type: number
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
cartRouter.get(
  "/items",
  requireTenant,
  validate(getCartSchema),
  CartControllers.getCart,
);

/**
 * @openapi
 * /api/v1/cart/items/{itemId}:
 *   patch:
 *     summary: Update the quantity of a cart item within the tenant cart
 *     tags:
 *       - Cart
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the cart
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Cart item ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 3
 *               sessionId:
 *                 type: string
 *                 nullable: true
 *                 example: "guest-cart-session-123"
 *     responses:
 *       200:
 *         description: Cart item quantity updated successfully.
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
 *                   example: Cart item updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     cart:
 *                       type: object
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
cartRouter.patch(
  "/items/:itemId",
  requireTenant,
  validate(updateCartItemSchema),
  CartControllers.updateCartItemQuantity,
);

/**
 * @openapi
 * /api/v1/cart/items/{itemId}:
 *   delete:
 *     summary: Remove a cart item from the tenant cart
 *     tags:
 *       - Cart
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the cart
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Cart item ID to remove
 *       - in: query
 *         name: sessionId
 *         required: false
 *         schema:
 *           type: string
 *         description: Guest cart session identifier if the user is not authenticated
 *       - in: header
 *         name: x-session-id
 *         required: false
 *         schema:
 *           type: string
 *         description: Alternate guest session ID header
 *     responses:
 *       200:
 *         description: Cart item removed successfully.
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
 *                   example: Item removed from cart successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     cart:
 *                       type: object
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
cartRouter.delete(
  "/items/:itemId",
  requireTenant,
  validate(removeCartItemSchema),
  CartControllers.removeFromCart,
);

/**
 * @openapi
 * /api/v1/cart:
 *   delete:
 *     summary: Clear all items from the tenant cart for the current user or guest session
 *     tags:
 *       - Cart
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant context for the cart
 *       - in: query
 *         name: sessionId
 *         required: false
 *         schema:
 *           type: string
 *         description: Guest cart session identifier if the user is not authenticated
 *       - in: header
 *         name: x-session-id
 *         required: false
 *         schema:
 *           type: string
 *         description: Alternate guest session identifier header
 *     responses:
 *       200:
 *         description: Cart was cleared successfully.
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
 *                   example: Cart cleared successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     cart:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           nullable: true
 *                         items:
 *                           type: array
 *                           items:
 *                             type: object
 *                         totalItems:
 *                           type: integer
 *                         subTotal:
 *                           type: number
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
cartRouter.delete(
  "/",
  requireTenant,
  validate(clearCartSchema),
  CartControllers.clearCart,
);
export default cartRouter;
