const router = require("express").Router();
const { query } = require("../database/dbpromise");
const registry = require("../utils/channels/ChannelAdapterRegistry");
const { encrypt, decrypt } = require("../utils/channels/encryption");
const { validateUser } = require("../middlewares/auth");

// 1. Get all provider metadata (dynamic fields, docs, capabilities)
router.get("/metadata", validateUser, (req, res) => {
  try {
    const list = registry.getAllMetadata();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});

// 2. Get connection status & settings for a channel
router.get("/:channel/connection", validateUser, async (req, res) => {
  try {
    const channel = req.params.channel.toLowerCase();
    const uid = req.decode.uid;

    const [conn] = await query(
      `SELECT * FROM channel_connections WHERE uid = ? AND channel_type = ?`,
      [uid, channel]
    );
    const [settingRow] = await query(
      `SELECT settings FROM channel_settings WHERE uid = ? AND channel_type = ?`,
      [uid, channel]
    );
    const [credRow] = await query(
      `SELECT id FROM channel_credentials WHERE uid = ? AND channel_type = ?`,
      [uid, channel]
    );

    res.json({
      success: true,
      data: {
        connection: conn || { connection_status: "NEW", mode: "mock" },
        settings: settingRow?.settings || {},
        has_credentials: !!credRow
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});

// 3. Save credentials & settings
router.post("/:channel/save", validateUser, async (req, res) => {
  try {
    const channel = req.params.channel.toLowerCase();
    const uid = req.decode.uid;
    const { credentials, settings } = req.body;

    const adapterClass = registry.getAdapterClass(channel);
    if (!adapterClass) {
      return res.status(404).json({ success: false, msg: "Channel provider not found" });
    }

    // 1. Encrypt credentials if provided
    if (credentials && Object.keys(credentials).length > 0) {
      const encryptedCreds = encrypt(JSON.stringify(credentials));
      await query(
        `INSERT INTO channel_credentials (uid, channel_type, credentials, updated_at) 
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT (uid, channel_type) DO UPDATE SET 
         credentials = EXCLUDED.credentials, updated_at = CURRENT_TIMESTAMP`,
        [uid, channel, encryptedCreds]
      );
    }

    // 2. Save settings
    const settingsPayload = settings || {};
    await query(
      `INSERT INTO channel_settings (uid, channel_type, settings, updated_at) 
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT (uid, channel_type) DO UPDATE SET 
       settings = EXCLUDED.settings, updated_at = CURRENT_TIMESTAMP`,
      [uid, channel, JSON.stringify(settingsPayload)]
    );

    // 3. Update connection state mode
    const mode = settingsPayload.mode || "mock";
    await query(
      `INSERT INTO channel_connections (uid, channel_type, mode, connection_status, last_heartbeat, api_version) 
       VALUES (?, ?, ?, 'NEW', CURRENT_TIMESTAMP, ?)
       ON CONFLICT (uid, channel_type) DO UPDATE SET 
       mode = EXCLUDED.mode, last_heartbeat = CURRENT_TIMESTAMP, api_version = EXCLUDED.api_version`,
      [uid, channel, mode, adapterClass.providerMetadata.apiVersion]
    );

    res.json({ success: true, msg: `${adapterClass.providerMetadata.name} configurations saved successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});

// 4. Test connection health & verify
router.post("/:channel/test_connection", validateUser, async (req, res) => {
  try {
    const channel = req.params.channel.toLowerCase();
    const uid = req.decode.uid;

    const adapterClass = registry.getAdapterClass(channel);
    if (!adapterClass) {
      return res.status(404).json({ success: false, msg: "Channel provider not found" });
    }

    const [credRow] = await query(
      `SELECT credentials FROM channel_credentials WHERE uid = ? AND channel_type = ?`,
      [uid, channel]
    );
    const [settingRow] = await query(
      `SELECT settings FROM channel_settings WHERE uid = ? AND channel_type = ?`,
      [uid, channel]
    );

    let creds = {};
    if (credRow?.credentials) {
      creds = JSON.parse(decrypt(credRow.credentials));
    }
    const settings = settingRow?.settings || {};

    const adapter = new adapterClass(uid, creds, settings);

    await query(
      `UPDATE channel_connections SET connection_status = 'VERIFYING' WHERE uid = ? AND channel_type = ?`,
      [uid, channel]
    );

    const testRes = await adapter.verify();

    const status = testRes.success ? "CONNECTED" : "ERROR";
    await query(
      `UPDATE channel_connections 
       SET connection_status = ?, last_verified_at = ?, last_error = ?, last_heartbeat = CURRENT_TIMESTAMP 
       WHERE uid = ? AND channel_type = ?`,
      [status, testRes.success ? new Date() : null, testRes.success ? null : testRes.msg, uid, channel]
    );

    res.json(testRes);
  } catch (err) {
    await query(
      `UPDATE channel_connections 
       SET connection_status = 'ERROR', last_error = ?, last_heartbeat = CURRENT_TIMESTAMP 
       WHERE uid = ? AND channel_type = ?`,
      [err.message, uid, channel]
    );
    res.json({ success: false, msg: err.message });
  }
});

// 5. Update mode
router.post("/:channel/update_mode", validateUser, async (req, res) => {
  try {
    const channel = req.params.channel.toLowerCase();
    const uid = req.decode.uid;
    const { mode } = req.body;

    const validModes = ["mock", "sandbox", "production"];
    if (!validModes.includes(mode)) {
      return res.status(400).json({ success: false, msg: "Invalid mode" });
    }

    await query(
      `UPDATE channel_connections SET mode = ?, connection_status = 'NEW' WHERE uid = ? AND channel_type = ?`,
      [mode, uid, channel]
    );

    // Sync mode into channel_settings JSONB
    const [settingRow] = await query(
      `SELECT settings FROM channel_settings WHERE uid = ? AND channel_type = ?`,
      [uid, channel]
    );
    const settings = settingRow?.settings || {};
    settings.mode = mode;
    await query(
      `UPDATE channel_settings SET settings = ? WHERE uid = ? AND channel_type = ?`,
      [JSON.stringify(settings), uid, channel]
    );

    res.json({ success: true, msg: `Operation mode switched to ${mode}.` });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});

// 6. Disconnect channel
router.post("/:channel/disconnect", validateUser, async (req, res) => {
  try {
    const channel = req.params.channel.toLowerCase();
    const uid = req.decode.uid;

    await query(`DELETE FROM channel_credentials WHERE uid = ? AND channel_type = ?`, [uid, channel]);
    await query(`DELETE FROM channel_settings WHERE uid = ? AND channel_type = ?`, [uid, channel]);
    await query(
      `UPDATE channel_connections 
       SET connection_status = 'DISCONNECTED', last_verified_at = NULL, last_error = NULL, last_heartbeat = CURRENT_TIMESTAMP 
       WHERE uid = ? AND channel_type = ?`,
      [uid, channel]
    );

    res.json({ success: true, msg: "Channel disconnected successfully." });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});

module.exports = router;
