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

export const getLowStockSchema = z.object({
  query: z.object({
    threshold: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 5))
      .pipe(z.number().positive("Threshold must be a positive number")),
  }),
});

export const getMovementsSchema = z.object({
  query: z
    .object({
      variantId: z.string().optional(),
      reason: z.nativeEnum(StockMovementReason).optional(),
      search: z.string().optional(),
      sort: z.string().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
      fields: z.string().optional(),
    })
    .passthrough(), // للسماح بأي فلاتر إضافية تتعامل معاها الـ Utility
});
export type AdjustStockInput = z.infer<typeof adjustStockSchema>["body"];
