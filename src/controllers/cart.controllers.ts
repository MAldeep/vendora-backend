import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";
import { CartServices } from "../services/cart.services.js";

export class CartControllers {
  static addToCart = catchAsync(async (req: Request, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID must be provided !", 400);
    }
    const userId = req.user?.id;
    const { variantId, quantity, sessionId } = req.body;
    const guestSessionId = sessionId || (req.headers["x-session-id"] as string);
    if (!userId && !guestSessionId) {
      throw new AppError(
        "User authentication or x-session-id header is required",
        400,
      );
    }
    const cart = await CartServices.addToCart(
      tenantId,
      variantId,
      quantity,
      userId,
      guestSessionId,
    );
    res.status(200).json({
      status: "success",
      message: "Item added to cart successfully",
      data: {
        cart,
      },
    });
  });
  static getCart = catchAsync(async (req: Request, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID must be provided !", 400);
    }

    const userId = req.user?.id;
    const sessionId =
      (req.query.sessionId as string) ||
      (req.headers["x-session-id"] as string);
    if (!userId && !sessionId) {
      throw new AppError(
        "User authentication or x-session-id is required",
        400,
      );
    }
    const cart = await CartServices.getCart(tenantId, userId, sessionId);

    res.status(200).json({
      status: "success",
      data: {
        cart,
      },
    });
  });
  static updateCartItemQuantity = catchAsync(
    async (req: Request, res: Response) => {
      const tenantId = req.tenantId;
      if (!tenantId) {
        throw new AppError("Tenant ID must be provided !", 400);
      }
      const { itemId } = req.params;
      const { quantity, sessionId } = req.body;
      const userId = req.user?.id;
      const guestSessionId =
        sessionId || (req.headers["x-session-id"] as string);

      if (!userId && !guestSessionId) {
        throw new AppError(
          "User authentication or x-session-id header is required",
          400,
        );
      }
      const cart = await CartServices.updateCartItemQuantity(
        tenantId,
        itemId as string,
        quantity,
        userId,
        guestSessionId,
      );
      res.status(200).json({
        status: "success",
        message: "Cart item updated successfully",
        data: { cart },
      });
    },
  );
}
