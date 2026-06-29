const { query } = require("../database/dbpromise");

// In-memory cache for user permissions
// Structure: { [uid]: { permissions: Set<string>, expiresAt: number } }
const permissionCache = {};
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Invalidate the permission cache for a specific user/agent UID
 * Call this when a role or permission overrides change.
 */
function invalidatePermissionCache(uid) {
  if (uid) {
    delete permissionCache[uid];
    console.log(`[Permission Resolver] Cache invalidated for UID: ${uid}`);
  }
}

/**
 * Load permissions from DB for a specific user/agent UID
 */
async function loadPermissionsFromDB(uid) {
  const permissions = new Set();

  try {
    // 1. Get permissions through user's assigned role
    const rolePermissions = await query(
      `SELECT p.key 
       FROM user_roles ur
       JOIN role_permissions rp ON ur.role_id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE ur.uid = ?`,
      [uid]
    );
    rolePermissions.forEach(row => permissions.add(row.key));

    // 2. Get permission overrides from user_permissions overrides table
    const overridePermissions = await query(
      `SELECT p.key 
       FROM user_permissions up
       JOIN permissions p ON up.permission_id = p.id
       WHERE up.uid = ?`,
      [uid]
    );
    overridePermissions.forEach(row => permissions.add(row.key));

    // 3. Fallback/Backward Compatibility: If user is not yet mapped in user_roles,
    // look up from user or agents table directly to assign defaults
    if (permissions.size === 0) {
      // Check user table
      const users = await query("SELECT role FROM \"user\" WHERE uid = ?", [uid]);
      if (users.length > 0) {
        // Workspace Owner gets all system template permissions
        const systemOwnerPerms = await query(
          `SELECT p.key FROM role_permissions rp
           JOIN roles r ON rp.role_id = r.id
           JOIN permissions p ON rp.permission_id = p.id
           WHERE r.uid IS NULL AND r.name = 'Owner'`
        );
        systemOwnerPerms.forEach(row => permissions.add(row.key));
      } else {
        // Check agents table
        const agents = await query("SELECT owner_uid, permissions FROM agents WHERE uid = ?", [uid]);
        if (agents.length > 0) {
          // Parse legacy json array of permissions from agent profile
          try {
            const legacyPerms = JSON.parse(agents[0].permissions || "[]");
            legacyPerms.forEach(p => permissions.add(p));
          } catch (e) {
            console.error(`Failed to parse legacy permissions for agent ${uid}:`, e);
          }
          // Also give Agent role default permissions
          const systemAgentPerms = await query(
            `SELECT p.key FROM role_permissions rp
             JOIN roles r ON rp.role_id = r.id
             JOIN permissions p ON rp.permission_id = p.id
             WHERE r.uid IS NULL AND r.name = 'Agent'`
          );
          systemAgentPerms.forEach(row => permissions.add(row.key));
        }
      }
    }
  } catch (err) {
    console.error(`[Permission Resolver] Error loading permissions for UID ${uid}:`, err);
  }

  return permissions;
}

/**
 * Check if a user/agent has a specific permission
 * Uses in-memory caching to avoid database queries on every API call.
 */
async function hasPermission(uid, permission) {
  if (!uid) return false;

  const now = Date.now();
  const cached = permissionCache[uid];

  if (cached && cached.expiresAt > now) {
    return cached.permissions.has(permission);
  }

  // Load from database if cache missed or expired
  const permissions = await loadPermissionsFromDB(uid);
  
  permissionCache[uid] = {
    permissions,
    expiresAt: now + CACHE_DURATION_MS
  };

  return permissions.has(permission);
}

module.exports = {
  hasPermission,
  invalidatePermissionCache,
  permissionCache
};
