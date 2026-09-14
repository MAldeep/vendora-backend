import prisma from "../config/prisma.js";
import { AppError } from "../utils/appError.js";
import { CreateCustomRoleInput } from "../validation/customRole.schemas.js";

export class CustomRoleServices {
  // create
  static async create(tenantId: string, data: CreateCustomRoleInput) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!tenant || !tenant.isActive) {
      throw new AppError("Store not found or is currently inactive", 404);
    }

    const existingRole = await prisma.customRole.findFirst({
      where: {
        tenantId,
        name: {
          equals: data.name,
          mode: "insensitive",
        },
      },
    });

    if (existingRole) {
      throw new AppError(
        "A role with this name already exists in this store",
        400,
      );
    }

    const newRole = await prisma.customRole.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        tenantId: tenantId,
      },
    });

    return {
      message: "Role Added Successfully!",
      role: newRole,
    };
  }
  // get
  static async getAll(tenantId: string) {
    const customRoles = await prisma.customRole.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        createdAt: true,
        _count: {
          select: { tenantUserRoles: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      data: customRoles,
    };
  }
  // get by id
  static async getById(tenantId: string, customRoleId: string) {
    const customRole = await prisma.customRole.findFirst({
      where: {
        id: customRoleId,
        tenantId: tenantId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        createdAt: true,
        tenantUserRoles: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });
    if (!customRole) {
      throw new AppError("Custom role not found in this store", 404);
    }
    return {
      data: customRole,
    };
  }
  // update
  //delete
}
