import { User } from "@prisma/client";
import { JwtPayload } from "../utils/auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      tokenPayload?: JwtPayload;
    }
  }
}
