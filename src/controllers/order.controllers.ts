import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";
import { OrderServices } from "../services/order.services.js";

export class OrderControllers {
  static checkout = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const {
      shippingAddress,
      paymentGateway,
      sessionId,
      guestName,
      guestEmail,
      guestPhone,
    } = req.body;

    const guestSessionId = sessionId || (req.headers["x-session-id"] as string);

    if (!userId && !guestEmail) {
      throw new AppError("Guest email is required for guest checkout", 400);
    }

    const order = await OrderServices.checkoutOrder({
      userId,
      sessionId: guestSessionId,
      guestName,
      guestEmail,
      guestPhone,
      shippingAddress,
      paymentGateway,
    });

    res.status(201).json({
      status: "success",
      message: "Order placed successfully",
      data: {
        order,
      },
    });
  });
}
