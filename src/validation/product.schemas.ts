import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ProductStatusEnum = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);
const productVariantItemSchema = z.object({
  title: z
    .string({ error: "Variant title is required" })
    .trim()
    .min(2)
    .max(100),

  sku: z.string({ error: "Variant SKU is required" }).trim().min(3).max(50),

  price: z.coerce.number().positive().optional(),

  stockQuantity: z.coerce.number().int().min(0).default(0),

  // parse or check JSON record
  attributes: z.record(z.string(), z.union([z.string(), z.number()])),
});
// 1. Create Product Schema
export const createProductSchema = z.object({
  body: z
    .object({
      title: z
        .string({ error: "Product title is required" })
        .trim()
        .min(3, "Product title must be at least 3 characters")
        .max(150, "Product title cannot exceed 150 characters"),

      slug: z
        .string()
        .trim()
        .toLowerCase()
        .regex(
          slugRegex,
          "Slug must contain only lowercase alphanumeric characters and hyphens",
        )
        .optional(),

      categoryId: z
        .string({ error: "Category ID is required" })
        .uuid("Invalid category ID format"),

      description: z
        .string()
        .trim()
        .max(2000, "Description cannot exceed 2000 characters")
        .optional(),

      price: z.coerce
        .number({ error: "Price is required" })
        .positive("Price must be greater than 0"),

      compareAtPrice: z.coerce
        .number()
        .positive("Compare at price must be greater than 0")
        .optional(),

      sku: z
        .string({ error: "SKU is required" })
        .trim()
        .min(3, "SKU must be at least 3 characters")
        .max(50, "SKU cannot exceed 50 characters"),

      status: ProductStatusEnum.optional(),

      isFeatured: z.coerce.boolean().optional(),
      variants: z.array(productVariantItemSchema).optional(),
    })
    .refine(
      (data) => {
        if (
          data.compareAtPrice !== undefined &&
          data.compareAtPrice <= data.price
        ) {
          return false;
        }
        return true;
      },
      {
        message:
          "Compare at price must be strictly greater than the regular price",
        path: ["compareAtPrice"],
      },
    ),
});

// 2. Update Product Schema
export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid product ID format"),
  }),
  body: z
    .object({
      title: z.string().trim().min(3).max(150).optional(),
      slug: z.string().trim().toLowerCase().regex(slugRegex).optional(),
      categoryId: z.string().uuid("Invalid category ID format").optional(),
      description: z.string().trim().max(2000).nullable().optional(),
      price: z.number().positive("Price must be greater than 0").optional(),
      compareAtPrice: z.number().positive().nullable().optional(),
      sku: z.string().trim().min(3).max(50).optional(),
      status: ProductStatusEnum.optional(),
      isFeatured: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    })
    .refine(
      (data) => {
        if (
          data.price !== undefined &&
          data.compareAtPrice !== undefined &&
          data.compareAtPrice !== null
        ) {
          return data.compareAtPrice > data.price;
        }
        return true;
      },
      {
        message:
          "Compare at price must be strictly greater than the regular price",
        path: ["compareAtPrice"],
      },
    ),
});

// 3. Product ID Param Schema
export const productIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid product ID format"),
  }),
});

// Types
export type CreateProductInput = z.infer<typeof createProductSchema>["body"];
export type UpdateProductInput = z.infer<typeof updateProductSchema>["body"];
