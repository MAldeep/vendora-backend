import z from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string({ error: "Category name is required" })
      .trim()
      .min(2, "Category name must be at least 2 characters")
      .max(100, "Category name cannot exceed 100 characters"),

    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        slugRegex,
        "Slug must contain only lowercase alphanumeric characters and hyphens",
      )
      .optional(),

    description: z
      .string()
      .trim()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),

    isActive: z.boolean({ error: "isActive must be a boolean" }).optional(),

    parentId: z
      .string()
      .uuid("Invalid parent category ID format")
      .nullable()
      .optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid category ID format"),
  }),
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Category name must be at least 2 characters")
        .max(100, "Category name cannot exceed 100 characters")
        .optional(),

      slug: z
        .string()
        .trim()
        .toLowerCase()
        .regex(
          slugRegex,
          "Slug must contain only lowercase alphanumeric characters and hyphens",
        )
        .optional(),

      description: z
        .string()
        .trim()
        .max(500, "Description cannot exceed 500 characters")
        .nullable()
        .optional(),

      isActive: z.boolean({ error: "isActive must be a boolean" }).optional(),

      parentId: z
        .string()
        .uuid("Invalid parent category ID format")
        .nullable()
        .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    }),
});

export const categoryIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid category ID format"),
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>["body"];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>["body"];
