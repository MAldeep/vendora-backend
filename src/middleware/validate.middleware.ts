import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { AppError } from "../utils/appError.js";

export const validate =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const parseResult = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!parseResult.success) {
      const error = parseResult.error as ZodError;
      const errorMessage = error.issues
        .map((issue) => `${issue.path.join(".")} : ${issue.message}`)
        .join(" | ");

      return next(new AppError(errorMessage, 400));
    }

    const validData = parseResult.data as {
      body?: Record<string, any>;
      params?: Record<string, any>;
      query?: Record<string, any>;
    };

    if (validData.body) req.body = validData.body;
    if (validData.params) req.params = validData.params;
    if (validData.query) {
      Object.keys(req.query).forEach((key) => delete req.query[key]);
      Object.assign(req.query, validData.query);
    }

    next();
  };
