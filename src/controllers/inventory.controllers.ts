import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";
import { InventoryServices } from "../services/inventory.services.js";

export class InventoryControllers {
  static adjustStock = catchAsync(async (req: Request, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID must be provided !", 400);
    }
    const userId = req.user?.id;
    const variantId = req.params.variantId;
    const input = req.body;
    const { variant, movement } = await InventoryServices.adjustStock(
      tenantId,
      variantId as string,
      input,
      userId,
    );
    res.status(200).json({
      status: "success",
      message: "Stock adjusted Successfully !",
      variant,
      movement,
    });
  });
  static getLowStock = catchAsync(async (req: Request, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID must be provided !", 400);
    }
    const threshold = req.query.threshold ? Number(req.query.threshold) : 5;
    const { message, variants } = await InventoryServices.getLowStock(
      tenantId,
      threshold,
    );

    res.status(200).json({
      status: "success",
      results: variants.length,
      message,
      data: {
        variants,
      },
    });
  });
  static getMovementsHistory = catchAsync(
    async (req: Request, res: Response) => {
      const tenantId = req.tenantId;
      if (!tenantId) {
        throw new AppError("Tenant ID must be provided !", 400);
      }
      const { movements, pagination, message } =
        await InventoryServices.getMovementsHistory(tenantId, req.query);

      res.status(200).json({
        status: "success",
        results: movements.length,
        message,
        pagination,
        data: {
          movements,
        },
      });
    },
  );
}
