import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import {
  checkoutSchema,
  trackOrderSchema,
} from "../validation/order.schema.js";
import { OrderControllers } from "../controllers/order.controllers.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/checkout",
  optionalAuth,
  validate(checkoutSchema),
  OrderControllers.checkout,
);
router.get("/my-orders", protect, OrderControllers.getMyOrders);
router.get("/track", validate(trackOrderSchema), OrderControllers.trackOrder);
export default router;
