import { CustomRoleServices } from "../services/customRole.services.js";
import { AppError } from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { Request, Response } from "express";

export class CustomRoleControllers {
  // 1. Create Role
  static create = catchAsync(async (req: Request, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID is missing", 400);
    }

    const { message, role } = await CustomRoleServices.create(
      tenantId,
      req.body,
    );

    res.status(201).json({
      status: "success",
      message,
      data: role,
    });
  });

  // 2. Get All Roles
  static getAll = catchAsync(async (req: Request, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID is missing", 400);
    }

    const { data } = await CustomRoleServices.getAll(tenantId);

    res.status(200).json({
      status: "success",
      results: data.length,
      data,
    });
  });

  // 3. Get Role By ID
  static getById = catchAsync(async (req: Request, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID is missing", 400);
    }

    const { id } = req.params;
    const { data } = await CustomRoleServices.getById(tenantId, id as string);

    res.status(200).json({
      status: "success",
      data,
    });
  });

  // 4. Update Role
  static update = catchAsync(async (req: Request, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID is missing", 400);
    }

    const { id } = req.params;
    const { message, data } = await CustomRoleServices.update(
      tenantId,
      id as string,
      req.body,
    );

    res.status(200).json({
      status: "success",
      message,
      data,
    });
  });

  // 5. Delete Role
  static delete = catchAsync(async (req: Request, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID is missing", 400);
    }

    const { id } = req.params;
    const { message } = await CustomRoleServices.delete(tenantId, id as string);

    res.status(200).json({
      status: "success",
      message,
    });
  });
}
