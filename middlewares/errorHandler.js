const logger = require("../utils/logger");
const env = require("../env");

/**
 * Error handling middleware
 * Catches and logs errors with appropriate HTTP status codes
 */
function errorHandler(err, req, res, next) {
  logger.error("Request Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Default error status
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let code = err.code || "INTERNAL_ERROR";

  // Validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    code = "VALIDATION_ERROR";
  }

  // Duplicate entry errors
  if (err.code === "ER_DUP_ENTRY") {
    statusCode = 409;
    code = "DUPLICATE_ENTRY";
    message = "This record already exists";
  }

  // Foreign key errors
  if (err.code === "ER_NO_REFERENCED_ROW") {
    statusCode = 422;
    code = "INVALID_REFERENCE";
    message = "Referenced record not found";
  }

  // Access denied
  if (err.code === "ER_ACCESS_DENIED_ERROR") {
    statusCode = 403;
    code = "ACCESS_DENIED";
  }

  // Database connection errors
  if (err.code === "ECONNREFUSED" || err.code === "PROTOCOL_CONNECTION_LOST") {
    statusCode = 503;
    code = "DATABASE_UNAVAILABLE";
    message = "Database connection failed";
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    msg: message,
    code,
    ...(env.NODE_ENV === "development" && { error: err.message }),
  });
}

/**
 * 404 Not Found middleware
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    msg: "Endpoint not found",
    code: "NOT_FOUND",
    path: req.path,
  });
}

/**
 * Async error handler wrapper
 * Wraps async route handlers to catch errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
