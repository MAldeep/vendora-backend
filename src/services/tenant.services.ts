import { TenantRole } from "@prisma/client";
import prisma from "../config/prisma.js";
import { AppError } from "../utils/appError.js";
import { CreateTenant } from "../validation/tenant.schemas.js";

export class TenantServices {
  static async create(ownerId: string, data: CreateTenant) {
    const user = await prisma.user.findUnique({
      where: { id: ownerId },
    });
    if (!user) {
      throw new AppError("User Not found", 404);
    }
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: data.slug },
    });
    if (existingTenant) {
      throw new AppError("A store with this slug already exists", 400);
    }

    const newTenant = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
          ownerId: user.id,
        },
      });
      await tx.tenantUserRole.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: TenantRole.OWNER,
        },
      });
      return tenant;
    });
    return newTenant;
  }
}
