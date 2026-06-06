const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const env = require("../env");
const logger = require("./logger");

/**
 * Generate a UUID
 */
function generateId() {
  return uuidv4();
}

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>}
 */
async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    logger.error("Password Hash Error:", { error: error.message });
    throw error;
  }
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>}
 */
async function comparePassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error("Password Compare Error:", { error: error.message });
    throw error;
  }
}

/**
 * Generate JWT token
 * @param {object} payload - Token payload
 * @param {string} secret - JWT secret
 * @param {string} expiresIn - Token expiration time
 * @returns {string}
 */
function generateToken(
  payload,
  secret = env.JWT_SECRET,
  expiresIn = env.JWT_EXPIRY,
) {
  try {
    return jwt.sign(payload, secret, { expiresIn });
  } catch (error) {
    logger.error("Token Generation Error:", { error: error.message });
    throw error;
  }
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @param {string} secret - JWT secret
 * @returns {object}
 */
function verifyToken(token, secret = env.JWT_SECRET) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    logger.error("Token Verification Error:", { error: error.message });
    throw error;
  }
}

/**
 * Generate access and refresh tokens
 * @param {object} payload - Token payload
 * @returns {object}
 */
function generateTokenPair(payload) {
  try {
    const accessToken = generateToken(payload, env.JWT_SECRET, env.JWT_EXPIRY);
    const refreshToken = generateToken(
      payload,
      env.REFRESH_TOKEN_SECRET,
      "30d",
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_EXPIRY,
    };
  } catch (error) {
    logger.error("Token Pair Generation Error:", { error: error.message });
    throw error;
  }
}

/**
 * Extract Bearer token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null}
 */
function extractToken(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  return parts.length === 2 && parts[0] === "Bearer" ? parts[1] : null;
}

/**
 * Generate random verification code
 * @param {number} length - Code length
 * @returns {string}
 */
function generateVerificationCode(length = 6) {
  return Math.floor(
    Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1),
  ).toString();
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format
 * @param {string} phone - Phone number
 * @returns {boolean}
 */
function isValidPhone(phone) {
  const phoneRegex =
    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate password strength
 * @param {string} password - Password
 * @returns {object}
 */
function validatePasswordStrength(password) {
  const errors = [];

  if (password.length < 8) {
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
  generateVerificationCode,
  isValidEmail,
  isValidPhone,
  validatePasswordStrength,
};
