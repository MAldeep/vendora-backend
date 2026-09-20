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
