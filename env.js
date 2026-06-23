const crypto = require("crypto");

const appVersion = "3.0.1";
const addON = [""];

function envValue(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value !== undefined && value !== "") {
      return value;
    }
  }

  return "";
}

function numberValue(names, fallback) {
  const value = envValue(...names);
  return value ? Number(value) : fallback;
}

function boolValue(name, fallback = false) {
  const value = envValue(name);
  if (!value) {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

const NODE_ENV = envValue("NODE_ENV") || "development";
const isProduction = NODE_ENV === "production";

function requiredSecret(name, aliases = []) {
  const value = envValue(name, ...aliases);
  if (value) {
    return value;
  }

  if (isProduction) {
    throw new Error(`${name} must be set in production`);
  }

  console.warn(`[config] ${name} is not set; using an ephemeral development secret.`);
  return crypto.randomBytes(32).toString("hex");
}

const PORT = numberValue(["PORT"], 3010);
const SOCKET_PORT = numberValue(["SOCKET_PORT"], 3002);

const PGHOST = envValue("PGHOST", "DBHOST") || "127.0.0.1";
const PGUSER = envValue("PGUSER", "DBUSER") || "b1gcrm";
const PGPASSWORD = envValue("PGPASSWORD", "DBPASS");
const PGDATABASE = envValue("PGDATABASE", "DBNAME") || "b1gcrm";
const PGPORT = numberValue(["PGPORT", "DBPORT"], 5432);
const DATABASE_URL = envValue("DATABASE_URL", "POSTGRES_URL");
const PGSSL = boolValue("PGSSL", false);

const JWT_SECRET = requiredSecret("JWT_SECRET", ["JWTKEY"]);
const JWT_EXPIRY = envValue("JWT_EXPIRY") || "7d";
const REFRESH_TOKEN_SECRET = requiredSecret("REFRESH_TOKEN_SECRET", [
  "JWT_REFRESH_SECRET",
  "JWTKEY",
]);

const STRIPE_API_KEY = envValue("STRIPE_API_KEY");
const STRIPE_WEBHOOK_SECRET = envValue("STRIPE_WEBHOOK_SECRET");
const RAZORPAY_KEY_ID = envValue("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = envValue("RAZORPAY_KEY_SECRET");

const SMTP_HOST = envValue("SMTP_HOST");
const SMTP_PORT = numberValue(["SMTP_PORT"], 587);
const SMTP_USER = envValue("SMTP_USER");
const SMTP_PASSWORD = envValue("SMTP_PASSWORD");
const SMTP_FROM_EMAIL = envValue("SMTP_FROM_EMAIL");

const META_VERIFY_TOKEN = envValue("META_VERIFY_TOKEN");
const META_WEBHOOK_TOKEN = envValue("META_WEBHOOK_TOKEN");
const WHATSAPP_API_TOKEN = envValue("WHATSAPP_API_TOKEN");
const META_APP_ID = envValue("META_APP_ID");
const META_APP_SECRET = envValue("META_APP_SECRET");

const REDIS_URL = envValue("REDIS_URL") || "redis://localhost:6379";
const REDIS_ENABLED = boolValue("REDIS_ENABLED", false);
const MOCK_META_DELIVERY = boolValue("MOCK_META_DELIVERY", false);

const AWS_ACCESS_KEY = envValue("AWS_ACCESS_KEY");
const AWS_SECRET_KEY = envValue("AWS_SECRET_KEY");
const AWS_S3_BUCKET = envValue("AWS_S3_BUCKET") || "b1g-crm-media";
const AWS_REGION = envValue("AWS_REGION") || "us-east-1";
const S3_ENABLED = boolValue("S3_ENABLED", false);

const FRONTEND_URL =
  envValue("FRONTEND_URL", "FRONTENDURI") || "http://localhost:5173";
const BACKEND_URL = envValue("BACKEND_URL", "BACKURI") || `http://localhost:${PORT}`;
const CORS_ORIGINS = (envValue("CORS_ORIGINS") || FRONTEND_URL)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const API_BASE_URL = envValue("API_BASE_URL") || `http://localhost:${PORT}/api`;
const STRIPE_LANG = envValue("STRIPE_LANG") || "en";

const MAX_FILE_SIZE = numberValue(["MAX_FILE_SIZE"], 10 * 1024 * 1024);
const UPLOAD_DIR = envValue("UPLOAD_DIR") || "./client/public/media";

const TWILIO_ACCOUNT_SID = envValue("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = envValue("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = envValue("TWILIO_PHONE_NUMBER");

const RATE_LIMIT_WINDOW_MS = numberValue(
  ["RATE_LIMIT_WINDOW_MS"],
  15 * 60 * 1000
);
const RATE_LIMIT_MAX_REQUESTS = numberValue(["RATE_LIMIT_MAX_REQUESTS"], 1000);

const LOG_LEVEL = envValue("LOG_LEVEL") || "info";

const FEATURES = {
  ENABLE_WHATSAPP: envValue("ENABLE_WHATSAPP") !== "false",
  ENABLE_INSTAGRAM: envValue("ENABLE_INSTAGRAM") !== "false",
  ENABLE_PAYMENTS: envValue("ENABLE_PAYMENTS") !== "false",
  ENABLE_BROADCAST: envValue("ENABLE_BROADCAST") !== "false",
  ENABLE_CHATBOT: envValue("ENABLE_CHATBOT") !== "false",
  ENABLE_API_KEYS: envValue("ENABLE_API_KEYS") !== "false",
};

module.exports = {
  appVersion,
  addON,
  PORT,
  SOCKET_PORT,
  NODE_ENV,
  PGHOST,
  PGUSER,
  PGPASSWORD,
  PGDATABASE,
  PGPORT,
  PGSSL,
  DATABASE_URL,
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
  BACKEND_URL,
  CORS_ORIGINS,
  API_BASE_URL,
  STRIPE_LANG,
  MAX_FILE_SIZE,
  UPLOAD_DIR,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  LOG_LEVEL,
  FEATURES,
  MOCK_META_DELIVERY,
};
