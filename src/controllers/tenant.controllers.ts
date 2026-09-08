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
}
