import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requireTenant } from "../middleware/requireTenant.middleware.js";
import { requirePermission } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  adjustStockSchema,
  getLowStockSchema,
  getMovementsSchema,
} from "../validation/inventory.schema.js";
import { InventoryControllers } from "../controllers/inventory.controllers.js";

const router = Router({ mergeParams: true });

router.use(protect);

router.patch(
  "/:variantId/adjust",
  requireTenant,
  requirePermission("UPDATE_PRODUCT"),
  validate(adjustStockSchema),
  InventoryControllers.adjustStock,
);

router.get(
  "/low-stock",
  requireTenant,
  requirePermission("VIEW_PRODUCTS"),
  validate(getLowStockSchema),
  InventoryControllers.getLowStock,
);

router.get(
  "/movements",
  requireTenant,
  requirePermission("VIEW_PRODUCTS"),
  validate(getMovementsSchema),
  InventoryControllers.getMovementsHistory,
);
export default router;
