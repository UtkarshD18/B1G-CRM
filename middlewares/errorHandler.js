const logger = require("../utils/logger");
const env = require("../env");

function errorHandler(err, req, res, next) {
  logger.error("Request error", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let code = err.code || "INTERNAL_ERROR";

  if (err.name === "ValidationError") {
    statusCode = 400;
    code = "VALIDATION_ERROR";
  }

  if (["23505", "ER_DUP_ENTRY"].includes(err.code)) {
    statusCode = 409;
    code = "DUPLICATE_ENTRY";
    message = "This record already exists";
  }

  if (["23503", "ER_NO_REFERENCED_ROW"].includes(err.code)) {
    statusCode = 422;
    code = "INVALID_REFERENCE";
    message = "Referenced record not found";
  }

  if (["28P01", "ER_ACCESS_DENIED_ERROR"].includes(err.code)) {
    statusCode = 403;
    code = "ACCESS_DENIED";
  }

  if (["ECONNREFUSED", "PROTOCOL_CONNECTION_LOST"].includes(err.code)) {
    statusCode = 503;
    code = "DATABASE_UNAVAILABLE";
    message = "Database connection failed";
  }

  res.status(statusCode).json({
    success: false,
    msg: message,
    code,
    ...(env.NODE_ENV === "development" && { error: err.message }),
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    msg: "Endpoint not found",
    code: "NOT_FOUND",
    path: req.path,
  });
}

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
