import { z } from "zod";
import { StockMovementReason } from "@prisma/client";

export const adjustStockSchema = z.object({
  params: z.object({
    variantId: z.string().uuid("Invalid Variant ID format"),
  }),
  body: z.object({
    quantityDelta: z
      .number({ error: "Quantity delta is required" })
      .int("Quantity delta must be an integer")
      .refine((val) => val !== 0, {
        message: "Quantity delta cannot be zero",
      }),
    reason: z.nativeEnum(StockMovementReason, {
      error: "Valid stock movement reason is required",
    }),
    note: z.string().max(500, "Note is too long").optional(),
    referenceId: z.string().optional(),
  }),
});

export type AdjustStockInput = z.infer<typeof adjustStockSchema>["body"];
