import { AuthServices } from "../services/auth.service.js";
import { catchAsync } from "../utils/catchAsync.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/appError.js";
const refreshTokenCookiesOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
const accessTokenCookiesOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
};
export class AuthController {
    // Register Init => User
    static registerUserInit = catchAsync(async (req, res) => {
        const registerData = req.body;
        const result = await AuthServices.initiateUserRegistration(registerData);
        res.status(200).json({
            status: "success",
            message: "Verification code sent to your email.",
            data: result,
        });
    });
    // Register Init => Owner
    static registerTenantOwnerInit = catchAsync(async (req, res) => {
        const registerData = req.body;
        const result = await AuthServices.initiateTenantOwnerRegistration(registerData);
        res.status(200).json({
            status: "success",
            message: "Verification code sent to your email.",
            data: result,
        });
    });
    // Register exe
    static verifyEmailAndRegister = catchAsync(async (req, res) => {
        const rawToken = req.params.token;
        const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
        if (!token) {
            throw new AppError("Verification token is required", 400);
        }
        const user = await AuthServices.verifyEmailAndRegister({ token });
        res.status(201).json({
            status: "success",
            message: "User Created Successfully !",
            data: user,
        });
    });
    // Login
    static login = catchAsync(async (req, res) => {
        const loginData = req.body;
        const { user, accessToken, refreshToken } = await AuthServices.login(loginData);
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
    static refreshToken = catchAsync(async (req, res) => {
        const incomingToken = req.cookies.refreshToken;
        if (!incomingToken) {
            throw new AppError("No refresh token provided", 401);
        }
        const { accessToken, refreshToken, user } = await AuthServices.refreshToken(incomingToken);
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
    // me
    static getMe = catchAsync(async (req, res) => {
        const id = req.user?.id;
        if (!id) {
            throw new AppError("User ID missing from request context", 400);
        }
        const me = await AuthServices.getMe(id);
        res.status(200).json({
            status: "success",
            message: "User Detected Successfully !",
            data: me,
        });
    });
    // forget password
    static forgotPassword = catchAsync(async (req, res) => {
        const email = req.body;
        const { message } = await AuthServices.forgotPassword(email);
        res.status(200).json({
            status: "success",
            message: message,
        });
    });
    // reset password
    static resetPassword = catchAsync(async (req, res) => {
        const data = req.body;
        const { message } = await AuthServices.resetPassword(data);
        res.status(200).json({
            status: "success",
            message: message,
        });
    });
    // invite users
    static inviteUser = catchAsync(async (req, res) => {
        const ownerUserId = req.user?.id;
        const data = req.body;
        const { message } = await AuthServices.inviteUser(ownerUserId, data);
        res.status(200).json({
            status: "success",
            message: message,
        });
    });
    // accept invitation
    static acceptInvitation = catchAsync(async (req, res) => {
        const data = req.body;
        const { accessToken, user, refreshToken } = await AuthServices.acceptInvitation(data);
        res.cookie("refreshToken", refreshToken, refreshTokenCookiesOptions);
        res.cookie("accessToken", accessToken, accessTokenCookiesOptions);
        res.status(201).json({
            status: "success",
            message: "Invitation accepted and account setup completed successfully!",
            data: {
                user: user,
                accessToken: accessToken,
            },
        });
    });
    // logout
    static logout = catchAsync(async (_req, res) => {
        res.clearCookie("accessToken", { ...accessTokenCookiesOptions, maxAge: 0 });
        res.clearCookie("refreshToken", {
            ...refreshTokenCookiesOptions,
            maxAge: 0,
        });
        res.status(200).json({
            status: "success",
            message: "Logged out successfully!",
        });
    });
    // Delete user from tenant
    static deleteUser = catchAsync(async (req, res) => {
        const ownerId = req.user?.id;
        if (!ownerId) {
            throw new AppError("User ID missing from request context", 400);
        }
        const { tenantId, userId } = req.body;
        const { message } = await AuthServices.deleteUser(ownerId, userId, tenantId);
        res.status(200).json({
            status: "success",
            message: message,
        });
    });
}
