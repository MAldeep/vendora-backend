import { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncRequestHandler<T extends Request = Request> = (
  req: T,
  res: Response,
  next: NextFunction,
) => Promise<any>;

export const catchAsync =
  <T extends Request = Request>(fn: AsyncRequestHandler<T>): RequestHandler =>
  (req, res, next) => {
    fn(req as T, res, next).catch(next);
  };
