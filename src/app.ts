import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors, { CorsOptions } from "cors";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import { AppError } from "./utils/appError.js";
import globalErrorHandler from "./middleware/errorHandler.middleware.js";
// 1- App
const app = express();

// 2- Security Headers
app.use(helmet());

// 3- CORS setup

const allowedOrigins: string[] = ["http://localhost:3000"];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS policy"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-App-Version",
    "X-Requested-With",
    "Accept",
  ],
  credentials: true,
};
app.use(cors(corsOptions));

// 4- Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: "fail",
    message:
      "Too many requests from this IP, please try again after 15 minutes!",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// 5- logger
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// 6. Body Parsers & Cookies
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// 7- Routes
app.use("/api/v1/auth", authRoutes);

// 8. 404 Route Handler
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 9. Global Error Handler
app.use(globalErrorHandler);

export default app;
