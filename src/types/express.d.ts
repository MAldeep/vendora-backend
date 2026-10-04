import "express";
import type {
  TenantRole,
  TenantUserRole,
  CustomRole,
  User,
} from "@prisma/client";
import type { JwtPayload } from "../utils/auth.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
    tokenPayload?: JwtPayload & {
      iat?: number;
    };
    tenantId?: string;
    tenantRole?: TenantRole;
    tenantUserRole?: TenantUserRole & {
      customRole?: CustomRole | null;
    };
    files?:
      | Express.Multer.File[]
      | {
          [fieldname: string]: Express.Multer.File[];
        };
  }
}
