import prisma from "../config/prisma.js";
import { AppError } from "../utils/appError.js";

export class CartServices {
  // Helper function
  private static async getOrCreateCart(
    tenantId: string,
    userId?: string,
    sessionId?: string,
  ) {
    // if no user or session
    if (!userId && !sessionId) {
      throw new AppError("Either userId or sessionId must be provided", 400);
    }
    // if user
    let cart = await prisma.cart.findFirst({
      where: {
        tenantId,
        ...(userId ? { userId } : { sessionId }),
      },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          tenantId,
          userId: userId || null,
          sessionId: sessionId || null,
        },
      });
    }

    return cart;
  }
  // add to cart
  static async addToCart(
    tenantId: string,
    variantId: string,
    quantity: number,
    userId?: string,
    sessionId?: string,
  ) {
    // 1- get variant
    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, tenantId },
      include: {
        product: {
          select: {
            status: true,
          },
        },
      },
    });
    // check variant status
    if (!variant || variant.product.status !== "PUBLISHED") {
      throw new AppError("Product variant not found or not available", 404);
    }
    // check variant qty
    if (variant.stockQuantity < quantity) {
      throw new AppError(
        `Insufficient stock available. Only ${variant.stockQuantity} items in stock`,
        400,
      );
    }
    // 2- get cart
    const cart = await this.getOrCreateCart(tenantId, userId, sessionId);

    // check if variant already exists in cart
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId,
        },
      },
    });
    const newQuantity = existingCartItem
      ? existingCartItem.quantity + quantity
      : quantity;
    // check if total (newQty) exceeds available qty
    if (variant.stockQuantity < newQuantity) {
      throw new AppError(
        `Cannot add to cart. Total requested quantity (${newQuantity}) exceeds available stock (${variant.stockQuantity})`,
        400,
      );
    }
    // 3- add to cart
    if (existingCartItem) {
      await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId,
          quantity,
        },
      });
    }
    // Return full cart
    return await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    title: true,
                    slug: true,
                    images: true,
                    price: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
