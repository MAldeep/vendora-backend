export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    const errorConstructor = Error as unknown as {
      captureStackTrace?: (
        targetObject: object,
        constructorOpt?: Function,
      ) => void;
    };
    if (errorConstructor.captureStackTrace) {
      errorConstructor.captureStackTrace(this, this.constructor);
    }
  }
}
