import { TenantRole, UserType } from "@prisma/client";
import prisma from "../config/prisma.js";
import { AppError } from "../utils/appError.js";
import {
  comparePassword,
  EmailVerificationPayload,
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
  hashPassword,
  JwtPayload,
  verifyRefreshToken,
  verifyVerificationToken,
} from "../utils/passwordAndTokens.utils.js";
import {
  LoginInput,
  RegisterTenantOwnerInput,
  RegisterUserInput,
} from "../validation/auth.schema.js";
import { env } from "../config/env.js";
import jwt from "jsonwebtoken";

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

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        userType: result.user.userType,
      },
      tenant: result.tenant,
    };
  }
  // Login
  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user || !(await comparePassword(input.password, user.passwordHash))) {
      throw new AppError("Invalid email or password", 401);
    }

    if (!user.isActive) {
      throw new AppError(
        "Your account has been deactivated. Please contact support.",
        403,
      );
    }
    const tokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      userType: user.userType,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        userType: user.userType,
      },
      accessToken,
      refreshToken,
    };
  }
  // Refresh Token
  static async refreshToken(refreshToken: string) {
    let decoded: JwtPayload;

    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (_error) {
      throw new AppError(
        "Invalid or expired refresh token. Please log in again.",
        401,
      );
    }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    if (!user || !user.isActive) {
      throw new AppError("User no longer exists or account is inactive.", 401);
    }
    const tokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      userType: user.userType,
    };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
  // get me
  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        birthDate: true,
        gender: true,
        userType: true,
        isActive: true,
        createdAt: true,
        ownedTenants: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
        tenantRoles: {
          select: {
            role: true,
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new AppError("User not found or account deactivated", 404);
    }
    return user;
  }
  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email },
    });
    if (!user) {
      // just for security purposes
      return {
        message:
          "If an account with that email exists, a password reset link has been sent.",
      };
    }
    const resetPayload = { userId: user.id, email: user.email };
    const resetToken = jwt.sign(resetPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: "15m",
    });
    // await sendResetPasswordEmail(user.email, resetToken);
    return {
      message:
        "If an account with that email exists, a password reset link has been sent.",
      resetToken,
    };
  }
  static async resetPassword(token: string, newPassword: string) {
    let decoded: { userId: string; email: string };
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
        userId: string;
        email: string;
      };
    } catch (_error) {
      throw new AppError("Invalid or expired password reset token.", 400);
    }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    if (!user) {
      throw new AppError("User no longer exists.", 404);
    }
    const newPasswordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        passwordChangedAt: new Date(),
      },
    });
    return {
      message:
        "Password reset successful. You can now log in with your new password.",
    };
  }
}
