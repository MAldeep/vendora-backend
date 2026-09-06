import prisma from "../config/prisma.js";
import { AppError } from "../utils/appError.js";
import {
  EmailVerificationPayload,
  generateVerificationToken,
  hashPassword,
} from "../utils/passwordAndTokens.utils.js";
import {
  RegisterTenantOwnerInput,
  RegisterUserInput,
} from "../validation/auth.schema.js";

export class AuthServices {
  // Register initiation customer (normal user)
  static async initiateUserRegistration(input: RegisterUserInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingUser) {
      throw new AppError("Email is Already Registered!", 400);
    }
    const passwordHash = await hashPassword(input.password);

    const verificationPayload: EmailVerificationPayload = {
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phoneNumber: input.phoneNumber,
      userType: "CUSTOMER",
    };
    const verificationToken = generateVerificationToken(verificationPayload);
    // await sendVerificationEmail(input.email, verificationToken);
    return {
      message: "Verification email sent successfully. Please check your inbox.",
      verificationToken,
    };
  }
  // Register initiation tenant owner
  static async initiateTenantOwnerRegistration(
    input: RegisterTenantOwnerInput,
  ) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingUser) {
      throw new AppError("Email is already registered", 400);
    }
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: input.tenantSlug },
    });
    if (existingTenant) {
      throw new AppError(
        "Tenant slug is already taken. Choose another one.",
        400,
      );
    }
    const passwordHash = await hashPassword(input.password);
    const verificationPayload: EmailVerificationPayload = {
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phoneNumber: input.phoneNumber,
      userType: "TENANT_USER",
      tenantName: input.tenantName,
      tenantSlug: input.tenantSlug,
    };
    const verificationToken = generateVerificationToken(verificationPayload);
    // await sendVerificationEmail(input.email, verificationToken);
    return {
      message:
        "Verification email sent. Please verify your email to create your store.",
      verificationToken,
    };
  }
}
