const router = require("express").Router();
const { query } = require("../database/dbpromise.js");
const { validateUserOrAgent, verifyPermission } = require("../middlewares/auth.js");

// GET all configured AI providers for the current user
router.get("/get_all", validateUserOrAgent, verifyPermission("settings_access"), async (req, res) => {
  try {
    const data = await query(
      "SELECT id, provider, api_key, model, temperature, enabled, custom_endpoint FROM tenant_ai_providers WHERE uid = ?",
      [req.decode.uid]
    );
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to retrieve AI configurations", error: err.message });
  }
});

// POST to save/update an AI provider configuration
router.post("/save", validateUserOrAgent, verifyPermission("settings_access"), async (req, res) => {
  try {
    const { provider, api_key, model, temperature, enabled, custom_endpoint } = req.body;
    if (!provider) {
      return res.json({ success: false, msg: "Provider name is required" });
    }

    const validProviders = ["openai", "gemini", "claude", "openrouter", "ollama", "custom"];
    if (!validProviders.includes(provider)) {
      return res.json({ success: false, msg: "Invalid AI provider name" });
    }

    // Upsert the provider config
    const existing = await query(
      "SELECT * FROM tenant_ai_providers WHERE uid = ? AND provider = ?",
      [req.decode.uid, provider]
    );

    if (existing.length > 0) {
      await query(
        `UPDATE tenant_ai_providers 
         SET api_key = ?, model = ?, temperature = ?, enabled = ?, custom_endpoint = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE uid = ? AND provider = ?`,
        [api_key || "", model || "", temperature || 0.7, enabled !== undefined ? enabled : 1, custom_endpoint || "", req.decode.uid, provider]
      );
    } else {
      await query(
        `INSERT INTO tenant_ai_providers (uid, provider, api_key, model, temperature, enabled, custom_endpoint) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.decode.uid, provider, api_key || "", model || "", temperature || 0.7, enabled !== undefined ? enabled : 1, custom_endpoint || ""]
      );
    }

    res.json({ success: true, msg: `AI configuration for ${provider} saved successfully.` });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to save AI configuration", error: err.message });
  }
});

// POST to toggle a provider's enabled state
router.post("/toggle", validateUserOrAgent, verifyPermission("settings_access"), async (req, res) => {
  try {
    const { provider, enabled } = req.body;
    if (!provider) {
      return res.json({ success: false, msg: "Provider is required" });
    }

    await query(
      "UPDATE tenant_ai_providers SET enabled = ? WHERE uid = ? AND provider = ?",
      [enabled ? 1 : 0, req.decode.uid, provider]
    );

    res.json({ success: true, msg: `Provider ${provider} state updated.` });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to toggle provider state", error: err.message });
  }
});

module.exports = router;
