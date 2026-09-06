import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";
import {
  JwtPayload,
  verifyAccessToken,
} from "../utils/passwordAndTokens.utils.js";
import prisma from "../config/prisma.js";

export const protect = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    let token: string | undefined;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
    if (!token) {
      return next(
        new AppError(
          "You are not logged in! Please log in to get access.",
          401,
        ),
      );
    }
    let decoded: JwtPayload & { iat?: number };
    try {
      decoded = verifyAccessToken(token) as JwtPayload & { iat?: number };
    } catch (_error) {
      return next(
        new AppError("Invalid or expired token. Please log in again!", 401),
      );
    }
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    if (!currentUser) {
      return next(
        new AppError("The user belonging to this token no longer exists.", 401),
      );
    }
    if (currentUser.passwordChangedAt && decoded.iat) {
      const changedTimestamp = Math.floor(
        currentUser.passwordChangedAt.getTime() / 1000,
      );
      if (changedTimestamp > decoded.iat) {
        return next(
          new AppError(
            "User recently changed password! Please log in again.",
            401,
          ),
        );
      }
    }
    req.user = currentUser;
    req.tokenPayload = decoded;

    next();
  },
);
