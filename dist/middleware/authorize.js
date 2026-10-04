import { TenantRole, UserType } from "@prisma/client";
import prisma from "../config/prisma.js";
import { DEFAULT_ROLE_PERMISSIONS } from "../config/permissions.js";
import { AppError } from "../utils/appError.js";
import { getTenantId } from "../context/tenant.context.js";
export const requirePermission = (...requiredPermissions) => {
    return async (req, _res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new AppError("Unauthorized. User not authenticated.", 401);
            }
            if (req.user?.userType === UserType.PLATFORM_SUPER_ADMIN) {
                return next();
            }
            const tenantId = getTenantId() ||
                (typeof req.params.tenantId === "string"
                    ? req.params.tenantId
                    : undefined) ||
                (typeof req.headers["x-tenant-id"] === "string"
                    ? req.headers["x-tenant-id"]
                    : undefined);
            if (!tenantId) {
                throw new AppError("Tenant context or x-tenant-id header/param is required.", 400);
            }
            const tenantUserRole = await prisma.tenantUserRole.findUnique({
                where: {
                    userId_tenantId: { userId, tenantId },
                },
                include: {
                    customRole: true,
                },
            });
            if (!tenantUserRole) {
                throw new AppError("Access denied. You have no role in this store.", 403);
            }
            if (tenantUserRole.role === TenantRole.OWNER) {
                req.tenantUserRole = tenantUserRole;
                return next();
            }
            let userPermissions = [];
            if (tenantUserRole.role === TenantRole.CUSTOM) {
                if (!tenantUserRole.customRole) {
                    throw new AppError("Custom role configuration is missing.", 500);
                }
                userPermissions = tenantUserRole.customRole.permissions;
            }
            else {
                const roleKey = tenantUserRole.role;
                userPermissions =
                    DEFAULT_ROLE_PERMISSIONS[roleKey] || [];
            }
            const hasPermission = requiredPermissions.every((perm) => userPermissions.includes(perm));
            if (!hasPermission) {
                throw new AppError("Forbidden: Insufficient permissions to perform this action.", 403);
            }
            req.tenantUserRole = tenantUserRole;
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
