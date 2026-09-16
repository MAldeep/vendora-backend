import { z } from "zod";

// Validating the JSON attributes: { [key: string]: string | number }
const variantAttributesSchema = z.record(
  z.string({ error: "Attribute key must be a string" }),
  z.union([z.string(), z.number()], {
    error: () => ({ message: "Attribute value must be a string or number" }),
  }),
);

export const createVariantSchema = z.object({
  body: z.object({
    title: z
      .string({ error: "Variant title is required (e.g. Red / XL)" })
      .trim()
      .min(2, "Variant title must be at least 2 characters")
      .max(100, "Variant title cannot exceed 100 characters"),

    sku: z
      .string({ error: "Variant SKU is required" })
      .trim()
      .min(3, "SKU must be at least 3 characters")
      .max(50, "SKU cannot exceed 50 characters"),

    price: z.coerce
      .number()
      .positive("Variant price must be greater than 0")
      .optional(),

    stockQuantity: z.coerce
      .number({ error: "Stock quantity is required" })
      .int("Stock quantity must be an integer")
      .min(0, "Stock quantity cannot be negative")
      .default(0),

    attributes: variantAttributesSchema,
  }),
});

export const updateVariantSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(100).optional(),

    sku: z.string().trim().min(3).max(50).optional(),

    price: z.coerce
      .number()
      .positive("Variant price must be greater than 0")
      .nullable()
      .optional(),

    stockQuantity: z.coerce.number().int().min(0).optional(),

    attributes: variantAttributesSchema.optional(),
  }),
});

export type CreateVariantInput = z.infer<typeof createVariantSchema>["body"];
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>["body"];
