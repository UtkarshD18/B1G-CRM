const appVersion = "3.0.1";
const addON = [""];

/**
 * ENVIRONMENT CONFIGURATION
 * Update these values based on your deployment environment
 */

// Server Configuration
const PORT = process.env.PORT || 3001;
const SOCKET_PORT = process.env.SOCKET_PORT || 3002;
const NODE_ENV = process.env.NODE_ENV || "development";

// Database Configuration (MySQL)
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "b1g_crm";
const DB_PORT = process.env.DB_PORT || 3306;

// JWT & Authentication
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your-refresh-token-secret";

// Payment Gateway Keys
const STRIPE_API_KEY = process.env.STRIPE_API_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

// Email/SMTP Configuration
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || "noreply@b1gcrm.com";

// WhatsApp & Meta Integration
const META_VERIFY_TOKEN =
  process.env.META_VERIFY_TOKEN || "verify-token-for-webhooks";
const META_WEBHOOK_TOKEN =
  process.env.META_WEBHOOK_TOKEN || "webhook-callback-token";
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN || "";
const META_APP_ID = process.env.META_APP_ID || "";
const META_APP_SECRET = process.env.META_APP_SECRET || "";

// Redis Configuration (Optional - for caching/sessions)
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const REDIS_ENABLED = process.env.REDIS_ENABLED === "true" || false;

// AWS S3 Configuration (for media storage)
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY || "";
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY || "";
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || "b1g-crm-media";
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const S3_ENABLED = process.env.S3_ENABLED === "true" || false;

// Frontend Configuration
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001/api";

// File Upload Configuration
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || 50 * 1024 * 1024; // 50MB
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./client/public/media";

// Twilio Configuration (optional)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "";

// Rate Limiting
const RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS || 100;

// Logging
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

// Feature Flags
const FEATURES = {
  ENABLE_WHATSAPP: process.env.ENABLE_WHATSAPP !== "false",
  ENABLE_INSTAGRAM: process.env.ENABLE_INSTAGRAM !== "false",
  ENABLE_TELEGRAM: process.env.ENABLE_TELEGRAM !== "false",
  ENABLE_PAYMENTS: process.env.ENABLE_PAYMENTS !== "false",
  ENABLE_BROADCAST: process.env.ENABLE_BROADCAST !== "false",
  ENABLE_CHATBOT: process.env.ENABLE_CHATBOT !== "false",
  ENABLE_API_KEYS: process.env.ENABLE_API_KEYS !== "false",
};

module.exports = {
  appVersion,
  addON,
  PORT,
  SOCKET_PORT,
  NODE_ENV,
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT,
  JWT_SECRET,
  JWT_EXPIRY,
  REFRESH_TOKEN_SECRET,
  STRIPE_API_KEY,
  STRIPE_WEBHOOK_SECRET,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASSWORD,
  SMTP_FROM_EMAIL,
  META_VERIFY_TOKEN,
  META_WEBHOOK_TOKEN,
  WHATSAPP_API_TOKEN,
  META_APP_ID,
  META_APP_SECRET,
  REDIS_URL,
  REDIS_ENABLED,
  AWS_ACCESS_KEY,
  AWS_SECRET_KEY,
  AWS_S3_BUCKET,
  AWS_REGION,
  S3_ENABLED,
  FRONTEND_URL,
  API_BASE_URL,
  MAX_FILE_SIZE,
  UPLOAD_DIR,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  LOG_LEVEL,
  FEATURES,
};
