import type { Request } from "express";
import type {
  User,
  TenantRole,
  TenantUserRole,
  CustomRole,
} from "@prisma/client";
import { JwtPayload } from "../utils/passwordAndTokens.utils.js";

export interface AuthRequest extends Request {
  user?: User;
  tokenPayload?: JwtPayload & { iat?: number };
  tenantId?: string;
  tenantRole?: TenantRole;
  tenantUserRole?: TenantUserRole & { customRole?: CustomRole | null };
}
