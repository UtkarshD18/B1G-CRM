const { query } = require("../database/dbpromise");

function safeStringify(value) {
  try {
    return JSON.stringify(value || {});
  } catch {
    return "{}";
  }
}

async function recordChatbotLog({
  uid,
  chatbot,
  flow,
  senderNumber,
  senderName,
  incomingMessage,
  origin,
  matched = false,
  status = "received",
  detail = {},
}) {
  if (!uid || !chatbot?.id) {
    return;
  }

  try {
    await query(
      `INSERT INTO chatbot_log (
        uid,
        chatbot_id,
        chatbot_title,
        flow_id,
        sender_number,
        sender_name,
        incoming_message,
        origin,
        matched,
        status,
        detail
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        uid,
        chatbot.id,
        chatbot.title || "",
        flow?.flow_id || chatbot.flow_id || "",
        senderNumber || "",
        senderName || "",
        incomingMessage || "",
        origin || "",
        matched ? 1 : 0,
        status,
        safeStringify(detail),
      ]
    );
  } catch (err) {
    console.log("Unable to record chatbot log", err.message);
  }
}

module.exports = { recordChatbotLog };
