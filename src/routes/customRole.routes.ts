import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/restrictTo.js";
import { requireTenant } from "../middleware/requireTenant.middleware.js";
import { CustomRoleControllers } from "../controllers/customRole.controllers.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createCustomRoleSchema,
  customRoleIdParamSchema,
  updateCustomRoleSchema,
} from "../validation/customRole.schemas.js";

const router = Router();

router.use(protect);
router.use(requireTenant);
router.use(restrictTo("OWNER", "MANAGER"));

router
  .route("/roles")
  .get(CustomRoleControllers.getAll)
  .post(validate(createCustomRoleSchema), CustomRoleControllers.create);

router
  .route("/roles/:id")
  .get(validate(customRoleIdParamSchema), CustomRoleControllers.getById)
  .patch(validate(updateCustomRoleSchema), CustomRoleControllers.update)
  .delete(validate(customRoleIdParamSchema), CustomRoleControllers.delete);

export default router;
