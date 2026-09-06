import { AuthServices } from "../services/auth.service.js";
import { catchAsync } from "../utils/catchAsync.js";
import { Response, Request, CookieOptions } from "express";
import {
  RegisterTenantOwnerInput,
  RegisterUserInput,
} from "../validation/auth.schema.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/appError.js";
const refreshTokenCookiesOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
const accessTokenCookiesOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 15 * 60 * 1000,
};
export class AuthController {
  // Register Init => User
  static registerUserInit = catchAsync(async (req: Request, res: Response) => {
    const registerData: RegisterUserInput = req.body;
    const result = await AuthServices.initiateUserRegistration(registerData);
    res.status(200).json({
      status: "success",
      message: "Verification code sent to your email.",
      data: result,
    });
  });
  // Register Init => Owner
  static registerTenantOwnerInit = catchAsync(
    async (req: Request, res: Response) => {
      const registerData: RegisterTenantOwnerInput = req.body;
      const result =
        await AuthServices.initiateTenantOwnerRegistration(registerData);
      res.status(200).json({
        status: "success",
        message: "Verification code sent to your email.",
        data: result,
      });
    },
  );
  // Register exe
  static verifyEmailAndRegister = catchAsync(
    async (req: Request, res: Response) => {
      const { token } = req.params;
      const user = await AuthServices.verifyEmailAndRegister(token as string);
      res.status(201).json({
        status: "success",
        message: "User Created Successfully !",
        data: user,
      });
    },
  );
  // Login
  static login = catchAsync(async (req: Request, res: Response) => {
    const loginData = req.body;
    const { user, accessToken, refreshToken } =
      await AuthServices.login(loginData);
    if (accessToken) {
      res.cookie("accessToken", accessToken, accessTokenCookiesOptions);
    }
    if (refreshToken) {
      res.cookie("refreshToken", refreshToken, refreshTokenCookiesOptions);
    }
    res.status(200).json({
      status: "success",
      message: "User LoggedIn Succesfully !",
      data: {
        user: user,
        accessToken,
      },
    });
  });
  // refreshToken
  static refreshToken = catchAsync(async (req: Request, res: Response) => {
    const incomingToken = req.cookies.refreshToken;
    if (!incomingToken) {
      throw new AppError("No refresh token provided", 401);
    }
    const { accessToken, refreshToken, user } =
      await AuthServices.refreshToken(incomingToken);
    res.cookie("refreshToken", refreshToken, refreshTokenCookiesOptions);
    res.cookie("accessToken", accessToken, accessTokenCookiesOptions);
    res.status(200).json({
      status: "success",
      message: "Token refreshed successfully",
      data: {
        user,
        accessToken,
      },
    });
  });
}
