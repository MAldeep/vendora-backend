import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import {
  createTenantSchema,
  getBySlugSchema,
} from "../validation/tenant.schemas.js";
import { TenantControllers } from "../controllers/tenant.controllers.js";
import { protect } from "../middleware/auth.middleware.js";
import { requireTenant } from "../middleware/requireTenant.middleware.js";
import { restrictTo } from "../middleware/restrictTo.js";

const router = Router();

// Create new Tenant
router
  .route("/")
  .post(protect, validate(createTenantSchema), TenantControllers.create)
  .get(protect, TenantControllers.getAll);

router
  .route("/:slug")
  .get(protect, validate(getBySlugSchema), TenantControllers.getBySlug);

router
  .route("/:id")
  .patch(protect, requireTenant, restrictTo("OWNER"), TenantControllers.update)
  .delete(
    protect,
    requireTenant,
    restrictTo("OWNER"),
    TenantControllers.delete,
  );

router.patch(
  "/status",
  protect,
  requireTenant,
  restrictTo("OWNER"),
  TenantControllers.toggleStatus,
);
