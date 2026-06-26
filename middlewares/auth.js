const { query } = require("../database/dbpromise");
const { extractToken, getTokenRole, verifyToken } = require("../utils/auth");
const logger = require("../utils/logger");

function authError(res, status, msg, code) {
  return res.status(status).json({
    success: false,
    msg,
    code,
    logout: true
  });
}

function getDecodedToken(req) {
  const authHeader = req.headers.authorization;
  const token = extractToken(authHeader);

  if (!authHeader) {
    return { error: "NO_AUTH_HEADER" };
  }

  if (!token) {
    return { error: "INVALID_TOKEN_FORMAT" };
  }

  return { decoded: verifyToken(token) };
}

async function validateUser(req, res, next) {
  try {
    const { decoded, error } = getDecodedToken(req);
    if (error === "NO_AUTH_HEADER") {
      return authError(res, 401, "Authorization header missing", error);
    }
    if (error) {
      return authError(res, 401, "Invalid token format", error);
    }
    if (getTokenRole(decoded) !== "user") {
      return authError(res, 403, "Invalid user type", "INVALID_USER_TYPE");
    }

    const users = await query("SELECT * FROM user WHERE uid = ?", [decoded.uid]);
    if (!users.length) {
      return authError(res, 401, "User not found", "USER_NOT_FOUND");
    }

    req.decode = decoded;
    req.user = users[0];
    next();
  } catch (error) {
    logger.error("User validation error", { error: error.message });
    return authError(res, 401, "Invalid token", "INVALID_TOKEN");
  }
}

async function validateAgent(req, res, next) {
  try {
    const { decoded, error } = getDecodedToken(req);
    if (error === "NO_AUTH_HEADER") {
      return authError(res, 401, "Authorization header missing", error);
    }
    if (error) {
      return authError(res, 401, "Invalid token format", error);
    }
    if (getTokenRole(decoded) !== "agent") {
      return authError(res, 403, "Invalid agent type", "INVALID_AGENT_TYPE");
    }

    const agents = await query("SELECT * FROM agents WHERE email = ? AND uid = ?", [
      decoded.email,
      decoded.uid,
    ]);
    if (!agents.length) {
      return authError(res, 401, "Agent not found", "AGENT_NOT_FOUND");
    }

    if (agents[0]?.is_active < 1) {
      return authError(res, 403, "You are an inactive agent.", "INACTIVE_AGENT");
    }

    const owners = await query("SELECT * FROM user WHERE uid = ?", [
      agents[0]?.owner_uid,
    ]);
    if (!owners.length) {
      return authError(res, 404, "Agent Owner not found", "OWNER_NOT_FOUND");
    }

    if (agents[0].role !== "agent") {
      return authError(res, 403, "Unauthorized token", "UNAUTHORIZED_AGENT_ROLE");
    }

    req.decode = {
      ...decoded,
      permissions: JSON.parse(agents[0].permissions || "[]")
    };
    req.agent = agents[0];
    req.owner = owners[0];
    next();
  } catch (error) {
    logger.error("Agent validation error", { error: error.message });
    return authError(res, 401, "Invalid token", "INVALID_TOKEN");
  }
}

async function validateUserOrAgent(req, res, next) {
  try {
    const { decoded, error } = getDecodedToken(req);
    if (error === "NO_AUTH_HEADER") {
      return authError(res, 401, "Authorization header missing", error);
    }
    if (error) {
      return authError(res, 401, "Invalid token format", error);
    }

    const role = getTokenRole(decoded);
    if (role === "user") {
      const users = await query("SELECT * FROM user WHERE uid = ?", [decoded.uid]);
      if (!users.length) {
        return authError(res, 401, "User not found", "USER_NOT_FOUND");
      }
      req.decode = decoded;
      req.user = users[0];
      return next();
    } else if (role === "agent") {
      const agents = await query("SELECT * FROM agents WHERE email = ? AND uid = ?", [
        decoded.email,
        decoded.uid,
      ]);
      if (!agents.length) {
        return authError(res, 401, "Agent not found", "AGENT_NOT_FOUND");
      }
      if (agents[0]?.is_active < 1) {
        return authError(res, 403, "You are an inactive agent.", "INACTIVE_AGENT");
      }
      const owners = await query("SELECT * FROM user WHERE uid = ?", [
        agents[0]?.owner_uid,
      ]);
      if (!owners.length) {
        return authError(res, 404, "Agent Owner not found", "OWNER_NOT_FOUND");
      }
      req.decode = {
        ...decoded,
        permissions: JSON.parse(agents[0].permissions || "[]"),
        agentUid: decoded.uid,
        uid: agents[0].owner_uid
      };
      req.agent = agents[0];
      req.owner = owners[0];
      return next();
    }

    return authError(res, 403, "Invalid user type", "INVALID_USER_TYPE");
  } catch (error) {
    logger.error("User or Agent validation error", { error: error.message });
    return authError(res, 401, "Invalid token", "INVALID_TOKEN");
  }
}

async function adminValidator(req, res, next) {
  try {
    const { decoded, error } = getDecodedToken(req);
    if (error === "NO_AUTH_HEADER") {
      return authError(res, 401, "Authorization header missing", error);
    }
    if (error) {
      return authError(res, 401, "Invalid token format", error);
    }
    if (getTokenRole(decoded) !== "admin") {
      return authError(res, 403, "Invalid admin type", "INVALID_ADMIN_TYPE");
    }

    const admins = await query("SELECT * FROM admin WHERE uid = ?", [
      decoded.uid,
    ]);
    if (!admins.length) {
      return authError(res, 401, "Admin not found", "ADMIN_NOT_FOUND");
    }

    req.decode = decoded;
    req.admin = admins[0];
    next();
  } catch (error) {
    logger.error("Admin validation error", { error: error.message });
    return authError(res, 401, "Invalid token", "INVALID_TOKEN");
  }
}

const { hasPermission } = require("../utils/permissionResolver");

const legacyMap = {
  'contacts_access': 'contacts.read',
  'inbox_access': 'inbox.read',
  'kanban_access': 'inbox.read',
  'chatbot_access': 'automation.read',
  'settings_access': 'settings.users',
  'campaigns_access': 'inbox.read',
  'flows_access': 'automation.read',
  'leads_access': 'contacts.read',
  'website_access': 'settings.users'
};

function verifyPermission(permission) {
  return async (req, res, next) => {
    if (!req.decode) {
      return res.status(401).json({
        success: false,
        msg: "Unauthorized. Token missing.",
        code: "UNAUTHORIZED"
      });
    }

    const userId = req.decode.agentUid || req.decode.uid;
    const mappedPermission = legacyMap[permission] || permission;
    const permitted = await hasPermission(userId, mappedPermission);

    if (permitted) {
      return next();
    }

    return res.status(403).json({
      success: false,
      msg: `Permission denied. Required: ${permission}`,
      code: "PERMISSION_DENIED"
    });
  };
}

module.exports = {
  validateUser,
  validateAgent,
  validateUserOrAgent,
  adminValidator,
  verifyPermission,
};
