const { query } = require("../../database/dbpromise");
const {
  mergeArraysWithPhonebook,
  deleteMediaFromConversation,
  returnMsgObjAfterAddingKey,
  sendMetaMsg,
  sendQrMsg,
  sendInstagramMsg,
} = require("./function");
const { readJSONFile } = require("../../functions/function.js");
const { addObjectToFile } = require("../../functions/function.js");
const moment = require("moment-timezone");

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
          `SELECT c.*, a.name AS agent_name, a.email AS agent_email
           FROM chats c
           LEFT JOIN agent_chats ac ON c.chat_id = ac.chat_id AND c.uid = ac.owner_uid
           LEFT JOIN agents a ON ac.uid = a.uid
           WHERE c.chat_id IN (?) AND c.uid = ? 
           ORDER BY c.last_message_came DESC 
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
        `SELECT c.*, a.name AS agent_name, a.email AS agent_email
         FROM chats c
         LEFT JOIN agent_chats ac ON c.chat_id = ac.chat_id AND c.uid = ac.owner_uid
         LEFT JOIN agents a ON ac.uid = a.uid
         WHERE c.uid = ? 
         ORDER BY c.last_message_came DESC 
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

function getCurrentTimestampInTimeZone(timezone) {
  const currentTimeInZone = moment.tz(timezone);
  const currentTimestampInSeconds = Math.round(
    currentTimeInZone.valueOf() / 1000
  );

  return currentTimestampInSeconds;
}

