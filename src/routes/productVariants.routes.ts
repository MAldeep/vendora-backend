import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createVariantSchema,
  updateVariantSchema,
} from "../validation/productVariant.schema.js";
import { ProductVariantsControllers } from "../controllers/productVariant.controllers.js";

const variantRouter = Router({ mergeParams: true });

variantRouter.use(protect);

variantRouter
  .route("/")
  .get(
    requirePermission("VIEW_PRODUCTS"),
    ProductVariantsControllers.getAllByProductId,
  )
  .post(
    requirePermission("CREATE_PRODUCT", "UPDATE_PRODUCT"),
    validate(createVariantSchema),
    ProductVariantsControllers.create,
  );

variantRouter
  .route("/:variantId")
  .get(requirePermission("VIEW_PRODUCTS"), ProductVariantsControllers.getById)
  .patch(
    requirePermission("UPDATE_PRODUCT"),
    validate(updateVariantSchema),
    ProductVariantsControllers.update,
  );

export default variantRouter;
