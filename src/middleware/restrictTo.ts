import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError.js";

export const restrictTo = (...allowedTypes: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !allowedTypes.includes(req.user.userType)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403),
      );
    }
    next();
  };
};
