import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requireTenant } from "../middleware/requireTenant.middleware.js";
import { requirePermission } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  getTenantOrdersSchema,
  updateOrderStatusSchema,
} from "../validation/order.schema.js";
import { OrderControllers } from "../controllers/order.controllers.js";

const router = Router();

router.use(protect);

router.get(
  "/",
  requireTenant,
  requirePermission("VIEW_ORDERS"),
  validate(getTenantOrdersSchema),
  OrderControllers.getTenantOrders,
);

router.patch(
  "/:orderId/status",
  requireTenant,
  requirePermission("MANAGE_ORDERS"),
  validate(updateOrderStatusSchema),
  OrderControllers.updateOrderStatus,
);

export default router;
