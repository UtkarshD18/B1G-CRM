require('dotenv').config();
const { query: dbQuery } = require("../database/dbpromise");

console.log("[Worker] Starting Scheduler & SLA Escalations Worker...");

const checkSlaEscalations = async () => {
  try {
    const breachingChats = await dbQuery(
      `SELECT id, chat_id, uid, sender_name, last_incoming_time 
       FROM chats 
       WHERE last_reply_by = 'user' AND sla_violated = 0 AND sla_expires_at < CURRENT_TIMESTAMP`
    );

    for (const chat of breachingChats) {
      await dbQuery("UPDATE chats SET sla_violated = 1 WHERE id = ?", [chat.id]);
      const existingEsc = await dbQuery(
        "SELECT * FROM escalation_queue WHERE chat_id = ? AND resolved = 0",
        [chat.chat_id]
      );
      if (existingEsc.length === 0) {
        await dbQuery(
          "INSERT INTO escalation_queue (uid, chat_id, reason) VALUES (?, ?, ?)",
          [chat.uid, chat.chat_id, "SLA response window breached (unanswered for >5 minutes)"]
        );
        console.log(`[Scheduler] Chat ${chat.chat_id} escalated due to SLA breach`);
      }
    }
  } catch (err) {
    console.error("[Scheduler] SLA Checker Error:", err.message);
  }
};

// Check SLA breaches every 30 seconds
setInterval(checkSlaEscalations, 30000);
checkSlaEscalations();
