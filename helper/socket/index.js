const { query } = require('../../database/dbpromise');
const {
  deleteMediaFromConversation,
  returnMsgObjAfterAddingKey,
  sendMetaMsg,
  sendQrMsg,
  sendInstagramMsg,
} = require('./function');
const { readJSONFile } = require('../../functions/function.js');
const { addObjectToFile } = require('../../functions/function.js');
const moment = require('moment-timezone');

const { loadChatList: updateChatListSocket } = require('./chatList');

function getCurrentTimestampInTimeZone(timezone) {
  const currentTimeInZone = moment.tz(timezone);
  const currentTimestampInSeconds = Math.round(currentTimeInZone.valueOf() / 1000);

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
  async function sendChatList(payload = {}, filtered = false) {
    const { agent, id } = connectionInfo;
    if (
      agent &&
      !(connectionInfo.permissions || []).some((p) =>
        ['inbox_access', 'inbox.read', 'inbox.reply'].includes(p),
      )
    ) {
      return sendToSocketId(
        id,
        { msg: 'Access Denied: inbox_access permission required' },
        'error',
      );
    }
    const data = payload.data || {};
    const filters = filtered
      ? {
          search: String(data.search || '').trim(),
          filterType: ['read', 'unread'].includes(data.filterType) ? data.filterType : 'all',
          channel: ['whatsapp', 'instagram', 'website'].includes(data.channel)
            ? data.channel
            : 'all',
        }
      : { search: '', filterType: 'all', channel: 'all' };
    connectionInfo.data = { ...connectionInfo.data, inboxFilters: filters };
    try {
      const chats = await updateChatListSocket({ connectionInfo, limit: data.limit });
      // Search belongs to this socket; another tab may be using a different filter.
      sendToSocketId(
        id,
        data.requestId == null ? chats : { chats, requestId: data.requestId },
        'get_chat',
      );
    } catch (err) {
      console.error('Inbox list failed:', err.message);
      sendToSocketId(
        id,
        { msg: 'Unable to load chats. Please retry.', requestId: data.requestId },
        'error',
      );
    }
  }
  socket.on('get_chat', (payload) => sendChatList(payload));
  socket.on('get_chat_filter', (payload) => sendChatList(payload, true));

  socket.on('delete_chat', async (payload) => {
    try {
      const { chatId, type } = payload?.data || {};
      const { agent, id } = connectionInfo;

      // Agents must not delete chats — this is a supervisor/owner operation
      if (agent) {
        return sendToSocketId(id, { msg: 'Agents cannot delete chats' }, 'error');
      }

      if (chatId && type) {
        const { uid, id, agent } = connectionInfo;
        const [ownedChat] = await query('SELECT id FROM chats WHERE chat_id = ? AND uid = ?', [
          chatId,
          uid,
        ]);
        if (!ownedChat) return sendToSocketId(id, { msg: 'Conversation not found.' }, 'error');

        const convoPath = `${__dirname}/../../conversations/inbox/${
          agent ? connectionInfo?.decodedValue?.owner_uid : uid
        }/${chatId}.json`;
        const metaMediaFolder = `${__dirname}/../../client/public/meta-media`;

        deleteMediaFromConversation(convoPath, metaMediaFolder, type);
        if (type === 'delete') {
          await query(`DELETE FROM chats WHERE chat_id = ? AND uid = ?`, [chatId, uid]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('on_open_chat', async (payload) => {
    try {
      const { chatId, limit, chat, requestId } = payload?.data || {};
      connectionInfo.data = { ...connectionInfo.data, openChatRequestId: requestId };
      const { uid, id, agent } = connectionInfo;
      if (chatId && limit) {
        let activeChatId = chatId;
        let activeChat = chat;
        let activeChatDbId = chat?.id;

        if (agent && chatId.startsWith('contact-'))
          return sendToSocketId(
            id,
            { msg: 'Agents can only open assigned conversations.', requestChatId: chatId },
            'error',
          );
        if (chatId.startsWith('contact-')) {
          const mobile = chatId.replace('contact-', '');
          const tenantUid = agent ? connectionInfo?.decodedValue?.owner_uid : uid;

          // Check if a chat already exists for this mobile
          let [existing] = await query(`SELECT * FROM chats WHERE sender_mobile = ? AND uid = ?`, [
            mobile,
            tenantUid,
          ]);

          if (!existing) {
            // Generate a random string or uuid for chat_id
            const newChatId = 'chat_' + Math.random().toString(36).substring(2, 15);
            // Get contact name
            const [contactRow] = await query(
              `SELECT name FROM contact WHERE mobile = ? AND uid = ?`,
              [mobile, tenantUid],
            );
            const name = contactRow?.name || 'Contact';

            // Insert chat row
            const result = await query(
              `INSERT INTO chats (chat_id, uid, sender_name, sender_mobile, is_opened, chat_status, origin, chat_tags) 
               VALUES (?, ?, ?, ?, 1, 'open', 'whatsapp_cloud', '[]') RETURNING *`,
              [newChatId, tenantUid, name, mobile],
            );
            existing = result[0];
          }

          activeChatId = existing.chat_id;
          activeChat = existing;
          activeChatDbId = existing.id;
        }

        const tenantUid = agent ? connectionInfo?.decodedValue?.owner_uid : uid;
        const [storedChat] = await query('SELECT * FROM chats WHERE chat_id = ? AND uid = ?', [
          activeChatId,
          tenantUid,
        ]);
        if (!storedChat) {
          return sendToSocketId(
            id,
            { msg: 'Conversation not found.', requestChatId: chatId },
            'error',
          );
        }
        activeChat = { ...activeChat, ...storedChat };
        activeChatDbId = storedChat.id;

        // If agent, verify they have permission and are assigned to this chat
        if (agent) {
          if (
            !(connectionInfo.permissions || []).some(
              (p) => p === 'inbox_access' || p === 'inbox.read' || p === 'inbox.reply',
            )
          ) {
            return sendToSocketId(
              id,
              { msg: 'Access Denied: inbox_access permission required' },
              'error',
            );
          }
          const assigned = await query('SELECT 1 FROM agent_chats WHERE uid = ? AND chat_id = ?', [
            uid,
            activeChatId,
          ]);
          if (!assigned.length) {
            return sendToSocketId(id, { msg: 'Not assigned to this chat' }, 'error');
          }
        }

        const conversationPath = `${__dirname}/../../conversations/inbox/${
          agent ? connectionInfo?.decodedValue?.owner_uid : uid
        }/${activeChatId}.json`;
        const conversation = readJSONFile(conversationPath, limit);

        await query(`UPDATE chats SET is_opened = ? WHERE id = ?`, [1, activeChatDbId]);

        const [chatData] = await query(`SELECT * FROM chats Where id = ?`, [activeChatDbId]);

        const [user] = await query(`SELECT * FROM user WHERE uid = ?`, [
          agent ? connectionInfo?.decodedValue?.owner_uid : uid,
        ]);
        const labelAdded = await query(`SELECT * FROM chat_tags WHERE uid = ?`, [
          agent ? connectionInfo?.decodedValue?.owner_uid : uid,
        ]);
        const agents = await query(`SELECT uid, name, email FROM agents WHERE owner_uid = ?`, [
          agent ? connectionInfo?.decodedValue?.owner_uid : uid,
        ]);

        const [chatAssignAgent] = await query(
          `SELECT ac.*, a.name, a.email FROM agent_chats ac LEFT JOIN agents a ON a.uid = ac.uid AND a.owner_uid = ac.owner_uid WHERE ac.chat_id = ? AND ac.owner_uid = ?`,
          [activeChatId, agent ? connectionInfo?.decodedValue?.owner_uid : uid],
        );

        const [contactData] = await query(
          'SELECT auto_reply_disabled_until FROM contact WHERE uid = ? AND mobile = ? LIMIT 1',
          [tenantUid, chatData?.sender_mobile || activeChat?.sender_mobile || ''],
        );

        const onChatSelectData = {
          requestChatId: chatId,
          requestId: payload?.data?.requestId,
          background: Boolean(payload?.data?.background),
          conversation: conversation || [],
          chatinfo: {
            ...activeChat,
            ...chatData,
            auto_reply_disabled_until: contactData?.auto_reply_disabled_until || null,
          },
          chatnote: chatData?.chat_note,
          countDownTimer: {
            timestamp: chatData?.last_message_came,
            timezone: user?.timezone || 'Asia/Kolkata',
          },
          labelsAdded: labelAdded || [],
          agentData: agents || [],
          chatAssignAgent: chatAssignAgent || {},
        };

        if (requestId != null && connectionInfo.data?.openChatRequestId !== requestId) return;
        sendToSocketId(id, onChatSelectData, 'on_open_chat');
        updateConnectionDataBySocketId(connectionInfo.id, {
          selectedChat: { ...activeChat, ...chatData },
        });
      }
    } catch (err) {
      console.error(err);
      sendToSocketId(
        connectionInfo.id,
        {
          msg: 'Unable to load this conversation. Please retry.',
          requestChatId: payload?.data?.chatId,
        },
        'error',
      );
    }
  });

  socket.on('assign_agent_to_chat', async (payload) => {
    try {
      const { uid, id, agent } = connectionInfo;

      // Agents must not reassign chats — this is a supervisor/owner operation
      if (agent) {
        return sendToSocketId(id, { msg: 'Agents cannot reassign chats' }, 'error');
      }

      const { chatId, agentUid, unAssign } = payload.data || {};
      const { assignChat } = require('../../services/chatAssignment');
      await assignChat({ ownerUid: uid, chatId, agentUid: unAssign ? null : agentUid });
    } catch (err) {
      sendToSocketId(connectionInfo.id, { msg: err.message }, 'error');
    }
  });

  socket.on('save_chat_note', async (payload) => {
    try {
      const { id: chatRowId, chatNote } = payload?.data || {};
      const { uid, agent, id } = connectionInfo;

      // Agents must use the scoped REST endpoint /api/agent/save_note instead
      if (agent) {
        return sendToSocketId(id, { msg: 'Agents must use the REST API for notes' }, 'error');
      }

      if (chatRowId) {
        await query(`UPDATE chats SET chat_note = ? WHERE id = ? AND uid = ?`, [
          chatNote,
          chatRowId,
          uid,
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('add_label', async (payload) => {
    try {
      const { label, hex } = payload?.data || {};
      const { uid, id, agent } = connectionInfo;

      // Agents must not create labels — this is a supervisor/owner operation
      if (agent) {
        return sendToSocketId(id, { msg: 'Agents cannot manage labels' }, 'error');
      }

      const ownerUid = agent ? connectionInfo?.decodedValue?.owner_uid : uid;
      if (!label || !hex) {
        sendToSocketId(id, { msg: 'Please provide Label' }, 'error');
        return;
      }

      const labelsData = await query(`SELECT * FROM chat_tags WHERE uid = ?`, [ownerUid]);

      const allLablesTitles = labelsData?.map((x) => x.title);
      if (allLablesTitles?.includes(label)) {
        sendToSocketId(id, { msg: 'Duplicate label is not allowed' }, 'error');
        return;
      }

      await query(`INSERT INTO chat_tags (uid, hex, title) VALUES (?,?,?)`, [ownerUid, hex, label]);

      const labelsDataNew = await query(`SELECT * FROM chat_tags WHERE uid = ?`, [ownerUid]);

      // updating labels to client
      sendToSocketId(id, labelsDataNew, 'update_labels');
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('on_label_delete', async (payload) => {
    try {
      const { labelId } = payload?.data || {};
      const { uid, id, agent } = connectionInfo;

      // Agents must not delete labels — this is a supervisor/owner operation
      if (agent) {
        return sendToSocketId(id, { msg: 'Agents cannot manage labels' }, 'error');
      }

      const ownerUid = agent ? connectionInfo?.decodedValue?.owner_uid : uid;
      await query(`DELETE FROM chat_tags WHERE id = ? AND uid = ?`, [labelId, ownerUid]);

      // updating label
      const labelsDataNew = await query(`SELECT * FROM chat_tags WHERE uid = ?`, [ownerUid]);

      // updating labels to client
      sendToSocketId(id, labelsDataNew, 'update_labels');
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('set_chat_label', async (payload) => {
    try {
      const { labelData, chatIdRow } = payload?.data || {};
      const { uid, id, agent } = connectionInfo;

      // Agents must not assign labels — this is a supervisor/owner operation
      if (agent) {
        return sendToSocketId(id, { msg: 'Agents cannot manage labels' }, 'error');
      }

      const ownerUid = agent ? connectionInfo?.decodedValue?.owner_uid : uid;

      if (!labelData || !chatIdRow) {
        return sendToSocketId(id, { msg: 'Invalid request' }, 'error');
      }

      await query(`UPDATE chats SET chat_tags = ? WHERE id = ? AND uid = ?`, [
        JSON.stringify(labelData),
        chatIdRow,
        ownerUid,
      ]);

      // updating chat info
      const [updatedChatData] = await query(`SELECT * FROM chats WHERE id = ? AND uid = ?`, [
        chatIdRow,
        ownerUid,
      ]);

      if (updatedChatData?.chat_tags) {
        sendToSocketId(id, updatedChatData?.chat_tags, 'update_chat_info');
      }

      // updating chat list
      // Send the latest chat list to all sockets of the user.
      const socketConnections = getConnectionsByUid(ownerUid) || [];

      socketConnections.forEach(async (socket) => {
        const updateChatSocketData = await updateChatListSocket({
          connectionInfo: socket,
        });

        sendToUid(ownerUid, updateChatSocketData, 'update_chat_list');
        console.log('Chat update sent to socket');
      });

      // Send the latest chat list to all sockets of the user. end
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('send_chat_message', async (payload, acknowledge) => {
    const respond = (result) => {
      if (typeof acknowledge === 'function') acknowledge(result);
      if (!result.success)
        sendToSocketId(connectionInfo.id, { msg: result.msg, operation: 'send' }, 'error');
      return result;
    };
    try {
      const { type, msgCon } = payload?.data || {};
      const { uid, agent } = connectionInfo;
      const { selectedChat } = connectionInfo?.data;

      if (!msgCon || !type) {
        return respond({ success: false, msg: 'Please add a message' });
      }

      if (agent) {
        if (
          !(connectionInfo.permissions || []).some(
            (p) => p === 'inbox_access' || p === 'inbox.reply',
          )
        ) {
          return respond({ success: false, msg: 'Access Denied: inbox.reply permission required' });
        }
        if (selectedChat?.chat_id) {
          const assigned = await query('SELECT 1 FROM agent_chats WHERE uid = ? AND chat_id = ?', [
            uid,
            selectedChat.chat_id,
          ]);
          if (!assigned.length) {
            return respond({ success: false, msg: 'Not assigned to this chat' });
          }
        }
      }

      if (!selectedChat?.id) {
        return respond({ success: false, msg: 'Open an assigned conversation before replying.' });
      }

      const ownerUid = agent ? connectionInfo.decodedValue.owner_uid : uid;
      const [chatInfo] = await query('SELECT * FROM chats WHERE chat_id = ? AND uid = ?', [
        selectedChat.chat_id,
        ownerUid,
      ]);
      if (!chatInfo) return respond({ success: false, msg: 'Conversation not found.' });
      const senderName = chatInfo.sender_name;
      const senderMobile = chatInfo.sender_mobile;

      const [user] = await query(`SELECT * FROM user WHERE uid = ?`, [
        agent ? connectionInfo?.decodedValue?.owner_uid : uid,
      ]);
      const userTimezone = getCurrentTimestampInTimeZone(user?.timezone || 'Asia/Kolkata');

      // Prepare the message
      const msgObj = returnMsgObjAfterAddingKey({
        msgContext: msgCon,
        type,
        timestamp: userTimezone || 'NA',
        senderName: senderName || 'NA',
        senderMobile: senderMobile || 'NA',
      });

      let sendMsg;

      if (chatInfo?.origin === 'qr') {
        sendMsg = await sendQrMsg({
          msgObj: msgCon,
          to: senderMobile,
          uid: agent ? connectionInfo?.decodedValue?.owner_uid : uid,
          chatInfo,
        });
      } else if (chatInfo?.origin?.toLowerCase() === 'instagram') {
        sendMsg = await sendInstagramMsg({
          msgObj: msgCon,
          to: senderMobile,
          uid: ownerUid,
          chatId: selectedChat.chat_id,
        });
      } else if (['website', 'webchat'].includes(chatInfo.origin?.toLowerCase())) {
        if (type !== 'text')
          return respond({
            success: false,
            msg: 'Website chat currently supports text replies only.',
          });
        sendMsg = { success: true, id: require('crypto').randomUUID(), status: 'available' };
      } else if (['meta', 'whatsapp', 'whatsapp_cloud'].includes(chatInfo.origin?.toLowerCase())) {
        sendMsg = await sendMetaMsg({
          msgObj: msgCon,
          to: senderMobile,
          uid: ownerUid,
          chatId: selectedChat.chat_id,
        });
      }

      if (!sendMsg) return respond({ success: false, msg: 'Unsupported conversation channel.' });
      if (!sendMsg?.success) {
        console.log(sendMsg);
        return respond({ success: false, msg: sendMsg?.msg || 'Message could not be sent.' });
      }

      if (sendMsg?.id) {
        const ownerUid = agent ? connectionInfo?.decodedValue?.owner_uid : uid;
        const chatPath = `${__dirname}/../../conversations/inbox/${ownerUid}/${selectedChat?.chat_id}.json`;
        const msgObjNew = {
          ...msgObj,
          metaChatId: sendMsg.id,
          correlation_id: sendMsg.correlation_id || null,
          origin: chatInfo.origin,
          status: sendMsg.queued ? 'queued' : sendMsg.status || 'sent',
        };
        addObjectToFile(msgObjNew, chatPath);

        const existingChat = await query(
          `SELECT last_reply_by, last_incoming_time FROM chats WHERE chat_id = ? AND uid = ?`,
          [selectedChat?.chat_id, ownerUid],
        );
        if (
          existingChat.length > 0 &&
          existingChat[0].last_reply_by === 'user' &&
          existingChat[0].last_incoming_time
        ) {
          const incomingTime = Number(existingChat[0].last_incoming_time);
          const responseTime = Math.floor((Date.now() - incomingTime) / 1000);
          const slaViolated = responseTime > 300 ? 1 : 0;
          const responderAgentUid = agent ? uid : 'owner';

          await query(
            `INSERT INTO agent_response_logs (uid, agent_uid, chat_id, response_time_seconds, sla_violated) 
             VALUES (?, ?, ?, ?, ?)`,
            [ownerUid, responderAgentUid, selectedChat?.chat_id, responseTime, slaViolated],
          );

          if (slaViolated) {
            await query(
              `UPDATE escalation_queue SET resolved = 1, resolved_at = CURRENT_TIMESTAMP WHERE chat_id = ? AND resolved = 0`,
              [selectedChat?.chat_id],
            );
          }
        }

        await query(
          `UPDATE chats SET last_message_came = ?, last_message = ?, is_opened = ?, last_reply_by = 'agent', last_outgoing_time = ?, sla_violated = 0, sla_expires_at = NULL WHERE chat_id = ? AND uid = ?`,
          [userTimezone, JSON.stringify(msgObjNew), 1, Date.now(), selectedChat?.chat_id, ownerUid],
        );

        // Send the latest chat list to all sockets of the user.
        const socketConnections = getConnectionsByUid(ownerUid) || [];
        socketConnections.forEach(async (socketConn) => {
          const updateChatSocketData = await updateChatListSocket({
            connectionInfo: socketConn,
          });
          sendToSocketId(socketConn.id, updateChatSocketData, 'update_chat_list');
          if (socketConn.data?.selectedChat?.chat_id === selectedChat?.chat_id) {
            sendToSocketId(socketConn.id, { chatId: selectedChat.chat_id }, 'update_conversation');
          }
        });
      }

      return respond({
        success: true,
        id: sendMsg.id,
        queued: Boolean(sendMsg.queued),
        status: sendMsg.queued ? 'queued' : sendMsg.status || 'sent',
      });
    } catch (err) {
      console.error(err);
      return respond({
        success: false,
        msg: 'Message could not be sent. Your draft has been kept.',
      });
    }
  });
}

module.exports = { processSocketEvent };
