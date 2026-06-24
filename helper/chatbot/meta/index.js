const { query } = require("../../../database/dbpromise");
const { destributeTaskFlow } = require("../../../functions/chatbot");
const { recordChatbotLog } = require("../../../functions/chatbotDiagnostics");
const { readJsonFromFile } = require("../../../functions/function");
const {
  getReply,
  convertNumberToRandomString,
  sendMetaMsg,
} = require("./function");

function extractBodyText(newMessage) {
  const messageBody =
    newMessage?.msgContext?.text?.body ||
    newMessage?.msgContext?.interactive?.nfm_reply?.response_json ||
    newMessage?.msgContext?.interactive?.nfm_reply?.body ||
    newMessage?.msgContext?.interactive?.body?.text ||
    newMessage?.msgContext?.image?.caption ||
    newMessage?.msgContext?.image?.link ||
    newMessage?.msgContext?.video?.caption ||
    newMessage?.msgContext?.video?.link ||
    newMessage?.msgContext?.document?.caption ||
    newMessage?.msgContext?.reaction?.emoji ||
    newMessage?.msgContext?.location ||
    newMessage?.msgContext?.contact?.contacts?.[0]?.name?.formatted_name;

  return messageBody;
}

function getChatId(body) {
  try {
    let chatId = convertNumberToRandomString(
      body?.entry[0]?.changes[0]?.value?.statuses?.[0]?.recipient_id ||
        body?.entry[0]?.changes[0]?.value?.contacts?.[0]?.wa_id
    );
    return chatId;
  } catch (error) {
    return null;
  }
}

async function runChatbot(i, incomingMsg, uid, senderNumber, toName) {
  try {
    // Check if auto-reply is disabled for this contact
    if (senderNumber) {
      const [contact] = await query(
        `SELECT auto_reply_disabled_until FROM contact WHERE uid = ? AND mobile = ? LIMIT 1`,
        [uid, senderNumber]
      );
      if (contact && contact.auto_reply_disabled_until) {
        const disabledUntil = new Date(contact.auto_reply_disabled_until);
        if (disabledUntil > new Date()) {
          console.log(`Chatbot run skipped: Auto-reply disabled for contact ${senderNumber} until ${contact.auto_reply_disabled_until}`);
          return;
        }
      }
    }

    const chatbot = i;
    const forAll = i?.for_all > 0 ? true : false;
    const chatId = convertNumberToRandomString(senderNumber || "");
    const flow = JSON.parse(i?.flow);
    const origin = JSON.parse(i?.origin || "{}")?.code || "META";
    const selectedTargets = JSON.parse(chatbot?.chats || "[]");

    if (!forAll && !selectedTargets.includes(chatId)) {
      await recordChatbotLog({
        uid,
        chatbot,
        flow,
        senderNumber,
        senderName: toName,
        incomingMessage: incomingMsg,
        origin,
        status: "skipped",
        detail: { reason: "chat_not_selected", chatId },
      });
      return;
    }

    // Check if there is an active execution paused on Form/Input for this sender/flow
    const [activeExec] = await query(
      `SELECT * FROM flow_executions WHERE flow_id = ? AND sender_mobile = ? AND status = 'paused' LIMIT 1`,
      [flow.flow_id, senderNumber]
    );

    if (activeExec) {
      const { resumeFlow } = require("../../../functions/chatbotAutomationEngine");
      await resumeFlow(activeExec.id, incomingMsg, chatbot);
      return;
    }

    // Check if this flow is a new visual automation flow
    const [automationFlow] = await query(
      `SELECT * FROM automation_flows WHERE flow_id = ? AND uid = ?`,
      [flow.flow_id, uid]
    );

    if (automationFlow) {
      const { startFlow } = require("../../../functions/chatbotAutomationEngine");
      await startFlow(flow.flow_id, incomingMsg, senderNumber, toName, uid, chatbot);
      return;
    }

    // Fallback to legacy keyword matching chatbot
    const nodePath = `${__dirname}/../../../flow-json/nodes/${uid}/${flow?.flow_id}.json`;
    const edgePath = `${__dirname}/../../../flow-json/edges/${uid}/${flow?.flow_id}.json`;

    const nodes = readJsonFromFile(nodePath);
    const edges = readJsonFromFile(edgePath);

    if (nodes.length < 1 || edges.length < 1) {
      await recordChatbotLog({
        uid,
        chatbot,
        flow,
        senderNumber,
        senderName: toName,
        incomingMessage: incomingMsg,
        origin,
        status: "skipped",
        detail: { reason: "flow_definition_missing", chatId },
      });
      return;
    }

    const answer = getReply(nodes, edges, incomingMsg);

    await recordChatbotLog({
      uid,
      chatbot,
      flow,
      senderNumber,
      senderName: toName,
      incomingMessage: incomingMsg,
      origin,
      matched: answer.length > 0,
      status: answer.length > 0 ? "matched" : "no_match",
      detail: { reply_count: answer.length, chatId, for_all: forAll },
    });

    if (answer.length > 0) {
      for (const k of answer) {
        await destributeTaskFlow({
          uid: uid,
          k: k,
          chatbotFromMysq: chatbot,
          toName: toName,
          senderNumber,
          sendMetaMsg,
          chatId,
          nodes,
          edges,
          incomingMsg,
          flowData: flow,
        });
      }
    }
  } catch (err) {
    await recordChatbotLog({
      uid,
      chatbot: i,
      senderNumber,
      senderName: toName,
      incomingMessage: incomingMsg,
      status: "error",
      detail: { error: err.message },
    });
    console.log(err);
  }
}

async function metaChatbotInit({ latestConversation, uid, origin }) {
  try {
    const { newMessage } = latestConversation;

    const incomingMsg = extractBodyText(newMessage);
    const senderNumber = newMessage?.senderMobile;
    const toName = newMessage?.senderName;

    if (!incomingMsg || !senderNumber || !toName) {
      console.log("returned metaChatbotInit since all required vars not found");
      return;
    }

    const getUser = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);
    if (getUser[0]?.plan) {
      const plan = JSON.parse(getUser[0]?.plan);
      if (plan.allow_chatbot > 0) {
        const chatbots = await query(
          `SELECT * FROM chatbot WHERE uid = ? AND active = ?`,
          [uid, 1]
        );

        if (chatbots.length > 0) {
          await Promise.all(
            chatbots.map((i) =>
              runChatbot(i, incomingMsg, uid, senderNumber, toName)
            )
          );
        }
      } else {
        await query(`UPDATE chatbot SET active = ? WHERE uid = ?`, [0, uid]);
      }
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports = { metaChatbotInit };
