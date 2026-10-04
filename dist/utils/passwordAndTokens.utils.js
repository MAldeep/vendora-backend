import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
};
export const comparePassword = (candidate, hashed) => {
    return bcrypt.compare(candidate, hashed);
};
export const generateAccessToken = (payload) => {
    const options = {
        expiresIn: "15m",
    };
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
};
export const generateRefreshToken = (payload) => {
    const options = {
        expiresIn: "7d",
    };
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
};
export const verifyAccessToken = (token) => {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
};
export const verifyRefreshToken = (token) => {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
};
export const generateVerificationToken = (payload) => {
    const secret = env.JWT_ACCESS_SECRET;
    return jwt.sign(payload, secret, { expiresIn: "30m" });
};
export const verifyVerificationToken = (token) => {
    const secret = env.JWT_ACCESS_SECRET;
    return jwt.verify(token, secret);
};
