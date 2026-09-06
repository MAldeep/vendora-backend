import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
export interface JwtPayload {
  userId: string;
  email: string;
  userType: string;
}
export interface EmailVerificationPayload {
  email: string;
  passwordHash: string;
  fullName: string;
  phoneNumber?: string | null;
  userType: "CUSTOMER" | "TENANT_USER";
  tenantName?: string;
  tenantSlug?: string;
}
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};
export const comparePassword = (
  candidate: string,
  hashed: string,
): Promise<boolean> => {
  return bcrypt.compare(candidate, hashed);
};

export const generateAccessToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: "15m" as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: "7d" as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
};

export const generateVerificationToken = (
  payload: EmailVerificationPayload,
): string => {
  const secret = env.JWT_ACCESS_SECRET;
  return jwt.sign(payload, secret, { expiresIn: "30m" });
};

export const verifyVerificationToken = (
  token: string,
): EmailVerificationPayload => {
  const secret = env.JWT_ACCESS_SECRET;
  return jwt.verify(token, secret) as EmailVerificationPayload;
};
