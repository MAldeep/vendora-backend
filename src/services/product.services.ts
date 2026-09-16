import { ProductStatus } from "@prisma/client";
import prisma from "../config/prisma.js";
import { AppError } from "../utils/appError.js";
import { slugify } from "../utils/slugify.js";
import {
  CreateProductInput,
  UpdateProductInput,
} from "../validation/product.schemas.js";
import {
  deleteFromCloudinary,
  processAndUploadMultipleImages,
} from "../config/cloudinary.js";
import { PrismaAPIFeatures } from "../utils/apiFeatures.js";

export class ProductServices {
  static async create(
    tenantId: string,
    productData: CreateProductInput,
    files?: Express.Multer.File[],
  ) {
    // check if category found
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: productData.categoryId,
        tenantId,
      },
    });

    if (!existingCategory) {
      throw new AppError("Category not found in this store", 404);
    }

    // generate slug if not provided
    const generatedSlug = productData.slug || slugify(productData.title);

    // check if slug or sku already exists
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

    // ckeck variants' sku
    if (productData.variants && productData.variants.length > 0) {
      const variantSkus = productData.variants.map((v) => v.sku);

      // ckeck duplicate skus
      const hasDuplicates = new Set(variantSkus).size !== variantSkus.length;
      if (hasDuplicates) {
        throw new AppError(
          "Duplicate SKUs found inside the provided variants list",
          400,
        );
      }

      // ckeck if sku already exists
      const existingVariantSku = await prisma.productVariant.findFirst({
        where: {
          tenantId,
          sku: { in: variantSkus },
        },
      });

      if (existingVariantSku) {
        throw new AppError(
          `Variant SKU "${existingVariantSku.sku}" already exists in this store`,
          400,
        );
      }
    }

    // creation transaction
    const createdProduct = await prisma.$transaction(async (tx) => {
      // create product
      const product = await tx.product.create({
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

      // if variants => add them
      if (productData.variants && productData.variants.length > 0) {
        await tx.productVariant.createMany({
          data: productData.variants.map((v) => ({
            tenantId,
            productId: product.id,
            title: v.title,
            sku: v.sku,
            price: v.price ?? null,
            stockQuantity: v.stockQuantity ?? 0,
            attributes: v.attributes,
          })),
        });
      }

      // product images
      if (files && files.length > 0) {
        const uploadedImages = await processAndUploadMultipleImages(
          files,
          `tenants/${tenantId}/products`,
        );

        await tx.productImage.createMany({
          data: uploadedImages.map((img, index) => ({
            productId: product.id,
            url: img.url,
            publicId: img.publicId,
            altText: product.title,
            position: index,
          })),
        });
      }

      return product;
    });

    // full product data
    const product = await prisma.product.findUnique({
      where: { id: createdProduct.id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          orderBy: { position: "asc" },
        },
        variants: true,
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
              variants: true,
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
        variants: true,
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
        variants: true,
      },
    });

    return {
      message: "Product updated successfully!",
      data: product,
    };
  }
  static async delete(tenantId: string, productId: string) {
    // check if product found
    const existingProduct = await prisma.product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!existingProduct) {
      throw new AppError("Product not found in this store", 404);
    }

    // check if product has images
    const productImages = await prisma.productImage.findMany({
      where: { productId },
      select: { publicId: true },
    });

    // delete images from cloudinary
    if (productImages.length > 0) {
      const deletePromises = productImages.map((image) =>
        deleteFromCloudinary(image.publicId),
      );

      await Promise.all(deletePromises);
    }

    // delete product
    await prisma.product.delete({
      where: { id: productId },
    });

    return {
      message: "Product and associated images deleted successfully!",
    };
  }
}
