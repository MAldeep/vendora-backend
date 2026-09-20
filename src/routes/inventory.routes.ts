import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requireTenant } from "../middleware/requireTenant.middleware.js";
import { requirePermission } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.middleware.js";
import { adjustStockSchema } from "../validation/inventory.schema.js";
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

export default router;
