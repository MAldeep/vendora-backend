import dotenv from "dotenv";
import z from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)),
  DB_URI: z.string().url("MONGODB_URI must be a valid connection string"),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  SMTP_Host: z.string(),
  SMTP_Port: z.string().transform((val) => parseInt(val, 10)),
  SMTP_Username: z.string(),
  SMTP_Password: z.string(),
  CLIENT_URL: z.string(),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error("Invalid environment variables");
  console.error(parseResult.error.format());
  process.exit(1);
}

export const env = parseResult.data;
