import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import { checkoutSchema } from "../validation/order.schema.js";
import { OrderControllers } from "../controllers/order.controllers.js";
import { optionalAuth } from "../middleware/optionalAuth.js";

const router = Router();

router.post(
  "/checkout",
  optionalAuth,
  validate(checkoutSchema),
  OrderControllers.checkout,
);

export default router;
