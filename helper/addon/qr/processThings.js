const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const randomstring = require('randomstring');
const path = require('path');
const moment = require('moment');
const { query } = require('../../../database/dbpromise');
const { getConnectionsByUid, sendToSocketId, sendRingToUid } = require('../../../socket');
const { mergeArraysWithPhonebook } = require('../../socket/function');
const mime = require('mime-types');
const { fetchProfileUrl, fetchPersonPresence } = require('./control');
const env = require('../../../env');

function timeoutPromise(promise, ms) {
  const timeout = new Promise(
    (resolve) => setTimeout(() => resolve(null), ms), // Instead of rejecting, resolve null
  );
  return Promise.race([promise, timeout]);
}

// updating profile image
async function updateProfileMysql({ chatId, uid, getSession, remoteJid, sessionId }) {
  try {
    const isGroup = remoteJid.includes('@g.us') ? true : false;
    if (isGroup) return;

    let profileImg;
    const session = await timeoutPromise(getSession(sessionId || 'a'), 60000);
    if (session) {
      const image = await fetchProfileUrl(session, remoteJid);
      // const presence = await fetchPersonPresence(
      //   session,
      //   `918126458934@s.whatsapp.net`
      // );
      // console.log({ presence: presence });
      if (!image) return;

      const [chat] = await query(`SELECT profile FROM chats WHERE uid = ? AND chat_id = ?`, [
        uid,
        chatId,
      ]);

      const profile = chat?.profile
        ? { ...JSON.parse(chat.profile), profileImage: image }
        : { profileImage: image };

      await query(`UPDATE chats SET profile = ? WHERE uid = ? AND chat_id = ?`, [
        JSON.stringify(profile),
        uid,
        chatId,
      ]);
    }
  } catch (err) {
    console.log('error in updating profile image', err);
  }
}

