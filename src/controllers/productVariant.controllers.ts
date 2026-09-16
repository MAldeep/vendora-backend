import { ProductVariantsServices } from "../services/productVariants.services.js";
import { AppError } from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { Request, Response } from "express";
export class ProductVariantsControllers {
  static create = catchAsync(async (req: Request, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID is required", 400);
    }
    const { id } = req.params;
    if (!id) {
      throw new AppError("Product ID is Required", 400);
    }
    const variantData = req.body;
    const { data, message } = await ProductVariantsServices.create(
      tenantId,
      id as string,
      variantData,
    );
    res.status(201).json({
      status: "success",
      message,
      data,
    });
  });
}
