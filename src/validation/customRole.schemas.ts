import { Permission } from "@prisma/client";
import z from "zod";

export const createCustomRoleSchema = z.object({
  body: z.object({
    name: z
      .string({ error: "Role name is required" })
      .trim()
      .min(2, "Role name must be at least 2 characters")
      .max(50, "Role name cannot exceed 50 characters"),
    description: z
      .string()
      .trim()
      .max(255, "Description cannot exceed 255 characters")
      .optional(),
    permissions: z
      .array(z.nativeEnum(Permission), {
        error: "Permissions array is required",
      })
      .min(1, "At least one permission must be assigned to a custom role"),
  }),
});

export const updateCustomRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid custom role ID format"),
  }),
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Role name must be at least 2 characters")
      .max(50, "Role name cannot exceed 50 characters")
      .optional(),
    description: z
      .string()
      .trim()
      .max(255, "Description cannot exceed 255 characters")
      .optional(),
    permissions: z
      .array(z.nativeEnum(Permission))
      .min(1, "If provided, permissions array cannot be empty")
      .optional(),
  }),
});

export const customRoleIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid custom role ID format"),
  }),
});

export type CreateCustomRoleInput = z.infer<
  typeof createCustomRoleSchema
>["body"];
export type UpdateCustomRoleInput = z.infer<
  typeof updateCustomRoleSchema
>["body"];
