const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const env = require("../env");
const logger = require("./logger");

function generateId() {
  return uuidv4();
}

async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  } catch (error) {
    logger.error("Password hash error", { error: error.message });
    throw error;
  }
}

async function comparePassword(password, hash) {
  try {
    return bcrypt.compare(password, hash);
  } catch (error) {
    logger.error("Password compare error", { error: error.message });
    throw error;
  }
}

function generateToken(payload, secret = env.JWT_SECRET, expiresIn = env.JWT_EXPIRY) {
  try {
    return jwt.sign(payload, secret, { expiresIn });
  } catch (error) {
    logger.error("Token generation error", { error: error.message });
    throw error;
  }
}

function verifyToken(token, secret = env.JWT_SECRET) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    logger.error("Token verification error", { error: error.message });
    throw error;
  }
}

function generateTokenPair(payload) {
  const accessToken = generateToken(payload, env.JWT_SECRET, env.JWT_EXPIRY);
  const refreshToken = generateToken(payload, env.REFRESH_TOKEN_SECRET, "30d");

  return {
    accessToken,
    refreshToken,
    expiresIn: env.JWT_EXPIRY,
  };
}

function extractToken(authHeader) {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  return parts.length === 2 && parts[0] === "Bearer" ? parts[1] : null;
}

function getTokenRole(decoded) {
  return decoded?.type || decoded?.role;
}

function generateVerificationCode(length = 6) {
  return Math.floor(
    Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)
  ).toString();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[+]?[()0-9\-\s.]{8,24}$/.test(phone);
}

function validatePasswordStrength(password) {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  generateId,
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  generateTokenPair,
  extractToken,
  getTokenRole,
  generateVerificationCode,
  isValidEmail,
  isValidPhone,
  validatePasswordStrength,
};
