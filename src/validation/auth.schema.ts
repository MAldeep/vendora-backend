import { Gender, TenantRole } from "@prisma/client";
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
// verify email schema
export const verifyEmailSchema = z.object({
  params: z.object({
    token: z
      .string({ error: "Verification token is required." })
      .min(1, "Token cannot be empty."),
  }),
});
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("This must be a valid email address"),
  }),
});
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z
      .string({ error: "Verification token is required." })
      .min(1, "Token can't be empty"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
  }),
});
export const acceptInvitationSchema = z.object({
  body: z.object({
    token: z
      .string({ error: "Verification token is required." })
      .min(1, "Token can't be empty"),
    fullName: z.string().min(2, "Name must be provided"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
  }),
});
export const inviteUserSchema = z.object({
  body: z.object({
    tenantId: z
      .string({
        error: "Tenant ID is required.",
      })
      .min(1, "Tenant ID cannot be empty."),

    email: z
      .string({
        error: "Email is required.",
      })
      .email("Invalid email address format.")
      .toLowerCase()
      .trim(),

    role: z.nativeEnum(TenantRole, {
      error: `Invalid tenant role. Allowed values: ${Object.values(TenantRole).join(", ")}`,
    }),
  }),
});
export type RegisterUserInput = z.infer<typeof registerUserSchema>["body"];
export type RegisterTenantOwnerInput = z.infer<
  typeof registerTenantOwnerSchema
>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>["params"];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>["body"];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>["body"];
export type AcceptInvitationInput = z.infer<
  typeof acceptInvitationSchema
>["body"];
export type InviteUserInput = z.infer<typeof inviteUserSchema>["body"];
