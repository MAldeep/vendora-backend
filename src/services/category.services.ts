import prisma from "../config/prisma.js";
import { AppError } from "../utils/appError.js";
import { slugify } from "../utils/slugify.js";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../validation/category.schemas.js";

export class CategoryServices {
  // create
  static async create(tenantId: string, categoryData: CreateCategoryInput) {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId },
      select: {
        id: true,
        isActive: true,
      },
    });
    if (!tenant || !tenant.isActive) {
      throw new AppError("Store not found or is currently inactive", 404);
    }
    const generatedSlug = categoryData.slug || slugify(categoryData.name);
    const existingCategory = await prisma.category.findFirst({
      where: {
        tenantId,
        OR: [
          { name: { equals: categoryData.name, mode: "insensitive" } },
          { slug: generatedSlug },
        ],
      },
    });
    if (existingCategory) {
      if (
        existingCategory.name.toLowerCase() === categoryData.name.toLowerCase()
      ) {
        throw new AppError(
          "A category with this name already exists in this store",
          400,
        );
      }
      throw new AppError(
        "A category with this slug already exists in this store",
        400,
      );
    }
    if (categoryData.parentId) {
      const parentCategory = await prisma.category.findFirst({
        where: {
          id: categoryData.parentId,
          tenantId,
        },
      });

      if (!parentCategory) {
        throw new AppError("Parent category not found in this store", 400);
      }
    }
    const newCategory = await prisma.category.create({
      data: {
        tenantId,
        name: categoryData.name,
        slug: generatedSlug,
        description: categoryData.description,
        isActive: categoryData.isActive ?? true,
        parentId: categoryData.parentId ?? null,
      },
    });
    return {
      message: "Category Created Successfully !",
      data: newCategory,
    };
  }
  // get all
  static async getAll(tenantId: string) {
    const categories = await prisma.category.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      data: categories,
    };
  }
  // get by id or slug
  static async getById(tenantId: string, categoryId: string) {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        tenantId: tenantId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new AppError("Category not found in this store", 404);
    }

    return {
      data: category,
    };
  }
  // update
  static async update(
    tenantId: string,
    categoryId: string,
    updateData: UpdateCategoryInput,
  ) {
    const existingCategory = await prisma.category.findFirst({
      where: { id: categoryId, tenantId },
    });

    if (!existingCategory) {
      throw new AppError("Category not found in this store", 404);
    }

    let slugToUpdate = updateData.slug;
    if (updateData.name && !slugToUpdate) {
      slugToUpdate = slugify(updateData.name);
    }

    if (updateData.name || updateData.slug) {
      const conflictConditions = [];
      if (updateData.name) {
        conflictConditions.push({
          name: { equals: updateData.name, mode: "insensitive" as const },
        });
      }
      if (slugToUpdate) {
        conflictConditions.push({ slug: slugToUpdate });
      }

      const conflict = await prisma.category.findFirst({
        where: {
          tenantId,
          id: { not: categoryId },
          OR: conflictConditions,
        },
      });

      if (conflict) {
        if (
          updateData.name &&
          conflict.name.toLowerCase() === updateData.name.toLowerCase()
        ) {
          throw new AppError(
            "A category with this name already exists in this store",
            400,
          );
        }
        throw new AppError(
          "A category with this slug already exists in this store",
          400,
        );
      }
    }

    if (updateData.parentId !== undefined && updateData.parentId !== null) {
      if (updateData.parentId === categoryId) {
        throw new AppError("A category cannot be its own parent", 400);
      }

      const parentCategory = await prisma.category.findFirst({
        where: { id: updateData.parentId, tenantId },
      });

      if (!parentCategory) {
        throw new AppError("Parent category not found in this store", 400);
      }

      let currentParentCheckId: string | null = parentCategory.parentId;
      while (currentParentCheckId) {
        if (currentParentCheckId === categoryId) {
          throw new AppError(
            "Cannot set a child/descendant category as a parent (Circular reference detected)",
            400,
          );
        }
        const nextParent = await prisma.category.findFirst({
          where: { id: currentParentCheckId, tenantId },
          select: { parentId: true },
        });
        currentParentCheckId = nextParent?.parentId ?? null;
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...updateData,
        ...(slugToUpdate && { slug: slugToUpdate }),
      },
    });

    return {
      message: "Category updated successfully!",
      data: updatedCategory,
    };
  }
  // delete
  static async delete(tenantId: string, categoryId: string) {
    const existingCategory = await prisma.category.findFirst({
      where: { id: categoryId, tenantId },
      select: {
        id: true,
        _count: {
          select: {
            children: true,
            products: true,
          },
        },
      },
    });

    if (!existingCategory) {
      throw new AppError("Category not found in this store", 404);
    }

    const { children, products } = existingCategory._count;

    if (children > 0 || products > 0) {
      const details: string[] = [];
      if (children > 0) details.push(`${children} subcategory(ies)`);
      if (products > 0) details.push(`${products} product(s)`);

      throw new AppError(
        `Cannot delete this category because it is currently assigned to ${details.join(" and ")}. Please reassign or remove them first.`,
        400,
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return {
      message: "Category deleted successfully!",
    };
  }
}
