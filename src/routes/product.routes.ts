import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createProductSchema,
  productIdParamSchema,
  updateProductSchema,
} from "../validation/product.schemas.js";
import { ProductControllers } from "../controllers/product.controllers.js";
import { uploadProductImages } from "../middleware/upload.middleware.js";

const router = Router();

router.use(protect);
router
  .route("/")
  .get(requirePermission("VIEW_PRODUCTS"), ProductControllers.getAll)
  .post(
    requirePermission("CREATE_PRODUCT"),
    uploadProductImages,
    validate(createProductSchema),
    ProductControllers.create,
  );

router
  .route("/:id")
  .get(
    requirePermission("VIEW_PRODUCTS"),
    validate(productIdParamSchema),
    ProductControllers.getById,
  )
  .patch(
    requirePermission("UPDATE_PRODUCT"),
    uploadProductImages,
    validate(updateProductSchema),
    ProductControllers.update,
  )
  .delete(
    requirePermission("DELETE_PRODUCT"),
    validate(productIdParamSchema),
    ProductControllers.delete,
  );
export default router;
