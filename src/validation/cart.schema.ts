import { z } from "zod";

export const addToCartSchema = z.object({
  body: z.object({
    variantId: z.string().uuid("Invalid Variant ID format"),
    quantity: z
      .number({ error: "Quantity is required" })
      .int()
      .positive("Quantity must be greater than 0"),
    sessionId: z.string().optional(),
  }),
});

export const getCartSchema = z.object({
  query: z.object({
    sessionId: z.string().optional(),
  }),
});
export const updateCartItemSchema = z.object({
  params: z.object({
    itemId: z.string().uuid("Invalid Cart Item ID format"),
  }),
  body: z.object({
    quantity: z
      .number({ error: "Quantity is required" })
      .int()
      .positive("Quantity must be greater than 0"),
    sessionId: z.string().optional(),
  }),
});

export const removeCartItemSchema = z.object({
  params: z.object({
    itemId: z.string().uuid("Invalid Cart Item ID format"),
  }),
  query: z.object({
    sessionId: z.string().optional(),
  }),
});

export const clearCartSchema = z.object({
  query: z.object({
    sessionId: z.string().optional(),
  }),
});
