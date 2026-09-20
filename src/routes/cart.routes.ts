import { Router } from "express";
import { requireTenant } from "../middleware/requireTenant.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  addToCartSchema,
  getCartSchema,
  updateCartItemSchema,
} from "../validation/cart.schema.js";
import { CartControllers } from "../controllers/cart.controllers.js";

const cartRouter = Router({ mergeParams: true });

cartRouter.post(
  "/items",
  requireTenant,
  validate(addToCartSchema),
  CartControllers.addToCart,
);

cartRouter.get(
  "/",
  requireTenant,
  validate(getCartSchema),
  CartControllers.getCart,
);

// PATCH /api/v1/tenants/:tenantId/cart/items/:itemId
cartRouter.patch(
  "/items/:itemId",
  requireTenant,
  validate(updateCartItemSchema),
  CartControllers.updateCartItemQuantity,
);
export default cartRouter;
