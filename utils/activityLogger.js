const { query } = require("../database/dbpromise");

/**
 * Log a user action to the activity_logs table for enterprise audit trail.
 * 
 * @param {object} req - Express request object (contains req.decode, req.ip)
 * @param {string} moduleName - The module where the action happened (e.g. 'AI', 'Knowledge Base', 'Users')
 * @param {string} action - The action string (e.g. 'kb_upload', 'flow_publish')
 * @param {string} target - The target identifier (e.g. filename, flow ID, agent email)
 * @param {object|null} details - Optional extra key-value payload details to JSON-stringify
 * @param {string|null} executionId - The unique UUID or ID of the AI run (if applicable)
 */
async function logActivity(req, moduleName, action, target = null, details = null, executionId = null) {
  try {
    const uid = req?.decode?.uid;
    const userId = req?.decode?.agentUid || req?.decode?.uid || "anonymous";
    const ip = req?.ip || req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || null;

    if (uid) {
      await query(
        `INSERT INTO activity_logs (uid, user_id, module, action, target, details, execution_id, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uid, userId, moduleName, action, target, details ? JSON.stringify(details) : null, executionId, ip]
      );
      console.log(`[Activity Logger] Logged action "${action}" in module "${moduleName}" by user ${userId}`);
    } else {
      console.warn(`[Activity Logger] Skipping log activity: missing tenant UID in request context.`);
    }
  } catch (err) {
    console.error("[Activity Logger] Error inserting activity log:", err);
  }
}

module.exports = {
  logActivity
};
