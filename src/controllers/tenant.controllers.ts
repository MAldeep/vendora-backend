import { TenantServices } from "../services/tenant.services.js";
import { AppError } from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { NextFunction, Request, Response } from "express";
export class TenantControllers {
  static create = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const ownerId = req.user?.id;
      const data = req.body;
      if (!ownerId) {
        return next(new AppError("Unauthorized for adding a new tenant", 401));
      }
      const tenant = await TenantServices.create(ownerId, data);
      res.status(201).json({
        status: "success",
        message: "Tenant created successfully !",
        data: { tenant },
      });
    },
  );
  static getAll = catchAsync(async (req: Request, res: Response) => {
    const { tenants, meta } = await TenantServices.getAll(req.query);
    res.status(200).json({
      status: "success",
      results: tenants.length,
      data: {
        tenants,
        meta,
      },
    });
  });
  static getBySlug = catchAsync(async (req: Request, res: Response) => {
    const slug = req.body;
    const tenant = await TenantServices.getBySlug(slug);
    res.status(200).json({
      status: "success",
      message: "Tenant found",
      data: { tenant },
    });
  });
}
