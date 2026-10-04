import { TokenPayload } from "../utils/auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      tenantId?: string;
      tokenPayload?: TokenPayload;
      tenantRole?: string;
      tenantUserRole?: any;
    }
  }
}

declare module "express-serve-static-core" {
  interface Request {
    user?: any;
    tenantId?: string;
    tokenPayload?: TokenPayload;
    tenantRole?: string;
    tenantUserRole?: any;
  }
}
