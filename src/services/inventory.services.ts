import { StockMovementReason } from "@prisma/client";
import { AppError } from "../utils/appError.js";
import prisma from "../config/prisma.js";
import { AdjustStockInput } from "../validation/inventory.schema.js";
import { PrismaAPIFeatures } from "../utils/apiFeatures.js";

export class InventoryServices {
  // manual stock adjustment
  static async adjustStock(
    tenantId: string,
    variantId: string,
    input: AdjustStockInput,
    userId?: string,
  ) {
    const { quantityDelta, reason, note, referenceId } = input;
    // check if quantity delta is zero
    if (quantityDelta === 0) {
      throw new AppError("Quantity delta cannot be zero", 400);
    }
    // transaction
    return await prisma.$transaction(async (tx) => {
      // 1- check variant exists && make sure new stock won't be minus value
      const variant = await tx.productVariant.findFirst({
        where: {
          id: variantId,
          tenantId,
        },
      });
      if (!variant) {
        throw new AppError("Product Variant not found in this store", 404);
      }
      const newStockQuantity = variant.stockQuantity + quantityDelta;
      if (newStockQuantity < 0) {
        throw new AppError(
          `Insufficient stock. Current stock is ${variant.stockQuantity}, requested reduction is ${Math.abs(quantityDelta)}`,
          400,
        );
      }

      // 2- update variant stock
      const updatedVariant = await tx.productVariant.update({
        where: { id: variantId },
        data: {
          stockQuantity: newStockQuantity,
        },
      });

      // 3- log stock movement process
      const movement = await tx.stockMovement.create({
        data: {
          tenantId,
          variantId,
          quantity: quantityDelta,
          reason,
          note,
          referenceId,
          createdById: userId,
        },
      });
      return {
        variant: updatedVariant,
        movement,
      };
    });
  }
  // get low stock
  static async getLowStock(tenantId: string, threshold: number = 5) {
    const lowStockVariants = await prisma.productVariant.findMany({
      where: {
        tenantId,
        stockQuantity: {
          lte: threshold,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
          },
        },
      },
      orderBy: {
        stockQuantity: "asc",
      },
    });
    return {
      message: "This is low stock variants",
      variants: lowStockVariants,
    };
  }
  // get stock movements history using PrismaAPIFeatures
  static async getMovementsHistory(
    tenantId: string,
    queryString: Record<string, any>,
  ) {
    const features = new PrismaAPIFeatures(queryString, {
      searchFields: ["note", "referenceId"],
    })
      .filter()
      .sort()
      .paginate();

    const builtQuery = features.build();

    const where = {
      ...builtQuery.where,
      tenantId,
    };
    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        ...builtQuery,
        where,
        include: {
          variant: {
            select: {
              id: true,
              sku: true,
              title: true,
              product: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return {
      message: "Movment history is retrieved !",
      movements,
      pagination: {
        total,
        page: features.page,
        limit: features.take,
        totalPages: Math.ceil(total / features.take),
      },
    };
  }
}
