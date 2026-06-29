const { query } = require("../../database/dbpromise");
const {
  getConnectionsByUid,
  sendToUid,
  sendRingToUid,
  sendToSocketId,
} = require("../../socket");
const { mergeArraysWithPhonebook } = require("../socket/function");
const { processMetaMessage } = require("./meta");
const { metaChatbotInit } = require("../chatbot/meta");
const { processMessageQr } = require("../addon/qr/processThings");
const { processWebhookRules } = require("../webhooks/engine");

async function updateChatListSocket({ connectionInfo }) {
  try {
    const limit = 10;
    const { uid, agent } = connectionInfo;
    let chats = [];

    if (agent) {
      const assignedChats = await query(
        `SELECT chat_id FROM agent_chats WHERE uid = ?`,
        [uid]
      );
      if (assignedChats.length) {
        const chatIds = assignedChats.map(({ chat_id }) => chat_id);
        chats = await query(
          `SELECT * FROM chats 
           WHERE chat_id IN (?) AND uid = ? 
           ORDER BY last_message_came DESC 
           LIMIT ?`,
          [
            chatIds,
            agent ? connectionInfo?.decodedValue?.owner_uid : uid,
            limit,
          ]
        );
      }
    } else {
      chats = await query(
        `SELECT * FROM chats 
         WHERE uid = ? 
         ORDER BY last_message_came DESC 
         LIMIT ?`,
        [uid, limit]
      );
    }

    const contacts = await query(`SELECT * FROM contact WHERE uid = ?`, [
      agent ? connectionInfo?.decodedValue?.owner_uid : uid,
    ]);
    const chatData = mergeArraysWithPhonebook(chats, contacts);

    return chatData || [];
  } catch (err) {
    console.log(err);
  }
}

async function processMessage({
  body,
  uid,
  origin,
  getSession,
  sessionId,
  qrType,
}) {
  try {
    // getting user data
    const [userData] = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);
    if (!userData) return;

    let latestConversation = [];

    // console.dir({ body }, { depth: null });

    switch (origin) {
      case "meta":
        const metaMsg = await processMetaMessage({
          body,
          uid,
          origin,
          userData,
        });
        latestConversation = metaMsg;
        break;
      case "qr":
        console.log("QR MESSAGE");
        const qrMsg = await processMessageQr({
          getSession,
          message: body,
          sessionId,
          type: qrType,
          uid,
          userData,
        });
        latestConversation = qrMsg;
        console.log("QR MESSAGE");
        break;
      default:
        break;
    }

    // Send the latest chat list to all sockets of the user.
    const socketConnections = getConnectionsByUid(uid) || [];

    socketConnections.forEach(async (socket) => {
      const updateChatSocketData = await updateChatListSocket({
        connectionInfo: socket,
      });

      sendToSocketId(socket?.id, updateChatSocketData, "update_chat_list");
      console.log("Chat update sent to socket");
    });

    // console.log({ latestConversation: latestConversation });

    sendRingToUid(uid);
    // Send the latest chat list to all sockets of the user. end

    // sending conversation update
    socketConnections.forEach(async (socket) => {
      const opendedChat = socket?.data?.selectedChat || null;
      // console.log({
      //   mob: opendedChat?.sender_mobile,
      //   lMob: latestConversation?.newMessage?.senderMobile,
      // });

      if (
        opendedChat?.sender_mobile ===
          latestConversation?.newMessage?.senderMobile ||
        opendedChat?.sender_mobile ===
          latestConversation?.latestMessages?.[0]?.senderMobile
      ) {
        const socketId = socket?.id;
        sendToSocketId(
          socketId,
          { conversation: latestConversation },
          "update_conversation"
        );
      }
    });
    // console.dir({ latestConversation }, { depth: null });

    // chatbot init and webhooks evaluation
    // console.log({ latestConversation });
    if (latestConversation?.newMessage && uid) {
      const senderMobile = latestConversation.newMessage.senderMobile;
      if (senderMobile) {
        const slaExpires = new Date(Date.now() + 300 * 1000); // 5 minutes SLA
        await query(
          `UPDATE chats 
           SET last_reply_by = 'user', last_incoming_time = ?, sla_expires_at = ?, sla_violated = 0 
           WHERE sender_mobile = ? AND uid = ?`,
          [Date.now(), slaExpires, senderMobile, uid]
        );
      }
      metaChatbotInit({ latestConversation, uid, origin });
      processWebhookRules({ latestConversation, uid, origin });
    }
  } catch (err) {
    console.log(err);
  }
}

const eventBus = require("../../utils/channels/eventBus");
const path = require("path");

