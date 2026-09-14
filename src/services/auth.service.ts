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
  static async getMe(userId: string, activeTenantId?: string) {
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
                id: true,
                name: true,
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
        customRoleName: item.customRole?.name,
        customRoleId: item.customRole?.id,
      };
    });
    const activeTenant = activeTenantId
      ? formattedTenants.find((t) => t.tenantId === activeTenantId) ||
        formattedTenants[0] ||
        null
      : formattedTenants[0] || null;
    const { tenantRoles, ...userData } = user;

    return {
      ...userData,
      tenants: formattedTenants,
      activeTenant,
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
    { tenantId, email, role, customRoleId }: InviteUserInput,
  ) {
    const requesterRole = await prisma.tenantUserRole.findUnique({
      where: {
        userId_tenantId: { userId: ownerUserId, tenantId },
      },
      include: {
        customRole: true,
      },
    });
    if (!requesterRole) {
      throw new AppError(
        "You do not have permission to invite members to this store.",
        403,
      );
    }
    const isOwnerOrManager =
      requesterRole?.role === TenantRole.OWNER ||
      requesterRole?.role === TenantRole.MANAGER;

    const userPermissions =
      (requesterRole.customRole?.permissions as string[]) || [];

    const hasCustomInvitePermission =
      requesterRole.role === TenantRole.CUSTOM &&
      (userPermissions.includes("users:invite") ||
        userPermissions.includes("manage_users"));

    if (!isOwnerOrManager && !hasCustomInvitePermission) {
      throw new AppError(
        "You do not have permission to invite members to this store.",
        403,
      );
    }

    if (role === TenantRole.CUSTOM) {
      if (!customRoleId) {
        throw new AppError(
          "customRoleId is required when assigning a custom role.",
          400,
        );
      }

      const validCustomRole = await prisma.customRole.findFirst({
        where: { id: customRoleId, tenantId },
      });

      if (!validCustomRole) {
        throw new AppError(
          "The specified custom role does not exist for this store.",
          404,
        );
      }
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

    const invitePayload = {
      email,
      tenantId,
      role,
      customRoleId: role === TenantRole.CUSTOM ? customRoleId : null,
    };
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
    let decoded: {
      email: string;
      tenantId: string;
      role: TenantRole;
      customRoleId?: string | null;
    };
    // Verify Token
    try {
      decoded = jwt.verify(data.token, env.JWT_ACCESS_SECRET) as {
        email: string;
        tenantId: string;
        role: TenantRole;
        customRoleId?: string | null;
      };
    } catch (_error) {
      throw new AppError("Invalid or expired invitation token.", 400);
    }

    // Get The tenant and check it
    const tenant = await prisma.tenant.findUnique({
      where: { id: decoded.tenantId },
    });

    if (!tenant || !tenant.isActive) {
      throw new AppError(
        "The store associated with this invitation no longer exists or is inactive.",
        404,
      );
    }

    // Transaction
    const result = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { email: decoded.email },
      });

      // if new user
      if (!user) {
        if (!data.password || !data.fullName) {
          throw new AppError(
            "Full name and password are required to set up your account.",
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

      // Check if the user already signed in this tenant
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

      // check custom role possibility (scoped to this tenant)
      if (decoded.role === TenantRole.CUSTOM && decoded.customRoleId) {
        const customRoleExists = await tx.customRole.findFirst({
          where: {
            id: decoded.customRoleId,
            tenantId: decoded.tenantId,
          },
        });

        if (!customRoleExists) {
          throw new AppError(
            "The custom role associated with this invitation is no longer available.",
            400,
          );
        }
      }

      // create the role of the user
      const tenantUserRole = await tx.tenantUserRole.create({
        data: {
          userId: user.id,
          tenantId: decoded.tenantId,
          role: decoded.role,
          customRoleId:
            decoded.role === TenantRole.CUSTOM ? decoded.customRoleId : null,
        },
      });

      return { user, tenantUserRole };
    });

    // Fetch unified user structure
    const fullUserData = await AuthServices.getMe(
      result.user.id,
      decoded.tenantId,
    );

    // Auto-Login Tokens
    const tokenPayload: JwtPayload = {
      userId: result.user.id,
      email: result.user.email,
      userType: result.user.userType,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      message: "Invitation accepted successfully.",
      user: fullUserData,
      accessToken,
      refreshToken,
    };
  }
  static async deleteUser(ownerId: string, userId: string, tenantId: string) {
    if (ownerId === userId) {
      throw new AppError(
        "Owners cannot remove themselves from their tenant",
        400,
      );
    }
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        ownerId: ownerId,
      },
      include: {
        owner: {
          select: { isActive: true },
        },
      },
    });
    if (!tenant) {
      throw new AppError(
        "Tenant not found or you are not authorized to manage it",
        403,
      );
    }

    if (!tenant.owner?.isActive) {
      throw new AppError("Owner account is deactivated", 403);
    }
    const membership = await prisma.tenantUserRole.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });
    if (!membership) {
      throw new AppError("User is not a member of this tenant", 404);
    }

    await prisma.tenantUserRole.delete({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });
    return {
      message: "User removed from tenant successfully",
    };
  }
}
