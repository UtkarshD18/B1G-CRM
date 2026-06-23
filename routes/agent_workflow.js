const router = require("express").Router();
const { query } = require("../database/dbpromise.js");
const validateUser = require("../middlewares/user.js");

// GET supervisor dashboard KPIs
router.get("/kpis", validateUser, async (req, res) => {
  try {
    const tenantUid = req.decode.uid;

    // 1. Average response time overall
    const avgOverall = await query(
      "SELECT COALESCE(AVG(response_time_seconds), 0)::float as avg_time FROM agent_response_logs WHERE uid = ?",
      [tenantUid]
    );

    // 2. Average response time per agent
    const avgPerAgent = await query(
      `SELECT a.name, a.email, arl.agent_uid, COALESCE(AVG(arl.response_time_seconds), 0)::float as avg_time, COUNT(arl.id)::int as total_responses
       FROM agent_response_logs arl
       JOIN agents a ON arl.agent_uid = a.uid
       WHERE arl.uid = ?
       GROUP BY a.uid, arl.agent_uid, a.name, a.email`,
      [tenantUid]
    );

    // 3. SLA breach details
    const slaBreaches = await query(
      "SELECT COUNT(id)::int as total_breaches FROM agent_response_logs WHERE uid = ? AND sla_violated = 1",
      [tenantUid]
    );

    // 4. Open chats count and escalated count
    const chatStats = await query(
      `SELECT 
         COUNT(CASE WHEN chat_status = 'open' THEN 1 END)::int as open_count,
         COUNT(CASE WHEN sla_violated = 1 THEN 1 END)::int as escalated_count
       FROM chats WHERE uid = ?`,
      [tenantUid]
    );

    res.json({
      success: true,
      data: {
        averageResponseTimeOverall: avgOverall[0]?.avg_time || 0,
        averageResponseTimePerAgent: avgPerAgent,
        totalSlaBreaches: slaBreaches[0]?.total_breaches || 0,
        openChatsCount: chatStats[0]?.open_count || 0,
        escalatedChatsCount: chatStats[0]?.escalated_count || 0
      }
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to load agent KPIs" });
  }
});

// GET escalation queue
router.get("/escalations", validateUser, async (req, res) => {
  try {
    const data = await query(
      `SELECT eq.*, c.sender_name, c.sender_mobile, c.origin 
       FROM escalation_queue eq
       JOIN chats c ON eq.chat_id = c.chat_id AND eq.uid = c.uid
       WHERE eq.uid = ? AND eq.resolved = 0
       ORDER BY eq.escalated_at DESC`,
      [req.decode.uid]
    );
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to fetch escalation queue" });
  }
});

// POST to resolve an escalation ticket
router.post("/escalations/resolve", validateUser, async (req, res) => {
  try {
    const { chat_id } = req.body;
    if (!chat_id) {
      return res.json({ success: false, msg: "Chat ID is required" });
    }

    await query(
      "UPDATE escalation_queue SET resolved = 1, resolved_at = CURRENT_TIMESTAMP WHERE chat_id = ? AND uid = ? AND resolved = 0",
      [chat_id, req.decode.uid]
    );

    await query(
      "UPDATE chats SET sla_violated = 0 WHERE chat_id = ? AND uid = ?",
      [chat_id, req.decode.uid]
    );

    res.json({ success: true, msg: "Escalation resolved successfully." });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to resolve escalation" });
  }
});

module.exports = router;
