import { TenantRole } from "@prisma/client";
import prisma from "../config/prisma.js";
import { AppError } from "../utils/appError.js";
import { CreateTenant, GetBySlug } from "../validation/tenant.schemas.js";
import { PrismaAPIFeatures } from "../utils/apiFeatures.js";
import {
  DeleteTenantInput,
  ToggleTenantStatusInput,
  UpdateTenantInput,
} from "../types/tenants.types.js";

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
  static async getAll(queryString: Record<string, any>) {
    const features = new PrismaAPIFeatures(queryString, {
      searchFields: ["name", "slug"],
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const queryArgs = features.build();
    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        ...queryArgs,
        include: queryArgs.select
          ? undefined
          : {
              owner: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
      }),
      prisma.tenant.count({
        where: features.where,
      }),
    ]);
    return {
      tenants,
      meta: {
        total,
        page: features.page,
        limit: features.take,
        totalPages: Math.ceil(total / features.take),
      },
    };
  }
  static async getBySlug(data: GetBySlug) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: data.slug },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        products: true,
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });
    if (!tenant) {
      throw new AppError("Tenant/Store not found with this slug", 404);
    }

    return tenant;
  }
  static async update(data: UpdateTenantInput) {
    const { id, ...updateData } = data;

    const existingTenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!existingTenant) {
      throw new AppError("Tenant not found", 404);
    }

    if (updateData.slug && updateData.slug !== existingTenant.slug) {
      const slugTaken = await prisma.tenant.findUnique({
        where: { slug: updateData.slug },
      });

      if (slugTaken) {
        throw new AppError("Slug is already taken by another store", 400);
      }
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return updatedTenant;
  }
  static async toggleStatus(data: ToggleTenantStatusInput) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: data.id },
      select: { id: true, isActive: true },
    });

    if (!tenant) {
      throw new AppError("Tenant not found", 404);
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: data.id },
      data: {
        isActive: !tenant.isActive,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
      },
    });

    return updatedTenant;
  }
  static async delete(data: DeleteTenantInput) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: data.id },
    });

    if (!tenant) {
      throw new AppError("Tenant not found", 404);
    }

    await prisma.tenant.delete({
      where: { id: data.id },
    });

    return { message: "Tenant deleted successfully" };
  }
}