// -----------------------------------------------------------------------------
// Update or insert a chat into PostgreSQL.
async function updateChatInMysql({
  chatId,
  uid,
  senderName,
  senderMobile,
  actualMsg,
  sessionId,
  getSession,
  jid,
}) {
  const allowedMessageTypes = ['text', 'image', 'document', 'video', 'audio'];

  updateProfileMysql({
    chatId,
    uid,
    getSession,
    remoteJid: jid,
    sessionId,
  });

  // Fetch user details. Exit early if not found.
  const [user] = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);
  if (!user) return;

  // Ensure contact exists to maintain consistency
  if (senderMobile && senderMobile !== 'NA') {
    const checkContact = await query(`SELECT * FROM contact WHERE uid = ? AND mobile = ?`, [
      uid,
      senderMobile,
    ]);
    if (checkContact.length === 0) {
      const pbName = 'WhatsApp QR Ingest';
      let pbId;
      const existingPb = await query(`SELECT * FROM phonebook WHERE uid = ? AND name = ?`, [
        uid,
        pbName,
      ]);
      if (existingPb.length > 0) {
        pbId = existingPb[0].id;
      } else {
        const insertPb = await query(
          `INSERT INTO phonebook (uid, name) VALUES (?, ?) RETURNING id`,
          [uid, pbName],
        );
        if (insertPb && insertPb.length > 0) {
          pbId = insertPb[0].id;
        } else {
          const getPb = await query(`SELECT id FROM phonebook WHERE uid = ? AND name = ?`, [
            uid,
            pbName,
          ]);
          pbId = getPb[0]?.id;
        }
      }
      await query(
        `INSERT INTO contact (uid, phonebook_id, phonebook_name, name, mobile, var1) VALUES (?, ?, ?, ?, ?, ?)`,
        [uid, pbId, pbName, senderName || 'QR Contact', senderMobile, 'Auto Created via QR Ingest'],
      );
    }
  }

  const userTimezone = getCurrentTimestampInTimeZone(user?.timezone || Date.now() / 1000);
  const shouldUpdateTimestamp =
    allowedMessageTypes.includes(actualMsg?.type) && actualMsg?.route === 'INCOMING';

  // Check if chat exists.
  const [chat] = await query(`SELECT * FROM chats WHERE chat_id = ? AND uid = ?`, [chatId, uid]);

  if (chat) {
    // Prepare dynamic update fields.
    const queryFields = [];
    const queryValues = [];

    if (shouldUpdateTimestamp) {
      queryFields.push('last_message_came = ?');
      queryValues.push(userTimezone);
    }
    queryFields.push('last_message = ?', 'is_opened = ?');
    queryValues.push(JSON.stringify(actualMsg), 0);
    // Append WHERE clause values.
    queryValues.push(chatId, uid);

    await query(
      `UPDATE chats SET ${queryFields.join(', ')} WHERE chat_id = ? AND uid = ?`,
      queryValues,
    );
  } else {
    const sessionData = getSession(sessionId);
    const userData = sessionData?.authState?.creds?.me || sessionData.user;
    // Insert new chat record.
    await query(
      `INSERT INTO chats (chat_id, uid, last_message_came, other, sender_name, sender_mobile, last_message, is_opened, origin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        chatId,
        uid,
        shouldUpdateTimestamp ? userTimezone : null,
        JSON.stringify(userData),
        senderName || 'NA',
        senderMobile || 'NA',
        JSON.stringify(actualMsg),
        0,
        'qr',
      ],
    );
  }
}

// -----------------------------------------------------------------------------
// Returns the current timestamp in seconds using the provided timezone info.
function getCurrentTimestampInTimeZone(timezone) {
  if (typeof timezone === 'number') {
    return timezone;
  } else if (typeof timezone === 'string') {
    const currentTimeInZone = moment.tz(timezone);
    return Math.round(currentTimeInZone.valueOf() / 1000);
  }
  return Math.round(Date.now() / 1000);
}

function saveImageToFile(imageBuffer, filePath, mimetype) {
  try {
    // Save the image buffer to a file
    fs.writeFileSync(filePath, imageBuffer);

    console.log(`${mimetype || 'IMG'} saved successfully as ${filePath}`);
  } catch (error) {
    console.error(`Error saving image: ${error.message}`);
  }
}

// -----------------------------------------------------------------------------
// Download media and save it to file. Returns an object with success and fileName.
function downloadMediaPromise(m, mimetype) {
  return new Promise(async (resolve) => {
    try {
      const bufferMsg = await downloadMediaMessage(m, 'buffer', {}, {});
      const randomSt = randomstring.generate(6);
      const mimeType = mime.extension(mimetype);
      const fileName = `${randomSt}_qr.${mimeType}`;
      const filePath = `${__dirname}/../../../client/public/meta-media/${fileName}`;

      saveImageToFile(bufferMsg, filePath, mimetype);

      resolve({ success: true, fileName });
    } catch (err) {
      console.log(err);
      resolve({ err, success: false });
    }
  });
}

function extractPhoneNumber(str) {
  if (!str) return null;
  const match = str.match(/^(\d+)(?=:|\@)/);
  return match ? match[1] : null;
}

// -----------------------------------------------------------------------------
// Extract chatId from the message body.
function getChatId(body, sessionId) {
  try {
    const number = extractPhoneNumber(body.key.remoteJid);
    if (!number) return null;
    return `${number}_${sessionId}`;
  } catch (error) {
    return null;
  }
}

// -----------------------------------------------------------------------------
// Process incoming Baileys messages and update conversation file.
async function processBaileysMsg({ body, uid, userFromMysql, conversationPath }) {
  try {
    if (!body) return null;

    // --- Status Update Handling ---
    if (body.update && typeof body.update.status === 'number') {
      // Only update status if the message is outgoing.
      if (!body.key?.fromMe) {
        console.log(`Status update for incoming message ${body.key.id} ignored.`);
        const { validatePath } = require('../../../utils/pathSafe');
        const rootInboxDir = path.resolve(__dirname, '../../../conversations/inbox');
        const cleanConvoPath = validatePath(
          rootInboxDir,
          path.relative(rootInboxDir, conversationPath),
        );
        if (!cleanConvoPath) {
          return null;
        }
        let conversationArray = [];
        if (fs.existsSync(cleanConvoPath)) {
          const fileContent = fs.readFileSync(cleanConvoPath, 'utf-8');
          conversationArray = JSON.parse(fileContent);
        }
        const latestMessages = conversationArray.slice(-10);
        return { newMessage: null, latestMessages };
      }

      // Mapping: 2 → "sent", 3 → "delivered", 4 → "read"
      const statusMapping = { 2: 'sent', 3: 'delivered', 4: 'read' };
      // Reverse mapping to compare numeric values.
      const reverseStatusMapping = { sent: 2, delivered: 3, read: 4 };
      const newStatusNumber = body.update.status;
      const newStatus = statusMapping[newStatusNumber] || '';

      console.log(
        `Status update received for message id ${body.key.id}: new status number ${newStatusNumber} (${newStatus})`,
      );

      // Ensure conversation directory exists.
      const directoryPath = path.dirname(conversationPath);
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
        console.log('Created conversation directory:', directoryPath);
      }

      let conversationArray = [];
      if (fs.existsSync(conversationPath)) {
        const fileContent = fs.readFileSync(conversationPath, 'utf-8');
        conversationArray = JSON.parse(fileContent);
      } else {
        console.warn('Conversation file does not exist for status update.');
        // Return structure with no new message and empty latestMessages.
        return { newMessage: null, latestMessages: [] };
      }

      // Find the message to update.
      const index = conversationArray.findIndex((msg) => msg.metaChatId === body.key.id);
      if (index !== -1) {
        const currentStatusStr = conversationArray[index].status;
        const currentStatusNumber = currentStatusStr
          ? reverseStatusMapping[currentStatusStr] || 0
          : 0;
        if (newStatusNumber > currentStatusNumber) {
          console.log(
            `Updating status for message ${body.key.id} from ${
              currentStatusStr || 'none'
            } to ${newStatus}`,
          );
          conversationArray[index].status = newStatus;
        } else {
          console.log(
            `Not updating status for message ${body.key.id} because current status (${currentStatusStr}) is higher or equal than new status (${newStatus}).`,
          );
        }
        fs.writeFileSync(cleanConvoPath, JSON.stringify(conversationArray, null, 2));
      } else {
        console.warn('No message found with metaChatId:', body.key.id, 'to update status.');
      }
      const latestMessages = conversationArray.slice(-10);
      return { newMessage: null, latestMessages };
    }
    // --- End Status Update Handling ---

    let msgContext = null;
    let referencedMessageData = null; // For reply/quoted messages.

    // Determine message type.
    if (body.message.conversation) {
      // Plain text message.
      msgContext = {
        type: 'text',
        text: {
          body: body.message.conversation,
          preview_url: true,
        },
      };
    } else if (body.message.extendedTextMessage) {
      // Extended (quoted) text message.
      const extText = body.message.extendedTextMessage;
      msgContext = {
        type: 'text',
        text: {
          body: extText.text,
          preview_url: true,
        },
      };
      if (extText.contextInfo?.quotedMessage) {
        referencedMessageData = extText.contextInfo.quotedMessage;
      }
    } else if (body.message.imageMessage) {
      // Image message.
      const img = body.message.imageMessage;
      const downloadResult = await downloadMediaPromise(body, img.mimetype);
      msgContext = {
        type: 'image',
        image: {
          link: `${env.FRONTEND_URL}/meta-media/${
            downloadResult.success ? downloadResult.fileName : ''
          }`,
          caption: img.caption || '',
        },
      };
    } else if (body.message.videoMessage) {
      // Video message.
      const vid = body.message.videoMessage;
      const downloadResult = await downloadMediaPromise(body, vid.mimetype);
      msgContext = {
        type: 'video',
        video: {
          link: `${env.FRONTEND_URL}/meta-media/${
            downloadResult.success ? downloadResult.fileName : ''
          }`,
          caption: vid.caption || '',
        },
      };
    } else if (body.message.audioMessage) {
      // Audio message.
      const aud = body.message.audioMessage;
      const downloadResult = await downloadMediaPromise(body, aud.mimetype);
      msgContext = {
        type: 'audio',
        audio: {
          link: `${env.FRONTEND_URL}/meta-media/${
            downloadResult.success ? downloadResult.fileName : ''
          }`,
        },
      };
    } else if (body.message.locationMessage) {
      // location message.
      msgContext = {
        type: 'location',
        location: {
          latitude: body.message?.locationMessage?.degreesLatitude,
          longitude: body.message?.locationMessage?.degreesLongitude,
          name: body.message?.locationMessage?.name,
          address: body.message?.locationMessage?.address,
        },
      };
    } else if (body.message.documentWithCaptionMessage) {
      // Document message (pdf, js, sql, csv, etc.)
      const doc = body.message.documentWithCaptionMessage.message.documentMessage;
      const downloadResult = await downloadMediaPromise(
        body,
        body?.message?.documentWithCaptionMessage?.message?.documentMessage?.mimetype?.replace(
          'application/x-javascript',
          'application/javascript',
        ),
      );
      msgContext = {
        type: 'document',
        document: {
          link: `${env.FRONTEND_URL}/meta-media/${
            downloadResult.success ? downloadResult.fileName : ''
          }`,
          caption: doc.caption || doc.title || '',
        },
      };
      if (doc.contextInfo?.quotedMessage) {
        referencedMessageData = doc.contextInfo.quotedMessage;
      }
    } else {
      console.warn('Unsupported message type in Baileys webhook');
      return null;
    }

    const { validatePath } = require('../../../utils/pathSafe');
    const rootInboxDir = path.resolve(__dirname, '../../../conversations/inbox');
    const cleanConvoPath = validatePath(
      rootInboxDir,
      path.relative(rootInboxDir, conversationPath),
    );
    if (!cleanConvoPath) {
      return null;
    }

    // Ensure conversation directory exists.
    const directoryPath = path.dirname(cleanConvoPath);
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    // Read or initialize the conversation file.
    let conversationArray = [];
    if (fs.existsSync(cleanConvoPath)) {
      const fileContent = fs.readFileSync(cleanConvoPath, 'utf-8');
      conversationArray = JSON.parse(fileContent);
    } else {
      fs.writeFileSync(cleanConvoPath, JSON.stringify([], null, 2));
    }

    // Determine context from quoted message if available.
    let contextData = '';
    if (referencedMessageData?.stanzaId) {
      const refId = referencedMessageData.stanzaId;
      const foundMsg = conversationArray.find((msg) => msg.metaChatId === refId);
      contextData = foundMsg || referencedMessageData;
    } else if (referencedMessageData) {
      contextData = referencedMessageData;
    }

    // Create the new message object.
    const newMessage = {
      type: msgContext.type,
      metaChatId: body.key.id,
      msgContext,
      reaction: '',
      timestamp: getCurrentTimestampInTimeZone(userFromMysql?.timezone || body.messageTimestamp),
      senderName: body.pushName || 'NA',
      senderMobile: body.key.remoteJid ? body.key.remoteJid.split('@')[0] : 'NA',
      status: '', // Initially empty; updated later via status updates.
      star: false,
      route: body.key?.fromMe ? 'OUTGOING' : 'INCOMING',
      context: contextData,
      origin: 'qr',
    };

    // Append new message and update the conversation file if not already present.
    const exists = conversationArray.some((msg) => msg.metaChatId === body.key.id);
    if (!exists) {
      conversationArray.push(newMessage);
      fs.writeFileSync(cleanConvoPath, JSON.stringify(conversationArray, null, 2));
    }

    // Retrieve the latest 10 messages.
    const latestMessages = conversationArray.slice(-10);
    return { newMessage: exists ? null : newMessage, latestMessages };
  } catch (err) {
    console.error('Error processing Baileys message:', err.message);
    return null;
  }
}

// -----------------------------------------------------------------------------
// Retrieve user details based on sessionId.
async function getUserDetails(sessionId) {
  try {
    const [instance] = await query(`SELECT * FROM instance WHERE uniqueId = ?`, [sessionId]);
    if (!instance) return null;

    const [user] = await query(`SELECT * FROM user WHERE uid = ?`, [instance.uid]);
    if (!user) return null;

    return { ...user, instance };
  } catch (err) {
    console.error('getUserDetails error:', err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// Process QR message: validate, update conversation & chat list, and notify sockets.
async function processMessageQr({ type, message, sessionId, getSession, userData, uid }) {
  try {
    type === 'update' && console.log('UPDATE ARRIVED');

    const userDetails = await getUserDetails(sessionId);
    if (!userDetails) {
      console.log('userDetails is null');
      return;
    }

    // Build conversation path using extracted chatId.
    const chatId = getChatId(message, sessionId);
    const { validatePath } = require('../../../utils/pathSafe');
    const rootInboxDir = path.resolve(__dirname, '../../../conversations/inbox');
    const conversationPath = validatePath(rootInboxDir, `${uid}/${chatId}.json`);
    if (!conversationPath) {
      return null;
    }

    const data = await processBaileysMsg({
      body: message,
      uid: uid,
      userFromMysql: userData,
      conversationPath,
      getSession,
    });

    // Update chat in PostgreSQL with the latest message.
    if (data?.latestMessages?.length > 0) {
      const { latestMessages, newMessage } = data;
      const lastObj = latestMessages[latestMessages.length - 1];
      await updateChatInMysql({
        chatId,
        uid: uid,
        senderName: lastObj.senderName,
        senderMobile: lastObj.senderMobile,
        actualMsg: lastObj,
        sessionId,
        getSession,
        jid: message?.remoteJid || message?.key?.remoteJid,
      });
    }

    return data;

    // // Notify all socket connections with updated chat list.
    // const socketConnections = getConnectionsByUid(userDetails.uid) || [];
    // for (const socket of socketConnections) {
    //   const updateChatSocketData = await updateChatListSocket({
    //     connectionInfo: socket,
    //   });
    //   sendToSocketId(socket.id, updateChatSocketData, "update_chat_list");
    //   console.log("Chat update sent to socket");
    // }

    // sendRingToUid(userDetails.uid);

    // // Send conversation update to the socket if it matches the currently open chat.
    // for (const socket of socketConnections) {
    //   const openedChat = socket.data?.selectedChat || null;
    //   if (
    //     openedChat?.sender_mobile === newMessage?.senderMobile ||
    //     openedChat?.sender_mobile === latestMessages[0]?.senderMobile
    //   ) {
    //     sendToSocketId(
    //       socket.id,
    //       { conversation: data },
    //       "update_conversation"
    //     );
    //   }
    // }
  } catch (err) {
    console.error('processMessageQr error:', err);
    return null;
  }
}

module.exports = {
  processMessageQr,
};