function processSocketEvent({
  socket,
  connectionInfo,
  sendToUid,
  sendToSocketId,
  updateConnectionDataBySocketId,
  getConnectionsByUid,
}) {
  // Register a specific handler for the "get_chat" event.
  socket.on("get_chat", async (payload) => {
    try {
      const limit = payload?.data?.limit || 10;
      const { uid, agent } = connectionInfo;
      let chats = [];

      if (agent && !(connectionInfo.permissions || []).includes("inbox_access")) {
        return sendToSocketId(socket.id, { msg: "Access Denied: inbox_access permission required" }, "error");
      }

      if (agent) {
        const assignedChats = await query(
          `SELECT chat_id FROM agent_chats WHERE uid = ?`,
          [uid]
        );
        if (assignedChats.length) {
          const chatIds = assignedChats.map(({ chat_id }) => chat_id);
          console.dir(
            {
              connectionInfo,
            },
            { depth: null }
          );
          chats = await query(
            `SELECT c.*, a.name AS agent_name, a.email AS agent_email
             FROM chats c
             LEFT JOIN agent_chats ac ON c.chat_id = ac.chat_id AND c.uid = ac.owner_uid
             LEFT JOIN agents a ON ac.uid = a.uid
             WHERE c.chat_id IN (?) AND c.uid = ? 
             ORDER BY c.last_message_came DESC 
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
          `SELECT c.*, a.name AS agent_name, a.email AS agent_email
           FROM chats c
           LEFT JOIN agent_chats ac ON c.chat_id = ac.chat_id AND c.uid = ac.owner_uid
           LEFT JOIN agents a ON ac.uid = a.uid
           WHERE c.uid = ? 
           ORDER BY c.last_message_came DESC 
           LIMIT ?`,
          [uid, limit]
        );
      }

      // console.log({ chats });

      const contacts = await query(`SELECT * FROM contact WHERE uid = ?`, [
        agent ? connectionInfo?.decodedValue?.owner_uid : uid,
      ]);
      const chatData = mergeArraysWithPhonebook(chats, contacts);

      sendToUid(uid, chatData, "get_chat");
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("get_chat_filter", async (payload) => {
    try {
      const { search = "", filterType = "all" } = payload?.data || {};
      const { uid, agent } = connectionInfo;

      // Build extra condition based on filterType
      let extraCondition = "";
      if (filterType === "read") {
        extraCondition = " AND c.is_opened = 1 ";
      } else if (filterType === "unread") {
        extraCondition = " AND c.is_opened = 0 ";
      }

      // Build search condition if a search string is provided
      let searchCondition = "";
      let searchParams = [];
      if (search.trim() !== "") {
        searchCondition = ` AND (
          c.sender_name LIKE ?
          OR c.sender_mobile LIKE ?
          OR c.last_message LIKE ?
          OR c.chat_note LIKE ?
          OR JSON_UNQUOTE(JSON_EXTRACT(c.chat_tags, '$.title')) LIKE ?
        )`;
        const likeSearch = `%${search}%`;
        searchParams = [
          likeSearch,
          likeSearch,
          likeSearch,
          likeSearch,
          likeSearch,
        ];
      }

      let chats = [];
      if (agent && !(connectionInfo.permissions || []).includes("inbox_access")) {
        return sendToSocketId(socket.id, { msg: "Access Denied: inbox_access permission required" }, "error");
      }

      if (agent) {
        const assignedChats = await query(
          "SELECT chat_id FROM agent_chats WHERE uid = ?",
          [uid]
        );

        if (assignedChats.length) {
          const chatIds = assignedChats.map(({ chat_id }) => chat_id);
          chats = await query(
            `SELECT c.*, a.name AS agent_name, a.email AS agent_email
             FROM chats c
             LEFT JOIN agent_chats ac ON c.chat_id = ac.chat_id AND c.uid = ac.owner_uid
             LEFT JOIN agents a ON ac.uid = a.uid
             WHERE c.chat_id IN (?)
             AND c.uid = ? 
             ${extraCondition}
             ${searchCondition}
             ORDER BY c.last_message_came DESC 
             LIMIT 20`,
            [
              chatIds,
              agent ? connectionInfo?.decodedValue?.owner_uid : uid,
              ...searchParams,
            ]
          );
        }
      } else {
        chats = await query(
          `SELECT c.*, a.name AS agent_name, a.email AS agent_email
           FROM chats c
           LEFT JOIN agent_chats ac ON c.chat_id = ac.chat_id AND c.uid = ac.owner_uid
           LEFT JOIN agents a ON ac.uid = a.uid
           WHERE c.uid = ?
           ${extraCondition}
           ${searchCondition}
           ORDER BY c.last_message_came DESC 
           LIMIT 20`,
          [uid, ...searchParams]
        );
      }

      console.log("Filtered Chats:", chats);

      const contacts = await query("SELECT * FROM contact WHERE uid = ?", [
        agent ? connectionInfo?.decodedValue?.owner_uid : uid,
      ]);

      const chatData = mergeArraysWithPhonebook(chats, contacts);
      sendToUid(uid, chatData, "get_chat");
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("delete_chat", async (payload) => {
    try {
      const { chatId, type } = payload?.data;
      const { uid, agent, id } = connectionInfo;

      // Agents must not delete chats — this is a supervisor/owner operation
      if (agent) {
        return sendToSocketId(id, { msg: "Agents cannot delete chats" }, "error");
      }

      if (chatId && type) {
        const { uid, agent } = connectionInfo;
        await query(`DELETE FROM chats WHERE chat_id = ?`, [chatId]);

        const convoPath = `${__dirname}/../../conversations/inbox/${
          agent ? connectionInfo?.decodedValue?.owner_uid : uid
        }/${chatId}.json`;
        const metaMediaFolder = `${__dirname}/../../client/public/meta-media`;

        deleteMediaFromConversation(convoPath, metaMediaFolder, type);
        if (type === "delete") {
          await query(`DELETE FROM chats WHERE chat_id = ? AND uid = ?`, [
            chatId,
            uid,
          ]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("on_open_chat", async (payload) => {
    try {
      const { chatId, limit, chat } = payload?.data;
      const { uid, id, agent } = connectionInfo;
      if (chatId && limit) {
        // If agent, verify they have permission and are assigned to this chat
        if (agent) {
          if (!(connectionInfo.permissions || []).includes("inbox_access")) {
            return sendToSocketId(id, { msg: "Access Denied: inbox_access permission required" }, "error");
          }
          const assigned = await query(
            "SELECT 1 FROM agent_chats WHERE uid = ? AND chat_id = ?",
            [uid, chatId]
          );
          if (!assigned.length) {
            return sendToSocketId(id, { msg: "Not assigned to this chat" }, "error");
          }
        }

        const conversationPath = `${__dirname}/../../conversations/inbox/${
          agent ? connectionInfo?.decodedValue?.owner_uid : uid
        }/${chatId}.json`;
        const conversation = readJSONFile(conversationPath, limit);

        await query(`UPDATE chats SET is_opened = ? WHERE id = ?`, [
          1,
          chat?.id,
        ]);

        const [chatData] = await query(`SELECT * FROM chats Where id = ?`, [
          chat?.id,
        ]);

        const [user] = await query(`SELECT * FROM user WHERE uid = ?`, [
          agent ? connectionInfo?.decodedValue?.owner_uid : uid,
        ]);
        const labelAdded = await query(
          `SELECT * FROM chat_tags WHERE uid = ?`,
          [agent ? connectionInfo?.decodedValue?.owner_uid : uid]
        );
        const agents = await query(`SELECT * FROM agents WHERE owner_uid = ?`, [
          agent ? connectionInfo?.decodedValue?.owner_uid : uid,
        ]);

        const [chatAssignAgent] = await query(
          `SELECT * FROM agent_chats WHERE chat_id = ? AND owner_uid = ?`,
          [chat?.chat_id, agent ? connectionInfo?.decodedValue?.owner_uid : uid]
        );

        const tenantUid = agent ? connectionInfo?.decodedValue?.owner_uid : uid;

        const [contactData] = await query(
          "SELECT auto_reply_disabled_until FROM contact WHERE uid = ? AND mobile = ? LIMIT 1",
          [tenantUid, chatData?.sender_mobile || chat?.sender_mobile || ""]
        );

        const onChatSelectData = {
          conversation: conversation || [],
          chatinfo: {
            ...chat,
            ...chatData,
            auto_reply_disabled_until: contactData?.auto_reply_disabled_until || null
          },
          chatnote: chatData?.chat_note,
          countDownTimer: {
            timestamp: chatData?.last_message_came,
            timezone: user?.timezone || "Asia/Kolkata",
          },
          labelsAdded: labelAdded || [],
          agentData: agents || [],
          chatAssignAgent: chatAssignAgent || {},
        };

        sendToSocketId(id, onChatSelectData, "on_open_chat");
        updateConnectionDataBySocketId(connectionInfo.id, {
          selectedChat: chat,
        });
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("assign_agent_to_chat", async (payload) => {
    try {
      const { uid, id, agent } = connectionInfo;

      // Agents must not reassign chats — this is a supervisor/owner operation
      if (agent) {
        return sendToSocketId(id, { msg: "Agents cannot reassign chats" }, "error");
      }

      const { chatId, agentUid, unAssign } = payload.data;
      const ownerUid = agent ? connectionInfo?.decodedValue?.owner_uid : uid;

      console.log({ chatId, agentUid, unAssign });

      // Clean up any existing assignments for this chat to prevent duplicate rows
      await query(
        `DELETE FROM agent_chats WHERE chat_id = ? AND owner_uid = ?`,
        [chatId, ownerUid]
      );

      if (chatId && agentUid && !unAssign) {
        await query(
          `INSERT INTO agent_chats (owner_uid, uid, chat_id) VALUES (?,?,?)`,
          [ownerUid, agentUid, chatId]
        );
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("save_chat_note", async (payload) => {
    try {
      const { id: chatRowId, chatNote } = payload?.data;
      const { uid, agent, id } = connectionInfo;

      // Agents must use the scoped REST endpoint /api/agent/save_note instead
      if (agent) {
        return sendToSocketId(id, { msg: "Agents must use the REST API for notes" }, "error");
      }

      if (chatRowId) {
        await query(`UPDATE chats SET chat_note = ? WHERE id = ?`, [
          chatNote,
          chatRowId,
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("add_label", async (payload) => {
    try {
      const { label, hex } = payload?.data;
      const { uid, id, agent } = connectionInfo;

      // Agents must not create labels — this is a supervisor/owner operation
      if (agent) {
        return sendToSocketId(id, { msg: "Agents cannot manage labels" }, "error");
      }

      const ownerUid = agent ? connectionInfo?.decodedValue?.owner_uid : uid;
      if (!label || !hex) {
        sendToSocketId(id, { msg: "Please provide Label" }, "error");
        return;
      }

      const labelsData = await query(`SELECT * FROM chat_tags WHERE uid = ?`, [
        ownerUid,
      ]);

      const allLablesTitles = labelsData?.map((x) => x.title);
      if (allLablesTitles?.includes(label)) {
        sendToSocketId(id, { msg: "Duplicate label is not allowed" }, "error");
        return;
      }

      await query(`INSERT INTO chat_tags (uid, hex, title) VALUES (?,?,?)`, [
        ownerUid,
        hex,
        label,
      ]);

      const labelsDataNew = await query(
        `SELECT * FROM chat_tags WHERE uid = ?`,
        [ownerUid]
      );

      // updating labels to client
      sendToSocketId(id, labelsDataNew, "update_labels");
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("on_label_delete", async (payload) => {
    try {
      const { labelId } = payload?.data;
      const { uid, id, agent } = connectionInfo;

      // Agents must not delete labels — this is a supervisor/owner operation
      if (agent) {
        return sendToSocketId(id, { msg: "Agents cannot manage labels" }, "error");
      }

      const ownerUid = agent ? connectionInfo?.decodedValue?.owner_uid : uid;
      await query(`DELETE FROM chat_tags WHERE id = ?`, [labelId]);

      // updating label
      const labelsDataNew = await query(
        `SELECT * FROM chat_tags WHERE uid = ?`,
        [ownerUid]
      );

      // updating labels to client
      sendToSocketId(id, labelsDataNew, "update_labels");
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("set_chat_label", async (payload) => {
    try {
      const { labelData, chatIdRow } = payload?.data;
      const { uid, id, agent } = connectionInfo;

      // Agents must not assign labels — this is a supervisor/owner operation
      if (agent) {
        return sendToSocketId(id, { msg: "Agents cannot manage labels" }, "error");
      }

      const ownerUid = agent ? connectionInfo?.decodedValue?.owner_uid : uid;

      if (!labelData || !chatIdRow) {
        return sendToSocketId(id, { msg: "Invalid request" }, "error");
      }

      await query(`UPDATE chats SET chat_tags = ? WHERE id = ?`, [
        JSON.stringify(labelData),
        chatIdRow,
      ]);

      // updating chat info
      const [updatedChatData] = await query(
        `SELECT * FROM chats WHERE id = ?`,
        [chatIdRow]
      );

      if (updatedChatData?.chat_tags) {
        sendToSocketId(id, updatedChatData?.chat_tags, "update_chat_info");
      }

      // updating chat list
      // Send the latest chat list to all sockets of the user.
      const socketConnections = getConnectionsByUid(ownerUid) || [];

      socketConnections.forEach(async (socket) => {
        const updateChatSocketData = await updateChatListSocket({
          connectionInfo: socket,
        });

        sendToUid(ownerUid, updateChatSocketData, "update_chat_list");
        console.log("Chat update sent to socket");
      });

      // Send the latest chat list to all sockets of the user. end
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("send_chat_message", async (payload) => {
    try {
      const { type, msgCon, chatInfo } = payload.data;
      const { uid, id, agent } = connectionInfo;
      const { selectedChat } = connectionInfo?.data;

      if (!msgCon || !type) {
        return sendToSocketId(id, { msg: "Please add a message" }, "error");
      }

      if (agent) {
        if (!(connectionInfo.permissions || []).includes("inbox_access")) {
          return sendToSocketId(id, { msg: "Access Denied: inbox_access permission required" }, "error");
        }
        if (selectedChat?.chat_id) {
          const assigned = await query(
            "SELECT 1 FROM agent_chats WHERE uid = ? AND chat_id = ?",
            [uid, selectedChat.chat_id]
          );
          if (!assigned.length) {
            return sendToSocketId(id, { msg: "Not assigned to this chat" }, "error");
          }
        }
      }

      if (!selectedChat?.id) {
        return sendToSocketId(
          id,
          { msg: "Please open the chat again you server faced socket issue" },
          "error"
        );
      }

      const senderName = selectedChat?.sender_name;
      const senderMobile = selectedChat?.sender_mobile;

      const [user] = await query(`SELECT * FROM user WHERE uid = ?`, [
        agent ? connectionInfo?.decodedValue?.owner_uid : uid,
      ]);
      const userTimezone = getCurrentTimestampInTimeZone(
        user?.timezone || "Asia/Kolkata"
      );

      // Prepare the message
      const msgObj = returnMsgObjAfterAddingKey({
        msgContext: msgCon,
        type,
        timestamp: userTimezone || "NA",
        senderName: senderName || "NA",
        senderMobile: senderMobile || "NA",
      });

      let sendMsg;

      if (chatInfo?.origin === "qr") {
        sendMsg = await sendQrMsg({
          msgObj: msgCon,
          to: senderMobile,
          uid: agent ? connectionInfo?.decodedValue?.owner_uid : uid,
          chatInfo,
        });
      } else if (chatInfo?.origin?.toLowerCase() === "instagram") {
        sendMsg = await sendInstagramMsg({
          msgObj: msgCon,
          to: senderMobile,
          uid: agent ? connectionInfo?.decodedValue?.owner_uid : uid,
        });
      } else {
        sendMsg = await sendMetaMsg({
          msgObj: msgCon,
          to: senderMobile,
          uid: agent ? connectionInfo?.decodedValue?.owner_uid : uid,
        });
      }

      if (!sendMsg?.success) {
        console.log(sendMsg);
        return sendToSocketId(id, { msg: sendMsg?.msg }, "error");
      }

      if (sendMsg?.id) {
        const ownerUid = agent ? connectionInfo?.decodedValue?.owner_uid : uid;
        const chatPath = `${__dirname}/../../conversations/inbox/${ownerUid}/${selectedChat?.chat_id}.json`;
        const msgObjNew = { ...msgObj, metaChatId: sendMsg?.id };
        addObjectToFile(msgObjNew, chatPath);

        const existingChat = await query(`SELECT last_reply_by, last_incoming_time FROM chats WHERE chat_id = ?`, [selectedChat?.chat_id]);
        if (existingChat.length > 0 && existingChat[0].last_reply_by === 'user' && existingChat[0].last_incoming_time) {
          const incomingTime = Number(existingChat[0].last_incoming_time);
          const responseTime = Math.floor((Date.now() - incomingTime) / 1000);
          const slaViolated = responseTime > 300 ? 1 : 0;
          const responderAgentUid = agent ? uid : 'owner';

          await query(
            `INSERT INTO agent_response_logs (uid, agent_uid, chat_id, response_time_seconds, sla_violated) 
             VALUES (?, ?, ?, ?, ?)`,
            [ownerUid, responderAgentUid, selectedChat?.chat_id, responseTime, slaViolated]
          );

          if (slaViolated) {
            await query(`UPDATE escalation_queue SET resolved = 1, resolved_at = CURRENT_TIMESTAMP WHERE chat_id = ? AND resolved = 0`, [selectedChat?.chat_id]);
          }
        }

        await query(
          `UPDATE chats SET last_message_came = ?, last_message = ?, is_opened = ?, last_reply_by = 'agent', last_outgoing_time = ?, sla_violated = 0, sla_expires_at = NULL WHERE chat_id = ?`,
          [userTimezone, JSON.stringify(msgObjNew), 1, Date.now(), selectedChat?.chat_id]
        );

        // Send the latest chat list to all sockets of the user.
        const socketConnections = getConnectionsByUid(ownerUid) || [];
        socketConnections.forEach(async (socketConn) => {
          const updateChatSocketData = await updateChatListSocket({
            connectionInfo: socketConn,
          });
          sendToUid(ownerUid, updateChatSocketData, "update_chat_list");
        });
      }

      console.dir({ sendMsg }, { depth: null });
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("add", async (payload) => {
    updateConnectionDataBySocketId(connectionInfo.id, payload);
  });
}

module.exports = { processSocketEvent };
