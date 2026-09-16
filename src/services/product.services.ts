import { ProductStatus } from "@prisma/client";
import prisma from "../config/prisma.js";
import { AppError } from "../utils/appError.js";
import { slugify } from "../utils/slugify.js";
import {
  CreateProductInput,
  UpdateProductInput,
} from "../validation/product.schemas.js";
import { processAndUploadMultipleImages } from "../config/cloudinary.js";
import { PrismaAPIFeatures } from "../utils/apiFeatures.js";

export class ProductServices {
  static async create(
    tenantId: string,
    productData: CreateProductInput,
    files?: Express.Multer.File[],
  ) {
    // check if category exists in this tenant
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: productData.categoryId,
        tenantId,
      },
    });

    if (!existingCategory) {
      throw new AppError("Category not found in this store", 404);
    }
    // no slug ? generate one
    const generatedSlug = productData.slug || slugify(productData.title);
    // check if product already exists
    const existingProduct = await prisma.product.findFirst({
      where: {
        tenantId,
        OR: [{ sku: productData.sku }, { slug: generatedSlug }],
      },
    });

    if (existingProduct) {
      if (existingProduct.sku === productData.sku) {
        throw new AppError(
          "A product with this SKU already exists in this store",
          400,
        );
      }
      throw new AppError(
        "A product with this slug already exists in this store",
        400,
      );
    }
    // create product without images first
    const productWithoutImgs = await prisma.product.create({
      data: {
        tenantId,
        categoryId: productData.categoryId,
        title: productData.title,
        slug: generatedSlug,
        description: productData.description,
        price: productData.price,
        compareAtPrice: productData.compareAtPrice,
        sku: productData.sku,
        status: (productData.status as ProductStatus) || "DRAFT",
        isFeatured: productData.isFeatured ?? false,
      },
    });
    // if images in req.files => add them to product
    if (files && files.length > 0) {
      const uploadedImages = await processAndUploadMultipleImages(
        files,
        `tenants/${tenantId}/products`,
      );

      await prisma.productImage.createMany({
        data: uploadedImages.map((img, index) => ({
          productId: productWithoutImgs.id,
          url: img.url,
          publicId: img.publicId,
          altText: productWithoutImgs.title,
          position: index,
        })),
      });
    }
    // return the full product any way
    const product = await prisma.product.findUnique({
      where: { id: productWithoutImgs.id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: true,
      },
    });

    return {
      message: "Product created successfully!",
      data: product,
    };
  }
  static async getAll(tenantId: string, queryString: Record<string, any>) {
    const features = new PrismaAPIFeatures(queryString, {
      searchFields: ["title", "slug", "sku"],
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const { where, orderBy, take, skip, select } = features.build();

    const tenantWhere = {
      ...where,
      tenantId,
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: tenantWhere,
        orderBy,
        take,
        skip,
        select,
        include: !select
          ? {
              category: {
                select: { id: true, name: true, slug: true },
              },
              images: {
                orderBy: { position: "asc" },
              },
            }
          : undefined,
      }),
      prisma.product.count({
        where: tenantWhere,
      }),
    ]);

    const page = Number(queryString.page) || 1;
    const limit = Number(queryString.limit) || 10;
    const totalPages = Math.ceil(total / limit);

    return {
      message: "Products retrieved successfully!",
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
      data: products,
    };
  }
  static async getById(tenantId: string, productId: string) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return {
      message: "Product retrieved successfully",
      data: product,
    };
  }
  static async update(
    tenantId: string,
    id: string,
    updateData: UpdateProductInput,
    files?: Express.Multer.File[],
  ) {
    // check if product found
    const existingProduct = await prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!existingProduct) {
      throw new AppError("Product not found in this store", 404);
    }

    // 2. check if category found
    if (
      updateData.categoryId &&
      updateData.categoryId !== existingProduct.categoryId
    ) {
      const existingCategory = await prisma.category.findFirst({
        where: { id: updateData.categoryId, tenantId },
      });
      if (!existingCategory) {
        throw new AppError("Category not found in this store", 404);
      }
    }

    // check if slug found
    if (updateData.slug && updateData.slug !== existingProduct.slug) {
      const slugTaken = await prisma.product.findFirst({
        where: {
          tenantId,
          slug: updateData.slug,
          id: { not: id },
        },
      });
      if (slugTaken) {
        throw new AppError(
          "Slug is already taken by another product in this store",
          400,
        );
      }
    }

    // check if sku found
    if (updateData.sku && updateData.sku !== existingProduct.sku) {
      const skuTaken = await prisma.product.findFirst({
        where: {
          tenantId,
          sku: updateData.sku,
          id: { not: id },
        },
      });
      if (skuTaken) {
        throw new AppError(
          "SKU is already taken by another product in this store",
          400,
        );
      }
    }

    // check if price < compareAtPrice
    const newPrice = updateData.price ?? Number(existingProduct.price);
    const newCompareAtPrice =
      updateData.compareAtPrice !== undefined
        ? updateData.compareAtPrice
        : existingProduct.compareAtPrice
          ? Number(existingProduct.compareAtPrice)
          : undefined;

    if (
      newCompareAtPrice &&
      newCompareAtPrice !== undefined &&
      newCompareAtPrice <= newPrice
    ) {
      throw new AppError(
        "Compare at price must be strictly greater than the regular price",
        400,
      );
    }

    // upload images if in the req
    if (files && files.length > 0) {
      const uploadedImages = await processAndUploadMultipleImages(
        files,
        `tenants/${tenantId}/products`,
      );

      // get positions
      const lastImage = await prisma.productImage.findFirst({
        where: { productId: id },
        orderBy: { position: "desc" },
      });
      const startPosition = lastImage ? lastImage.position + 1 : 0;

      await prisma.productImage.createMany({
        data: uploadedImages.map((img, index) => ({
          productId: id,
          url: img.url,
          publicId: img.publicId,
          altText: updateData.title || existingProduct.title,
          position: startPosition + index,
        })),
      });
    }

    // update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(updateData.categoryId && { categoryId: updateData.categoryId }),
        ...(updateData.title && { title: updateData.title }),
        ...(updateData.slug && { slug: updateData.slug }),
        ...(updateData.description !== undefined && {
          description: updateData.description,
        }),
        ...(updateData.price !== undefined && { price: updateData.price }),
        ...(updateData.compareAtPrice !== undefined && {
          compareAtPrice: updateData.compareAtPrice,
        }),
        ...(updateData.sku && { sku: updateData.sku }),
        ...(updateData.status && {
          status: (updateData.status as ProductStatus) || "DRAFT",
        }),
        ...(updateData.isFeatured !== undefined && {
          isFeatured: updateData.isFeatured,
        }),
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          orderBy: { position: "asc" },
        },
      },
    });

    return {
      message: "Product updated successfully!",
      data: product,
    };
  }
}
