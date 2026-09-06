import { Gender } from "@prisma/client";
import { z } from "zod";

// 1. Customer / Regular User Registration
export const registerUserSchema = z.object({
  body: z.object({
    email: z.string().email("Please provide a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    phoneNumber: z.string().optional(),
    birthDate: z.string().datetime({ offset: true }).optional(),
    gender: z.nativeEnum(Gender).optional(),
  }),
});

// 2. Tenant Owner Registration (Creates User + Tenant in one step)
export const registerTenantOwnerSchema = z.object({
  body: z.object({
    // User Details
    email: z.string().email("Please provide a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    phoneNumber: z.string().optional(),

    // Tenant Details
    tenantName: z
      .string()
      .min(2, "Store/Tenant name must be at least 2 characters"),
    tenantSlug: z
      .string()
      .min(2, "Slug must be at least 2 characters")
      .regex(
        /^[a-z0-9-]+$/,
        "Slug must contain only lowercase letters, numbers, and hyphens",
      ),
  }),
});

// 3. Login Schema
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Please provide a valid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>["body"];
export type RegisterTenantOwnerInput = z.infer<
  typeof registerTenantOwnerSchema
>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
