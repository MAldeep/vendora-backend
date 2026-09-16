import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.middleware.js";
import { createVariantSchema } from "../validation/productVariant.schema.js";
import { ProductVariantsControllers } from "../controllers/productVariant.controllers.js";

const variantRouter = Router({ mergeParams: true });

variantRouter.use(protect);

variantRouter
  .route("/")
  .post(
    requirePermission("CREATE_PRODUCT", "UPDATE_PRODUCT"),
    validate(createVariantSchema),
    ProductVariantsControllers.create,
  );

export default variantRouter;
