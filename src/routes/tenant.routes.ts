import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import {
  createTenantSchema,
  getBySlugSchema,
} from "../validation/tenant.schemas.js";
import { TenantControllers } from "../controllers/tenant.controllers.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// Create new Tenant
router
  .route("/")
  .post(protect, validate(createTenantSchema), TenantControllers.create)
  .get(protect, TenantControllers.getAll);

router
  .route("/:slug")
  .get(protect, validate(getBySlugSchema), TenantControllers.getBySlug);
