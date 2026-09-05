import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { env } from "../config/env.js";
import { AppError } from "../utils/appError.js";

const handlePrismaDuplicateFields = (
  err: Prisma.PrismaClientKnownRequestError,
): AppError => {
  const target = (err.meta?.target as string[]) || [];
  const fields = target.join(", ");
  const message = `Duplicate field value: [${fields}]. Please use another value!`;
  return new AppError(message, 400);
};

const handlePrismaNotFound = (
  err: Prisma.PrismaClientKnownRequestError,
): AppError => {
  const cause = (err.meta?.cause as string) || "Record not found";
  return new AppError(cause, 404);
};

const handlePrismaForeignKey = (
  err: Prisma.PrismaClientKnownRequestError,
): AppError => {
  const fieldName = (err.meta?.field_name as string) || "referenced field";
  return new AppError(
    `Invalid relation: foreign key constraint failed on ${fieldName}`,
    400,
  );
};

const handleJWTError = (): AppError =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = (): AppError =>
  new AppError("Your token has expired! Please log in again.", 401);

const sendErrorDev = (err: any, res: Response): void => {
  res.status(err.statusCode || 500).json({
    status: err.status || "error",
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: any, res: Response): void => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error("ERROR :", err);

    res.status(500).json({
      status: "error",
      message: "Something went very wrong on our end!",
    });
  }
};

export const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    let error = err;

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") error = handlePrismaDuplicateFields(err);
      if (err.code === "P2025") error = handlePrismaNotFound(err);
      if (err.code === "P2003") error = handlePrismaForeignKey(err);
    }

    // JWT Errors
    if (err.name === "JsonWebTokenError") error = handleJWTError();
    if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

export default globalErrorHandler;
