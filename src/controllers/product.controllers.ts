import { AppError } from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { Response } from "express";
import {
  CreateProductInput,
  UpdateProductInput,
} from "../validation/product.schemas.js";
import { ProductServices } from "../services/product.services.js";
import { AuthRequest } from "../types/http.js";
export class ProductControllers {
  static create = catchAsync(async (req: AuthRequest, res: Response) => {
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
  static getAll = catchAsync(async (req: AuthRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID IS REQUIRED !", 400);
    }
    const query = req.query;
    const { data, message, meta } = await ProductServices.getAll(
      tenantId,
      query,
    );
    res.status(200).json({
      status: "success",
      message,
      data,
      meta,
    });
  });
  static getById = catchAsync(async (req: AuthRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID IS REQUIRED !", 400);
    }
    const productId = req.params.id;
    if (!productId) {
      throw new AppError("Product ID IS REQUIRED !", 400);
    }
    const { data, message } = await ProductServices.getById(
      tenantId,
      productId as string,
    );
    res.status(200).json({
      status: "success",
      message,
      data,
    });
  });
  static update = catchAsync(async (req: AuthRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID IS REQUIRED !", 400);
    }

    const productId = req.params.id;
    if (!productId) {
      throw new AppError("Product ID IS REQUIRED !", 400);
    }

    const updateData: UpdateProductInput = req.body;
    const files = req.files as Express.Multer.File[];

    const { data, message } = await ProductServices.update(
      tenantId,
      productId as string,
      updateData,
      files,
    );

    res.status(200).json({
      status: "success",
      message,
      data,
    });
  });
  static delete = catchAsync(async (req: AuthRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID IS REQUIRED !", 400);
    }

    const productId = req.params.id;
    if (!productId) {
      throw new AppError("Product ID IS REQUIRED !", 400);
    }

    const { message } = await ProductServices.delete(
      tenantId,
      productId as string,
    );

    res.status(200).json({
      status: "success",
      message,
    });
  });
}
