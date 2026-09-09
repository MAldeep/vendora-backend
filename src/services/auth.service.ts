import { Permission, TenantRole, UserType } from "@prisma/client";
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
  AcceptInvitationInput,
  ForgotPasswordInput,
  InviteUserInput,
  LoginInput,
  RegisterTenantOwnerInput,
  RegisterUserInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "../validation/auth.schema.js";
import { env } from "../config/env.js";
import jwt from "jsonwebtoken";
import { EmailService } from "./email.service.js";
import { DEFAULT_ROLE_PERMISSIONS } from "../config/permissions.js";

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
    await EmailService.registerInitUser(
      input.email,
      verificationToken,
      input.fullName,
    );
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
    await EmailService.registerInitOwner(
      input.email,
      verificationToken,
      input.fullName,
      input.tenantName,
    );
    return {
      message:
        "Verification email sent. Please verify your email to create your store.",
      verificationToken,
    };
  }

  // Register Transaction
  static async verifyEmailAndRegister(data: VerifyEmailInput) {
    let payload: EmailVerificationPayload;
    try {
      payload = verifyVerificationToken(data.token);
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

    const fullUserData = await AuthServices.getMe(user.id);

    const tokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      userType: user.userType,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: fullUserData,
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

    const user = await AuthServices.getMe(decoded.userId);

    const tokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      userType: user.userType,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    return {
      user,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  // Get Me
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
        tenantRoles: {
          select: {
            tenantId: true,
            role: true,
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
              },
            },
            customRole: {
              select: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new AppError("User not found or account deactivated", 404);
    }

    const formattedTenants = user.tenantRoles.map((item) => {
      let permissions: string[] = [];

      if (item.role === TenantRole.CUSTOM && item.customRole) {
        permissions = item.customRole.permissions;
      } else if (item.role !== TenantRole.CUSTOM) {
        const roleKey = item.role as Exclude<TenantRole, "CUSTOM">;
        permissions = DEFAULT_ROLE_PERMISSIONS[roleKey] || [];
      }

      return {
        tenantId: item.tenantId,
        tenantName: item.tenant.name,
        tenantSlug: item.tenant.slug,
        tenantIsActive: item.tenant.isActive,
        role: item.role,
        permissions,
      };
    });

    const { tenantRoles, ...userData } = user;

    return {
      ...userData,
      tenants: formattedTenants,
    };
  }

  // Forgot Password
  static async forgotPassword(data: ForgotPasswordInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) {
      return {
        message:
          "If an account with that email exists, a password reset link has been sent.",
      };
    }

    const secret = env.JWT_ACCESS_SECRET + user.passwordHash;
    const resetPayload = { userId: user.id, email: user.email };
    const resetToken = jwt.sign(resetPayload, secret, {
      expiresIn: "15m",
    });

    // Send Email
    await EmailService.sendResetPasswordEmail(user.email, resetToken);

    return {
      message:
        "If an account with that email exists, a password reset link has been sent.",
      resetToken,
    };
  }

  // Reset Password
  static async resetPassword(data: ResetPasswordInput) {
    const unverifiedDecoded = jwt.decode(data.token) as {
      userId: string;
    } | null;
    if (!unverifiedDecoded?.userId) {
      throw new AppError("Invalid or expired password reset token.", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: unverifiedDecoded.userId },
    });
    if (!user) {
      throw new AppError("User no longer exists.", 404);
    }

    const secret = env.JWT_ACCESS_SECRET + user.passwordHash;
    try {
      jwt.verify(data.token, secret);
    } catch (_error) {
      throw new AppError("Invalid or expired password reset token.", 400);
    }

    const newPasswordHash = await hashPassword(data.newPassword);
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

  // Invite user by owner/manager
  static async inviteUser(
    ownerUserId: string,
    { tenantId, email, role }: InviteUserInput,
  ) {
    const requesterRole = await prisma.tenantUserRole.findUnique({
      where: {
        userId_tenantId: { userId: ownerUserId, tenantId },
      },
    });

    if (
      !requesterRole ||
      (requesterRole.role !== TenantRole.OWNER &&
        requesterRole.role !== TenantRole.MANAGER)
    ) {
      throw new AppError(
        "You do not have permission to invite members to this store.",
        403,
      );
    }

    const existingMember = await prisma.user.findFirst({
      where: {
        email,
        tenantRoles: {
          some: { tenantId },
        },
      },
    });

    if (existingMember) {
      throw new AppError("User is already a member of this store.", 400);
    }

    const invitePayload = { email, tenantId, role };
    const invitationToken = jwt.sign(invitePayload, env.JWT_ACCESS_SECRET, {
      expiresIn: "48h",
    });

    await EmailService.inviteUser(email, invitationToken, tenantId, role);

    return {
      message: `Invitation successfully created for ${email}.`,
      invitationToken,
    };
  }

  // Accept Invitation
  static async acceptInvitation(data: AcceptInvitationInput) {
    let decoded: { email: string; tenantId: string; role: TenantRole };

    try {
      decoded = jwt.verify(data.token, env.JWT_ACCESS_SECRET) as {
        email: string;
        tenantId: string;
        role: TenantRole;
      };
    } catch (_error) {
      throw new AppError("Invalid or expired invitation token.", 400);
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: decoded.tenantId },
    });

    if (!tenant || !tenant.isActive) {
      throw new AppError(
        "The store accepting this invitation no longer exists or is inactive.",
        404,
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { email: decoded.email },
      });

      if (!user) {
        if (!data.password || !data.fullName) {
          throw new AppError(
            "Full name and password are required for new accounts.",
            400,
          );
        }
        const passwordHash = await hashPassword(data.password);
        user = await tx.user.create({
          data: {
            email: decoded.email,
            passwordHash,
            fullName: data.fullName,
            userType: UserType.USER,
          },
        });
      }

      // Check if role relation already exists
      const existingRole = await tx.tenantUserRole.findUnique({
        where: {
          userId_tenantId: {
            userId: user.id,
            tenantId: decoded.tenantId,
          },
        },
      });

      if (existingRole) {
        throw new AppError("You are already a member of this store.", 400);
      }

      const tenantUserRole = await tx.tenantUserRole.create({
        data: {
          userId: user.id,
          tenantId: decoded.tenantId,
          role: decoded.role,
        },
      });

      return { user, tenantUserRole };
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
      role: result.tenantUserRole.role,
      accessToken,
      refreshToken,
    };
  }
}
