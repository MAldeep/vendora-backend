import nodemailer from "nodemailer";
import { env } from "./env.js";
export const transporter = nodemailer.createTransport({
  host: env.SMTP_Host,
  port: Number(env.SMTP_Port),
  secure: Number(env.SMTP_Port) === 465,
  auth: {
    user: env.SMTP_Username,
    pass: env.SMTP_Password,
  },
});

export const verifyEmailConnection = async (): Promise<void> => {
  try {
    await transporter.verify();
    console.log("Email Service Connected Successfully to Gmail SMTP");
  } catch (error) {
    console.error("Email Service Connection Failed:", error);
  }
};
