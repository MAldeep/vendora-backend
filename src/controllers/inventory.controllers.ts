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
}
