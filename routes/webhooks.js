const router = require("express").Router();
const { query } = require("../database/dbpromise.js");
const validateUser = require("../middlewares/user.js");

const allowedOperators = new Set(["contains", "equals", "starts_with", "exists"]);
const allowedActions = new Set([
  "tag_chat",
  "set_status",
  "assign_agent",
  "start_flow",
  "send_webhook",
]);

function normalizeRule(input = {}) {
  const actionPayload =
    typeof input.action_payload === "string"
      ? input.action_payload
      : JSON.stringify(input.action_payload || {});

  return {
    name: String(input.name || "").trim(),
    source: String(input.source || "external").trim(),
    event_type: String(input.event_type || "message").trim(),
    match_field: String(input.match_field || "body.text").trim(),
    match_operator: String(input.match_operator || "contains").trim(),
    match_value: String(input.match_value || "").trim(),
    action_type: String(input.action_type || "tag_chat").trim(),
    action_payload: actionPayload,
    active: input.active === false || Number(input.active) === 0 ? 0 : 1,
  };
}

function validateRule(rule) {
  if (!rule.name) {
    return "Rule name is required";
  }

  if (!allowedOperators.has(rule.match_operator)) {
    return "Invalid match operator";
  }

  if (!allowedActions.has(rule.action_type)) {
    return "Invalid action type";
  }

  if (rule.match_operator !== "exists" && !rule.match_value) {
    return "Match value is required";
  }

  try {
    JSON.parse(rule.action_payload || "{}");
  } catch {
    return "Action payload must be valid JSON";
  }

  return "";
}

router.get("/rules", validateUser, async (req, res) => {
  try {
    const data = await query(
      `SELECT * FROM webhook_rules WHERE uid = ? ORDER BY createdAt DESC`,
      [req.decode.uid]
    );

    res.json({ success: true, data });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "something went wrong" });
  }
});

router.post("/rules", validateUser, async (req, res) => {
  try {
    const rule = normalizeRule(req.body);
    const error = validateRule(rule);

    if (error) {
      return res.json({ success: false, msg: error });
    }

    const rows = await query(
      `INSERT INTO webhook_rules
        (uid, name, source, event_type, match_field, match_operator, match_value, action_type, action_payload, active)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       RETURNING *`,
      [
        req.decode.uid,
        rule.name,
        rule.source,
        rule.event_type,
        rule.match_field,
        rule.match_operator,
        rule.match_value,
        rule.action_type,
        rule.action_payload,
        rule.active,
      ]
    );

    res.json({ success: true, msg: "Webhook rule created", data: rows[0] });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "something went wrong" });
  }
});

router.post("/rules/update", validateUser, async (req, res) => {
  try {
    const { id } = req.body;
    const rule = normalizeRule(req.body);
    const error = validateRule(rule);

    if (!id) {
      return res.json({ success: false, msg: "Rule id is required" });
    }

    if (error) {
      return res.json({ success: false, msg: error });
    }

    const rows = await query(
      `UPDATE webhook_rules
       SET name = ?, source = ?, event_type = ?, match_field = ?, match_operator = ?,
           match_value = ?, action_type = ?, action_payload = ?, active = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ? AND uid = ?
       RETURNING *`,
      [
        rule.name,
        rule.source,
        rule.event_type,
        rule.match_field,
        rule.match_operator,
        rule.match_value,
        rule.action_type,
        rule.action_payload,
        rule.active,
        id,
        req.decode.uid,
      ]
    );

    if (rows.length < 1) {
      return res.json({ success: false, msg: "Webhook rule was not found" });
    }

    res.json({ success: true, msg: "Webhook rule updated", data: rows[0] });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "something went wrong" });
  }
});

router.post("/rules/delete", validateUser, async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.json({ success: false, msg: "Rule id is required" });
    }

    const rows = await query(
      `DELETE FROM webhook_rules WHERE id = ? AND uid = ? RETURNING id`,
      [id, req.decode.uid]
    );

    if (rows.length < 1) {
      return res.json({ success: false, msg: "Webhook rule was not found" });
    }

    res.json({ success: true, msg: "Webhook rule deleted" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "something went wrong" });
  }
});

module.exports = router;
