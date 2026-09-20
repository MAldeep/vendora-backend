import { Router } from "express";
import { requireTenant } from "../middleware/requireTenant.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { addToCartSchema } from "../validation/cart.schema.js";
import { CartControllers } from "../controllers/cart.controllers.js";

const cartRouter = Router({ mergeParams: true });

cartRouter.post(
  "/items",
  requireTenant,
  validate(addToCartSchema),
  CartControllers.addToCart,
);

export default cartRouter;
