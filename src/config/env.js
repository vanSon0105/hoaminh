import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "hoaminh-jwt-secret-dev",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  adminOrderEmail: process.env.ADMIN_ORDER_EMAIL || process.env.SMTP_USER || "admin@hoaminh.local",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || process.env.SMTP_USER || "Họa Minh <no-reply@hoaminh.local>",
  publicApiUrl: process.env.PUBLIC_API_URL || "",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || "",
  facebookAppId: process.env.FACEBOOK_APP_ID || "",
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET || "",
  facebookCallbackUrl: process.env.FACEBOOK_CALLBACK_URL || ""
};
