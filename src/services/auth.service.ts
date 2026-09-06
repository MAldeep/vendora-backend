import { TenantRole, UserType } from "@prisma/client";
import prisma from "../config/prisma.js";
import { AppError } from "../utils/appError.js";
import {
  EmailVerificationPayload,
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
  hashPassword,
  JwtPayload,
  verifyVerificationToken,
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
      userType: UserType.USER,
      isTenantOwner: false,
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
      userType: UserType.USER,
      isTenantOwner: true,
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
  // Register Transaction
  static async verifyEmailAndRegister(token: string) {
    let payload: EmailVerificationPayload;
    try {
      payload = verifyVerificationToken(token);
    } catch (_error) {
      throw new AppError("Invalid or expired verification token.", 400);
    }
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (existingUser) {
      throw new AppError("Email is already registered and verified.", 400);
    }
    const result = await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: {
          email: payload.email,
          passwordHash: payload.passwordHash,
          fullName: payload.fullName,
          phoneNumber: payload.phoneNumber,
          userType: UserType.USER,
        },
      });
      // tenant
      let tenant = null;
      if (payload.isTenantOwner && payload.tenantName && payload.tenantSlug) {
        tenant = await tx.tenant.create({
          data: {
            name: payload.tenantName,
            slug: payload.tenantSlug,
            ownerId: user.id,
          },
        });
        await tx.tenantUserRole.create({
          data: {
            userId: user.id,
            tenantId: tenant.id,
            role: TenantRole.OWNER,
          },
        });
      }
      return { user, tenant };
    });
    const tokenPayload: JwtPayload = {
      userId: result.user.id,
      email: result.user.email,
      userType: result.user.userType,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        userType: result.user.userType,
      },
      tenant: result.tenant,
      accessToken,
      refreshToken,
    };
  }
}
