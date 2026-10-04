export class AppError extends Error {
    statusCode;
    status;
    isOperational;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;
        const errorConstructor = Error;
        if (errorConstructor.captureStackTrace) {
            errorConstructor.captureStackTrace(this, this.constructor);
        }
    }
}
