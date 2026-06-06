require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

// Import configuration and utilities
const env = require("./env");
const logger = require("./utils/logger");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");

// Initialize Express app
const app = express();

// =====================================================
// MIDDLEWARE CONFIGURATION
// =====================================================

// Parse incoming requests
app.use(express.json({ limit: env.MAX_FILE_SIZE.toString() }));
app.use(
  express.urlencoded({ limit: env.MAX_FILE_SIZE.toString(), extended: true }),
);

// Enable CORS
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// File upload handling
app.use(
  fileUpload({
    limits: { fileSize: env.MAX_FILE_SIZE },
    abortOnLimit: true,
    responseOnLimit: "File size exceeds the limit",
    useTempFiles: true,
    tempFileDir: "/tmp/",
  }),
);

// Serve static files
app.use(express.static(path.join(__dirname, "client/public")));
app.use("/media", express.static(path.join(__dirname, env.UPLOAD_DIR)));

// Request logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// =====================================================
// ROUTE IMPORTS
// =====================================================

const { runCampaign } = require("./loops/campaignLoop.js");
const nodeCleanup = require("node-cleanup");
const { init, cleanup } = require("./helper/addon/qr");

// routers
const userRoute = require("./routes/user");
app.use("/api/user", userRoute);

const webRoute = require("./routes/web");
app.use("/api/web", webRoute);

const adminRoute = require("./routes/admin");
app.use("/api/admin", adminRoute);

const phonebookRoute = require("./routes/phonebook");
app.use("/api/phonebook", phonebookRoute);

const chat_flowRoute = require("./routes/chatFlow");
app.use("/api/chat_flow", chat_flowRoute);

const inboxRoute = require("./routes/inbox");
app.use("/api/inbox", inboxRoute);

const templetRoute = require("./routes/templet");
app.use("/api/templet", templetRoute);

const chatbotRoute = require("./routes/chatbot");
app.use("/api/chatbot", chatbotRoute);

const broadcastRoute = require("./routes/broadcast");
app.use("/api/broadcast", broadcastRoute);

const apiRoute = require("./routes/apiv2");
app.use("/api/v1", apiRoute);

const agentRoute = require("./routes/agent");
app.use("/api/agent", agentRoute);

const qrRoute = require("./routes/qr");
app.use("/api/qr", qrRoute);

// =====================================================
// HEALTH CHECK & API DOCUMENTATION
// =====================================================

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    msg: "Server is healthy",
    timestamp: new Date().toISOString(),
    version: env.appVersion,
    environment: env.NODE_ENV,
  });
});

// API Status endpoint
app.get("/api/status", (req, res) => {
  res.status(200).json({
    success: true,
    status: "running",
    version: env.appVersion,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// =====================================================
// SPA FALLBACK ROUTING
// =====================================================

const currentDir = process.cwd();
app.use(express.static(path.resolve(currentDir, "./client/public")));

// Fallback to index.html for SPA routing
app.get("*", function (request, response) {
  const indexPath = path.resolve(currentDir, "./client/public", "index.html");
  if (fs.existsSync(indexPath)) {
    response.sendFile(indexPath);
  } else {
    response.status(404).json({
      success: false,
      msg: "Frontend not found. Please build the React app.",
      hint: "Run: cd client && npm run build",
    });
  }
});

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 Not Found handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// =====================================================
// SERVER STARTUP
// =====================================================

const server = app.listen(env.PORT, () => {
  logger.info(`✓ B1G CRM Server started successfully`, {
    port: env.PORT,
    environment: env.NODE_ENV,
    version: env.appVersion,
  });

  // Initialize QR code handler
  try {
    init();
    logger.info("✓ QR code handler initialized");
  } catch (err) {
    logger.error("QR initialization failed:", { error: err.message });
  }

  // Start campaign loop after 1 second
  setTimeout(() => {
    try {
      runCampaign();
      logger.info("✓ Campaign loop started");
    } catch (err) {
      logger.error("Campaign loop failed:", { error: err.message });
    }
  }, 1000);
});

// Initialize Socket.IO after server is running
const io = require("./socket").initializeSocket(server);

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, gracefully shutting down...");
  server.close(() => {
    logger.info("Server closed");
    cleanup();
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, gracefully shutting down...");
  server.close(() => {
    logger.info("Server closed");
    cleanup();
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", { error: err.message, stack: err.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection:", { reason, promise });
});

nodeCleanup(cleanup);

module.exports = { app, server, io };
