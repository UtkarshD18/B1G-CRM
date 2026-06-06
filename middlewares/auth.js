const { query } = require("../database/dbpromise");
const { extractToken, verifyToken } = require("../utils/auth");
const logger = require("../utils/logger");

/**
 * Verify JWT and authenticate USER
 * Middleware to validate user authentication and retrieve user info
 */
async function validateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        msg: "Authorization header missing",
        code: "NO_AUTH_HEADER",
      });
    }

    const token = extractToken(authHeader);
    if (!token) {
      return res.status(401).json({
        success: false,
        msg: "Invalid token format",
        code: "INVALID_TOKEN_FORMAT",
      });
    }

    const decoded = verifyToken(token);
    if (decoded.type !== "user") {
      return res.status(403).json({
        success: false,
        msg: "Invalid user type",
        code: "INVALID_USER_TYPE",
      });
    }

    // Fetch user from database
    const userResult = await query(
      "SELECT * FROM user WHERE uid = ? AND is_active = ?",
      [decoded.uid, true],
    );

    if (!userResult || userResult.length === 0) {
      return res.status(401).json({
        success: false,
        msg: "User not found or inactive",
        code: "USER_NOT_FOUND",
      });
    }

    // Attach user to request
    req.decode = decoded;
    req.user = userResult[0];

    // Update last login
    await query("UPDATE user SET last_login = NOW() WHERE uid = ?", [
      decoded.uid,
    ]);

    next();
  } catch (error) {
    logger.error("User Validation Error:", { error: error.message });

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        msg: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        msg: "Invalid token",
        code: "INVALID_TOKEN",
      });
    }

    res.status(500).json({
      success: false,
      msg: "Authentication error",
      error: error.message,
    });
  }
}

/**
 * Verify JWT and authenticate AGENT
 * Middleware to validate agent authentication
 */
async function validateAgent(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        msg: "Authorization header missing",
        code: "NO_AUTH_HEADER",
      });
    }

    const token = extractToken(authHeader);
    if (!token) {
      return res.status(401).json({
        success: false,
        msg: "Invalid token format",
        code: "INVALID_TOKEN_FORMAT",
      });
    }

    const decoded = verifyToken(token);
    if (decoded.type !== "agent") {
      return res.status(403).json({
        success: false,
        msg: "Invalid agent type",
        code: "INVALID_AGENT_TYPE",
      });
    }

    // Fetch agent from database
    const agentResult = await query(
      "SELECT * FROM agent WHERE uid = ? AND is_active = ?",
      [decoded.uid, true],
    );

    if (!agentResult || agentResult.length === 0) {
      return res.status(401).json({
        success: false,
        msg: "Agent not found or inactive",
        code: "AGENT_NOT_FOUND",
      });
    }

    // Fetch owner user info
    const ownerResult = await query(
      "SELECT * FROM user WHERE uid = ? AND is_active = ?",
      [agentResult[0].owner_uid, true],
    );

    if (!ownerResult || ownerResult.length === 0) {
      return res.status(401).json({
        success: false,
        msg: "Owner user not found or inactive",
        code: "OWNER_NOT_FOUND",
      });
    }

    // Attach data to request
    req.decode = decoded;
    req.agent = agentResult[0];
    req.owner = ownerResult[0];

    // Update last login
    await query("UPDATE agent SET last_login = NOW() WHERE uid = ?", [
      decoded.uid,
    ]);

    next();
  } catch (error) {
    logger.error("Agent Validation Error:", { error: error.message });

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        msg: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        msg: "Invalid token",
        code: "INVALID_TOKEN",
      });
    }

    res.status(500).json({
      success: false,
      msg: "Authentication error",
      error: error.message,
    });
  }
}

/**
 * Verify JWT and authenticate ADMIN
 * Middleware to validate admin authentication
 */
async function adminValidator(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        msg: "Authorization header missing",
        code: "NO_AUTH_HEADER",
      });
    }

    const token = extractToken(authHeader);
    if (!token) {
      return res.status(401).json({
        success: false,
        msg: "Invalid token format",
        code: "INVALID_TOKEN_FORMAT",
      });
    }

    const decoded = verifyToken(token);
    if (decoded.type !== "admin") {
      return res.status(403).json({
        success: false,
        msg: "Invalid admin type",
        code: "INVALID_ADMIN_TYPE",
      });
    }

    // Fetch admin from database
    const adminResult = await query(
      "SELECT * FROM admin WHERE uid = ? AND is_active = ?",
      [decoded.uid, true],
    );

    if (!adminResult || adminResult.length === 0) {
      return res.status(401).json({
        success: false,
        msg: "Admin not found or inactive",
        code: "ADMIN_NOT_FOUND",
      });
    }

    // Check admin role permissions if needed
    if (
      adminResult[0].role !== "super_admin" &&
      adminResult[0].role !== "moderator"
    ) {
      return res.status(403).json({
        success: false,
        msg: "Insufficient permissions",
        code: "INSUFFICIENT_PERMISSIONS",
      });
    }

    // Attach admin to request
    req.decode = decoded;
    req.admin = adminResult[0];

    // Update last login
    await query("UPDATE admin SET last_login = NOW() WHERE uid = ?", [
      decoded.uid,
    ]);

    next();
  } catch (error) {
    logger.error("Admin Validation Error:", { error: error.message });

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        msg: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        msg: "Invalid token",
        code: "INVALID_TOKEN",
      });
    }

    res.status(500).json({
      success: false,
      msg: "Authentication error",
      error: error.message,
    });
  }
}

/**
 * Check plan quota/limits
 * Middleware to verify user hasn't exceeded plan limits
 */
async function checkPlan(req, res, next) {
  try {
    const user = req.user || req.owner;

    if (!user) {
      return res.status(400).json({
        success: false,
        msg: "User information missing",
      });
    }

    // Fetch user's plan
    const planResult = await query(
      `SELECT p.* FROM plans p 
             JOIN user u ON u.plan_id = p.id 
             WHERE u.uid = ?`,
      [user.uid],
    );

    if (!planResult || planResult.length === 0) {
      return res.status(403).json({
        success: false,
        msg: "No active plan found",
        code: "NO_ACTIVE_PLAN",
      });
    }

    const plan = planResult[0];

    // Attach plan to request
    req.plan = plan;

    // Check plan status
    if (!plan.active) {
      return res.status(403).json({
        success: false,
        msg: "Plan is not active",
        code: "INACTIVE_PLAN",
      });
    }

    next();
  } catch (error) {
    logger.error("Plan Check Error:", { error: error.message });

    res.status(500).json({
      success: false,
      msg: "Plan validation error",
      error: error.message,
    });
  }
}

module.exports = {
  validateUser,
  validateAgent,
  adminValidator,
  checkPlan,
};
