import prisma from "../config/prisma.js";
import { AppError } from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { Request, Response, NextFunction } from "express";
export const requireTenant = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    const tenantId = [
      req.headers["x-tenant-id"],
      req.params.tenantId,
      req.query.tenantId,
    ].find((value): value is string => typeof value === "string");

    if (!tenantId) {
      return next(
        new AppError(
          "Tenant Context Missing. Please specify 'x-tenant-id' header or tenant parameter.",
          400,
        ),
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant || !tenant.isActive) {
      return next(
        new AppError("Target store/tenant does not exist or is inactive.", 404),
      );
    }

    req.tenantId = tenant.id;
    next();
  },
);
