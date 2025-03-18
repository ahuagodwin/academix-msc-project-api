import { config } from "dotenv";

config({ path: `.env.${process?.env?.NODE_ENV || "development"}.local` });

export const {
  PORT,
  NODE_ENV,
  FRONTEND_URL_LOCAL,
  FRONTEND_URL_LIVE,
  DB_URL,
  DB_PASSWORD,
  DB_USERNAME,
  ARCJET_SECRET_KEY,
  JWT_SECRET_KEY,
  JWT_EXPIRY_KEY,
  BACKEND_URL_LOCAL,
  SMTP_MAIL_ID,
  SMTP_MAIL_PASSWORD,
  JWT_REFRESH_EXPIRATION
} = process.env;

if (
  !PORT ||
  !NODE_ENV ||
  !FRONTEND_URL_LOCAL ||
  !FRONTEND_URL_LIVE ||
  !DB_URL ||
  !DB_PASSWORD ||
  !DB_USERNAME ||
  !ARCJET_SECRET_KEY ||
  !JWT_SECRET_KEY ||
  !JWT_EXPIRY_KEY ||
  !BACKEND_URL_LOCAL ||
  !SMTP_MAIL_ID ||
  !SMTP_MAIL_PASSWORD ||
  !JWT_REFRESH_EXPIRATION
) {
  throw new Error("Missing environment variables");
}
