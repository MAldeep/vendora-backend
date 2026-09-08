import z from "zod";

export const createTenantSchema = z.object({
  body: z.object({
    name: z
      .string({ error: "Tenant name is required" })
      .trim()
      .min(2, "Tenant name must be at least 2 characters"),
    slug: z
      .string({ error: "Tenant slug is required" })
      .trim()
      .lowercase()
      .min(2, "Tenant slug must be at least 2 characters")
      .regex(
        /^[a-z0-9-]+$/,
        "Slug must contain only lowercase letters, numbers, and hyphens (e.g. my-store-name)",
      ),
  }),
});

export type CreateTenant = z.infer<typeof createTenantSchema>["body"];
