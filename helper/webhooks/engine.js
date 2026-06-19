const axios = require("axios");
const { query } = require("../../database/dbpromise.js");

function extractBodyText(newMessage) {
  if (!newMessage) return "";
  const messageBody =
    newMessage?.msgContext?.text?.body ||
    newMessage?.msgContext?.interactive?.body?.text ||
    newMessage?.msgContext?.image?.caption ||
    newMessage?.msgContext?.image?.link ||
    newMessage?.msgContext?.video?.caption ||
    newMessage?.msgContext?.video?.link ||
    newMessage?.msgContext?.document?.caption ||
    newMessage?.msgContext?.reaction?.emoji ||
    newMessage?.msgContext?.location ||
    newMessage?.msgContext?.contact?.contacts?.[0]?.name?.formatted_name ||
    newMessage?.text ||
    "";
  return messageBody;
}

async function processWebhookRules({ latestConversation, uid, origin }) {
  try {
    const { newMessage } = latestConversation;
    if (!newMessage) return;

    const incomingMsg = extractBodyText(newMessage);
    const senderNumber = newMessage?.senderMobile;
    const toName = newMessage?.senderName;

    if (!incomingMsg || !senderNumber) {
      return;
    }

    // 1. Fetch active webhook rules for this user
    const rules = await query(
      `SELECT * FROM webhook_rules WHERE uid = ? AND active = ?`,
      [uid, 1]
    );

    if (!rules || rules.length === 0) {
      return;
    }

    console.log(`Evaluating ${rules.length} active webhook rules for user ${uid}`);

    for (const rule of rules) {
      let matched = false;
      const matchOperator = String(rule.match_operator || "contains").toLowerCase();
      const matchValue = String(rule.match_value || "").toLowerCase();
      const msgLower = incomingMsg.toLowerCase();

      // 2. Evaluate criteria match
      switch (matchOperator) {
        case "contains":
          matched = msgLower.includes(matchValue);
          break;
        case "equals":
          matched = msgLower === matchValue;
          break;
        case "starts_with":
          matched = msgLower.startsWith(matchValue);
          break;
        case "exists":
          matched = incomingMsg !== undefined && incomingMsg !== null && incomingMsg !== "";
          break;
        default:
          break;
      }

      if (!matched) {
        continue;
      }

      console.log(`Webhook rule matched: "${rule.name}" (ID: ${rule.id})`);

      // 3. Execute matched action
      const actionType = String(rule.action_type || "tag_chat").toLowerCase();
      let actionPayloadObj = {};
      try {
        actionPayloadObj = JSON.parse(rule.action_payload || "{}");
      } catch {
        actionPayloadObj = { value: rule.action_payload };
      }

      const chatId = newMessage.chatId || latestConversation.newMessage.chatId || latestConversation.newMessage.senderMobile;

      if (actionType === "send_webhook") {
        // Find target URL from payload or fallback to raw string
        const targetUrl = actionPayloadObj.url || rule.action_payload;
        if (!targetUrl || !targetUrl.startsWith("http")) {
          console.warn("Invalid webhook URL target specified:", targetUrl);
          continue;
        }

        const webhookBody = {
          event: "message.received",
          uid,
          chatId,
          origin,
          message: {
            senderMobile: senderNumber,
            senderName: toName || "Unknown",
            text: incomingMsg,
            timestamp: newMessage.timestamp || Date.now()
          }
        };

        let resStatus = null;
        let resBody = "";

        try {
          console.log(`Dispatching webhook rule "${rule.name}" payload to ${targetUrl}`);
          const res = await axios.post(targetUrl, webhookBody, { timeout: 5000 });
          resStatus = res.status;
          resBody = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
        } catch (err) {
          resStatus = err.response ? err.response.status : 500;
          resBody = err.message;
          console.error(`Webhook rule "${rule.name}" post failed:`, err.message);
        }

        // Write to webhook_logs table
        await query(
          `INSERT INTO webhook_logs (uid, rule_id, rule_name, target_url, payload, response_status, response_body)
           VALUES (?,?,?,?,?,?,?)`,
          [
            uid,
            rule.id,
            rule.name,
            targetUrl,
            JSON.stringify(webhookBody),
            resStatus,
            resBody.slice(0, 1000) // Keep response snippet safe from overflows
          ]
        );
      } else if (actionType === "tag_chat") {
        const tag = actionPayloadObj.tag || actionPayloadObj.value || "webhook-tagged";
        const [chat] = await query("SELECT * FROM chats WHERE chat_id = ? AND uid = ?", [chatId, uid]);
        if (chat) {
          let tags = [];
          try {
            tags = JSON.parse(chat.chat_tags || "[]");
            if (!Array.isArray(tags)) tags = String(chat.chat_tags).split(",").map(t => t.trim());
          } catch {
            tags = chat.chat_tags ? [chat.chat_tags] : [];
          }

          if (!tags.includes(tag)) {
            tags.push(tag);
            await query("UPDATE chats SET chat_tags = ? WHERE chat_id = ? AND uid = ?", [
              JSON.stringify(tags),
              chatId,
              uid
            ]);
            console.log(`Webhook rule tagged chat ${chatId} with "${tag}"`);
          }
        }
      } else if (actionType === "set_status") {
        const status = actionPayloadObj.status || actionPayloadObj.value || "pending";
        await query("UPDATE chats SET chat_status = ? WHERE chat_id = ? AND uid = ?", [
          status,
          chatId,
          uid
        ]);
        console.log(`Webhook rule updated chat ${chatId} status to "${status}"`);
      } else if (actionType === "assign_agent") {
        const agentUid = actionPayloadObj.agentUid || actionPayloadObj.value;
        if (agentUid) {
          const agentVerify = await query(`SELECT * FROM agents WHERE uid = ? AND owner_uid = ?`, [agentUid, uid]);
          if (agentVerify.length > 0) {
            // Remove any existing assignment first
            await query("DELETE FROM agent_chats WHERE chat_id = ? AND owner_uid = ?", [chatId, uid]);
            // Insert new assignment
            await query("INSERT INTO agent_chats (owner_uid, uid, chat_id) VALUES (?,?,?)", [
              uid,
              agentUid,
              chatId
            ]);
            console.log(`Webhook rule assigned chat ${chatId} to agent ${agentUid}`);
          } else {
            console.warn(`Webhook rule assign_agent security block: Agent ${agentUid} does not belong to owner ${uid}`);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error evaluating webhook rules engine:", err.message);
  }
}

module.exports = { processWebhookRules };
