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
    productData: CreateProductInput & { stockQuantity?: number },
    files?: Express.Multer.File[],
  ) {
    // 1. Check if category exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: productData.categoryId,
        tenantId,
      },
    });

    if (!existingCategory) {
      throw new AppError("Category not found in this store", 404);
    }

    // 2. Generate slug
    const generatedSlug = productData.slug || slugify(productData.title);

    // 3. Check if slug or product SKU exists
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

    // 4. Validate Variants SKUs (Explicit or Default)
    const hasExplicitVariants =
      productData.variants && productData.variants.length > 0;

    if (hasExplicitVariants) {
      const variantSkus = productData.variants!.map((v) => v.sku);

      // Check internal duplicates
      const hasDuplicates = new Set(variantSkus).size !== variantSkus.length;
      if (hasDuplicates) {
        throw new AppError(
          "Duplicate SKUs found inside the provided variants list",
          400,
        );
      }

      // Check existing variants in DB
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

    // 5. Creation Transaction
    const createdProduct = await prisma.$transaction(async (tx) => {
      // A) Create Parent Product
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

      // B) Handle Variants Creation
      if (hasExplicitVariants) {
        // Create explicit variants provided by admin
        await tx.productVariant.createMany({
          data: productData.variants!.map((v) => ({
            tenantId,
            productId: product.id,
            title: v.title,
            sku: v.sku,
            price: v.price ?? productData.price,
            stockQuantity: v.stockQuantity ?? 0,
            attributes: v.attributes,
          })),
        });
      } else {
        // CREATING IMPLICIT DEFAULT VARIANT (للمنتج البسيط)
        await tx.productVariant.create({
          data: {
            tenantId,
            productId: product.id,
            title: "Default",
            sku: productData.sku,
            price: productData.price,
            stockQuantity: productData.stockQuantity ?? 0,
            attributes: {},
          },
        });
      }

      // C) Handle Images
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

    // 6. Return Full Product Data
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
    updateData: UpdateProductInput & { stockQuantity?: number },
    files?: Express.Multer.File[],
  ) {
    // 1. Check if product exists with variants
    const existingProduct = await prisma.product.findFirst({
      where: { id, tenantId },
      include: { variants: true },
    });

    if (!existingProduct) {
      throw new AppError("Product not found in this store", 404);
    }

    // 2. Check Category if provided
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

    // 3. Check Slug if provided
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

    // 4. Check SKU if provided
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

    // 5. Compare At Price Validation
    const newPrice = updateData.price ?? Number(existingProduct.price);
    const newCompareAtPrice =
      updateData.compareAtPrice !== undefined
        ? updateData.compareAtPrice
        : existingProduct.compareAtPrice
          ? Number(existingProduct.compareAtPrice)
          : undefined;

    if (
      newCompareAtPrice !== undefined &&
      newCompareAtPrice !== null &&
      newCompareAtPrice <= newPrice
    ) {
      throw new AppError(
        "Compare at price must be strictly greater than the regular price",
        400,
      );
    }

    // 6. Handle Images Upload (Side Effect outside transaction for performance)
    if (files && files.length > 0) {
      const uploadedImages = await processAndUploadMultipleImages(
        files,
        `tenants/${tenantId}/products`,
      );

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

    // 7. DB Update Transaction & Default Variant Sync Logic
    await prisma.$transaction(async (tx) => {
      // A) Update Parent Product fields
      await tx.product.update({
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
      });

      // B) Sync with Default Variant IF product is Simple Product (Single Default Variant)
      const isSimpleProduct =
        existingProduct.variants.length === 1 &&
        (existingProduct.variants[0].title === "Default" ||
          !existingProduct.variants[0].attributes ||
          Object.keys(existingProduct.variants[0].attributes as object)
            .length === 0);

      if (isSimpleProduct) {
        const defaultVariant = existingProduct.variants[0];
        await tx.productVariant.update({
          where: { id: defaultVariant.id },
          data: {
            ...(updateData.sku && { sku: updateData.sku }),
            ...(updateData.price !== undefined && { price: updateData.price }),
            ...(updateData.stockQuantity !== undefined && {
              stockQuantity: updateData.stockQuantity,
            }),
          },
        });
      }
    });

    // 8. Fetch and return full updated product data
    const updatedProduct = await prisma.product.findUnique({
      where: { id },
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
      data: updatedProduct,
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
