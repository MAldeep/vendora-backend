import prisma from "../config/prisma.js";
import { AppError } from "../utils/appError.js";
import { CreateVariantInput } from "../validation/productVariant.schema.js";

export class ProductVariantsServices {
  // create
  static async create(
    tenantId: string,
    productId: string,
    data: CreateVariantInput,
  ) {
    // check if product exists
    const existingProduct = await prisma.product.findFirst({
      where: { id: productId, tenantId },
    });
    if (!existingProduct) {
      throw new AppError("Product Not Found in This Store", 404);
    }
    // check if variant exists
    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        tenantId,
        sku: data.sku,
      },
    });
    if (existingVariant) {
      throw new AppError("This Variant Already exists", 400);
    }
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        tenantId,
        attributes: data.attributes,
        sku: data.sku,
        title: data.title,
        price: data.price ?? null,
        stockQuantity: data.stockQuantity ?? 0,
      },
    });
    return {
      message: "Product Variant Created Successfully !",
      data: variant,
    };
  }
  // get all
  static async getAllByProductId(tenantId: string, productId: string) {
    // check if product exists
    const existingProduct = await prisma.product.findFirst({
      where: { id: productId, tenantId },
    });
    if (!existingProduct) {
      throw new AppError("Product not found in this store", 404);
    }
    const variants = await prisma.productVariant.findMany({
      where: {
        productId,
        tenantId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return {
      message: "Product variants retrieved successfully!",
      data: variants,
    };
  }
  // getById
  static async getById(tenantId: string, productId: string, variantId: string) {
    // check if variant exists
    const variant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId,
        tenantId,
      },
    });

    if (!variant) {
      throw new AppError("Product variant not found in this store", 404);
    }

    return {
      message: "Product variant retrieved successfully!",
      data: variant,
    };
  }
  // update
  // delete
}
