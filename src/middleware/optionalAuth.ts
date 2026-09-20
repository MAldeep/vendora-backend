import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET as string);
      req.user = decoded as unknown as NonNullable<typeof req.user>;
    } catch (err) {
      req.user = undefined;
    }
  }

  next();
};
