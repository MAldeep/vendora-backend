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

    const { masterOrder, paymentResult } = await OrderServices.checkoutOrder({
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
        masterOrder,
        paymentResult,
      },
    });
  });
  static getTenantOrders = catchAsync(async (req: Request, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID must be provided !", 400);
    }

    const { orders, pagination } = await OrderServices.getTenantOrders(
      tenantId,
      req.query,
    );

    res.status(200).json({
      status: "success",
      results: orders.length,
      pagination,
      data: { orders },
    });
  });
  static updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant ID must be provided !", 400);
    }

    const { orderId } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    const order = await OrderServices.updateOrderStatus(
      tenantId,
      orderId as string,
      status,
      userId,
    );

    res.status(200).json({
      status: "success",
      message: `Order status updated to ${status} successfully`,
      data: { order },
    });
  });

  static getMyOrders = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    const { orders, pagination } = await OrderServices.getMyOrders(
      userId,
      req.query,
    );

    res.status(200).json({
      status: "success",
      results: orders.length,
      pagination,
      data: { orders },
    });
  });

  static trackOrder = catchAsync(async (req: Request, res: Response) => {
    const { orderId, email } = req.query as { orderId: string; email: string };

    const order = await OrderServices.trackOrder(orderId, email);

    res.status(200).json({
      status: "success",
      data: { order },
    });
  });

  static cancelOrder = catchAsync(async (req: Request, res: Response) => {
    const orderId = req.params.orderId;
    const userId = req.user?.id;
    const { email: guestEmail, reason } = req.body || {};

    if (!userId && !guestEmail) {
      throw new AppError("User authentication or guest email is required", 400);
    }

    const updatedOrder = await OrderServices.cancelCustomerOrder({
      orderId: orderId as string,
      userId,
      guestEmail,
      cancelReason: reason,
    });

    res.status(200).json({
      status: "success",
      message: "Order cancelled successfully and stock restored",
      data: { order: updatedOrder },
    });
  });
}
