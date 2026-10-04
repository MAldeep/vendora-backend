import dotenv from "dotenv";
import z from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)),
  DATABASE_URL: z.string().url("MONGODB_URI must be a valid connection string"),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  // SMTP_Host: z.string(),
  // SMTP_Port: z.string().transform((val) => parseInt(val, 10)),
  // SMTP_Username: z.string(),
  // SMTP_Password: z.string(),
  BREVO_API_KEY: z.string(),
  CLIENT_URL: z.string(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  SENDER_EMAIL: z.string().email(),
  SENDER_NAME: z.string(),
  PAYMOB_API_KEY: z.string().optional(),
  PAYMOB_INTEGRATION_ID: z.string().optional(),
  PAYMOB_IFRAME_ID: z.string().optional(),
  PAYMOB_HMAC_SECRET: z.string().optional(),
  PAYMOB_MERCHANT_ID: z.string().optional(),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error("Invalid environment variables");
  console.error(parseResult.error.format());
  process.exit(1);
}

export const env = parseResult.data;
