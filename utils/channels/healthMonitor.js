const { query } = require('../../database/dbpromise');
const registry = require('./ChannelAdapterRegistry');
const { decrypt } = require('./encryption');

async function runHealthChecks() {
  try {
    const connections = await query(`SELECT * FROM channel_connections`);
    for (const conn of connections) {
      const adapterClass = registry.getAdapterClass(conn.channel_type);
      if (!adapterClass) continue;

      // Load credentials and settings
      const [credRow] = await query(
        `SELECT credentials FROM channel_credentials WHERE uid = ? AND channel_type = ?`,
        [conn.uid, conn.channel_type]
      );
      const [settingRow] = await query(
        `SELECT settings FROM channel_settings WHERE uid = ? AND channel_type = ?`,
        [conn.uid, conn.channel_type]
      );

      let creds = {};
      if (credRow?.credentials) {
        try {
          const decrypted = decrypt(credRow.credentials);
          creds = JSON.parse(decrypted);
        } catch (e) {
          console.error(`Failed to decrypt credentials for health check:`, e.message);
        }
      }

      const settings = settingRow?.settings || {};
      const adapter = new adapterClass(conn.uid, creds, settings);

      let isHealthy = false;
      let lastError = null;
      try {
        isHealthy = await adapter.healthCheck();
      } catch (err) {
        lastError = err.message;
      }

      const status = isHealthy ? "CONNECTED" : (lastError ? "ERROR" : "WARNING");
      await query(
        `UPDATE channel_connections 
         SET connection_status = ?, last_verified_at = ?, last_error = ?, last_heartbeat = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [status, isHealthy ? new Date() : conn.last_verified_at, lastError, conn.id]
      );
    }
  } catch (err) {
    console.error("Health monitor execution error:", err.message);
  }
}

let monitorInterval = null;
function startHealthMonitor(intervalMs = 300000) {
  if (monitorInterval) clearInterval(monitorInterval);
  runHealthChecks();
  monitorInterval = setInterval(runHealthChecks, intervalMs);
}

function stopHealthMonitor() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}

module.exports = {
  runHealthChecks,
  startHealthMonitor,
  stopHealthMonitor
};