eventBus.on("incoming_message", async (normalizedMsg) => {
  try {
    const { uid, channel, senderId, senderName, messageType, text, attachments, timestamp } = normalizedMsg;

    // 1. Ensure phonebook/contact exists
    const pbName = `${channel.toUpperCase()} Contact`;
    let pbId;
    const existingPb = await query(`SELECT * FROM phonebook WHERE uid = ? AND name = ?`, [uid, pbName]);
    if (existingPb.length > 0) {
      pbId = existingPb[0].id;
    } else {
      const insertPb = await query(`INSERT INTO phonebook (uid, name) VALUES (?, ?) RETURNING id`, [uid, pbName]);
      pbId = insertPb[0]?.id;
    }

    const checkContact = await query(`SELECT * FROM contact WHERE uid = ? AND mobile = ?`, [uid, senderId]);
    if (checkContact.length === 0) {
      await query(`INSERT INTO contact (uid, phonebook_id, phonebook_name, name, mobile, var1) VALUES (?, ?, ?, ?, ?, ?)`, [
        uid,
        pbId,
        pbName,
        senderName || "Unknown Contact",
        senderId,
        `Auto-created via ${channel}`
      ]);
    }

    // 2. Build conversation message object
    const newMessage = {
      type: messageType,
      metaChatId: normalizedMsg.metadata?.message_id || "msg-" + Date.now(),
      msgContext: {
        type: messageType,
        [messageType]: messageType === "text" ? { body: text } : { link: attachments?.[0]?.url, caption: attachments?.[0]?.caption || "" }
      },
      reaction: "",
      timestamp: Math.round(timestamp / 1000),
      senderName: senderName || "Contact",
      senderMobile: senderId,
      status: "received",
      star: false,
      route: "INCOMING",
      origin: channel
    };

    // 3. Save to conversation history file
    const conversationsDir = path.resolve(__dirname, `../../conversations/inbox/${uid}`);
    if (!fs.existsSync(conversationsDir)) {
      fs.mkdirSync(conversationsDir, { recursive: true });
    }
    const chatFilePath = path.join(conversationsDir, `${senderId}.json`);
    let conversationHistory = [];
    if (fs.existsSync(chatFilePath)) {
      try {
        conversationHistory = JSON.parse(fs.readFileSync(chatFilePath, "utf8"));
      } catch (e) {
        console.error("JSON parse error for chat file:", e);
      }
    }
    conversationHistory.push(newMessage);
    fs.writeFileSync(chatFilePath, JSON.stringify(conversationHistory, null, 2));

    // 4. Update or insert into chats table
    const [existingChat] = await query(
      "SELECT * FROM chats WHERE chat_id = ? AND uid = ?",
      [senderId, uid]
    );

    const userTimezone = Math.round(Date.now() / 1000);

    if (existingChat) {
      await query(
        `UPDATE chats 
         SET last_message_came = ?, last_message = ?, is_opened = 0, sender_name = ?, last_incoming_time = ?, sla_expires_at = ?
         WHERE chat_id = ? AND uid = ?`,
        [userTimezone, JSON.stringify(newMessage), senderName, Date.now(), new Date(Date.now() + 300 * 1000), senderId, uid]
      );
    } else {
      await query(
        `INSERT INTO chats (chat_id, uid, last_message_came, sender_name, sender_mobile, last_message, is_opened, origin, last_incoming_time, sla_expires_at) 
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
        [senderId, uid, userTimezone, senderName, senderId, JSON.stringify(newMessage), channel, Date.now(), new Date(Date.now() + 300 * 1000)]
      );
    }

    // 5. Socket updates
    const socketConnections = getConnectionsByUid(uid) || [];
    socketConnections.forEach(async (socket) => {
      const chatListData = await updateChatListSocket({ connectionInfo: socket });
      sendToSocketId(socket?.id, chatListData, "update_chat_list");

      const openedChat = socket?.data?.selectedChat || null;
      if (openedChat?.chat_id === senderId || openedChat?.sender_mobile === senderId) {
        sendToSocketId(
          socket?.id,
          { conversation: { newMessage, latestMessages: conversationHistory.slice(-10) } },
          "update_conversation"
        );
      }
    });

    sendRingToUid(uid);

    // 6. Trigger chatbot and webhook rules
    metaChatbotInit({
      latestConversation: { newMessage, latestMessages: conversationHistory.slice(-10) },
      uid,
      origin: channel
    });

    processWebhookRules({
      latestConversation: { newMessage, latestMessages: conversationHistory.slice(-10) },
      uid,
      origin: channel
    });

  } catch (err) {
    console.error("Error processing incoming Event Bus message:", err.message);
  }
});

module.exports = { processMessage, updateChatListSocket };
