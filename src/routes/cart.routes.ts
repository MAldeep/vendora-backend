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

const cartRouter = Router({ mergeParams: true });

cartRouter.post(
  "/items",
  requireTenant,
  validate(addToCartSchema),
  CartControllers.addToCart,
);

cartRouter.get(
  "/items",
  requireTenant,
  validate(getCartSchema),
  CartControllers.getCart,
);

cartRouter.patch(
  "/items/:itemId",
  requireTenant,
  validate(updateCartItemSchema),
  CartControllers.updateCartItemQuantity,
);

cartRouter.delete(
  "/items/:itemId",
  requireTenant,
  validate(removeCartItemSchema),
  CartControllers.removeFromCart,
);

cartRouter.delete(
  "/",
  requireTenant,
  validate(clearCartSchema),
  CartControllers.clearCart,
);
export default cartRouter;
