import { AppError } from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { Request, Response } from "express";
import { CreateProductInput } from "../validation/product.schemas.js";
import { ProductServices } from "../services/product.services.js";
export class ProductControllers {
  static create = catchAsync(async (req: Request, res: Response) => {
    const productData: CreateProductInput = req.body;
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID IS REQUIRED !", 400);
    }
    const files = req.files as Express.Multer.File[];

    const { data, message } = await ProductServices.create(
      tenantId,
      productData,
      files,
    );
    res.status(201).json({
      status: "success",
      message,
      data,
    });
  });
}
