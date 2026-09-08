import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import { createTenantSchema } from "../validation/tenant.schemas.js";
import { TenantControllers } from "../controllers/tenant.controllers.js";
import { protect } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/restrictTo.js";

const router = Router();

// Create new Tenant
router
  .route("/")
  .post(protect, validate(createTenantSchema), TenantControllers.create);
