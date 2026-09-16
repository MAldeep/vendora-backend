import { ProductStatus } from "@prisma/client";
import prisma from "../config/prisma.js";
import { AppError } from "../utils/appError.js";
import { slugify } from "../utils/slugify.js";
import { CreateProductInput } from "../validation/product.schemas.js";
import { processAndUploadMultipleImages } from "../config/cloudinary.js";

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
}
