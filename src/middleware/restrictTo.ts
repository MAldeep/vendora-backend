import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError.js";
import prisma from "../config/prisma.js";
import { catchAsync } from "../utils/catchAsync.js";
import { TenantRole } from "@prisma/client";

export const restrictTo = (...allowedRoles: TenantRole[]) => {
  return catchAsync(
    async (req: Request, _res: Response, next: NextFunction) => {
      if (!req.user || !req.tenantId) {
        return next(
          new AppError(
            "Authentication and Tenant context are required before role check.",
            500,
          ),
        );
      }

      const userRoleInTenant = await prisma.tenantUserRole.findUnique({
        where: {
          userId_tenantId: {
            userId: req.user.id,
            tenantId: req.tenantId,
          },
        },
      });

      if (!userRoleInTenant || !allowedRoles.includes(userRoleInTenant.role)) {
        return next(
          new AppError(
            "You do not have permission to perform this action in this store.",
            403,
          ),
        );
      }

      req.tenantRole = userRoleInTenant.role;
      next();
    },
  );
};
