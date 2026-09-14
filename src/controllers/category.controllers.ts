import { AppError } from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { Request, Response } from "express";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../validation/category.schemas.js";
import { CategoryServices } from "../services/category.services.js";

export class CategoryControllers {
  // 1. Create Category
  static create = catchAsync(async (req: Request, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID is missing", 400);
    }

    const categoryData: CreateCategoryInput = req.body;
    const { data, message } = await CategoryServices.create(
      tenantId,
      categoryData,
    );

    res.status(201).json({
      status: "success",
      message,
      data,
    });
  });

  // 2. Get All Categories
  static getAll = catchAsync(async (req: Request, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID is missing", 400);
    }

    const { data } = await CategoryServices.getAll(tenantId);

    res.status(200).json({
      status: "success",
      results: data.length,
      data,
    });
  });

  // 3. Get Category By ID
  static getById = catchAsync(async (req: Request, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID is missing", 400);
    }

    const { id } = req.params;
    const { data } = await CategoryServices.getById(tenantId, id as string);

    res.status(200).json({
      status: "success",
      data,
    });
  });

  // 4. Update Category
  static update = catchAsync(async (req: Request, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID is missing", 400);
    }

    const { id } = req.params;
    const updateData: UpdateCategoryInput = req.body;

    const { data, message } = await CategoryServices.update(
      tenantId,
      id as string,
      updateData,
    );

    res.status(200).json({
      status: "success",
      message,
      data,
    });
  });

  // 5. Delete Category
  static delete = catchAsync(async (req: Request, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID is missing", 400);
    }

    const { id } = req.params;
    const { message } = await CategoryServices.delete(tenantId, id as string);

    res.status(200).json({
      status: "success",
      message,
    });
  });
}
