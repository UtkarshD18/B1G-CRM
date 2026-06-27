const router = require('express').Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const randomstring = require('randomstring');
const { query } = require('../database/dbpromise');
const { validateUserOrAgent, verifyPermission } = require('../middlewares/auth');
const env = require('../env');
const { getIOInstance, getConnectionsByUid, sendToSocketId, sendRingToUid } = require('../socket');
const { updateChatListSocket } = require('../helper/inbox/inbox');
const { metaChatbotInit } = require('../helper/chatbot/meta/index');
const { processWebhookRules } = require('../helper/webhooks/engine');
const { addObjectToFile } = require('../functions/function');

// Helper to calculate user timezone timestamp
function getCurrentTimestampInTimeZone(timezone) {
  return Math.round(
    moment()
      .tz(timezone || 'Asia/Kolkata')
      .valueOf() / 1000,
  );
}

// 1. Get Instagram Business Account Credentials
router.get(
  '/get_keys',
  validateUserOrAgent,
  verifyPermission('settings_access'),
  async (req, res) => {
    try {
      const [keys] = await query('SELECT * FROM instagram_api WHERE uid = ?', [req.decode.uid]);
      res.json({ success: true, data: keys || null });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, msg: 'Database error' });
    }
  },
);

// 2. Connect / Save Instagram Business Account Credentials
router.post(
  '/save_keys',
  validateUserOrAgent,
  verifyPermission('settings_access'),
  async (req, res) => {
    try {
      const { instagram_business_account_id, access_token, username, name, app_id } = req.body;

      if (!instagram_business_account_id || !access_token || !username) {
        return res.json({ success: false, msg: 'Missing required Instagram fields.' });
      }

      const [existing] = await query('SELECT * FROM instagram_api WHERE uid = ?', [req.decode.uid]);

      if (existing) {
        await query(
          `UPDATE instagram_api 
         SET instagram_business_account_id = ?, access_token = ?, username = ?, name = ?, app_id = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE uid = ?`,
          [
            instagram_business_account_id,
            access_token,
            username,
            name || username,
            app_id || '',
            req.decode.uid,
          ],
        );
      } else {
        await query(
          `INSERT INTO instagram_api (uid, instagram_business_account_id, access_token, username, name, app_id) 
         VALUES (?, ?, ?, ?, ?, ?)`,
          [
            req.decode.uid,
            instagram_business_account_id,
            access_token,
            username,
            name || username,
            app_id || '',
          ],
        );
      }

      res.json({ success: true, msg: 'Instagram credentials connected successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, msg: 'Database error' });
    }
  },
);

// 3. Disconnect Instagram
router.post(
  '/disconnect',
  validateUserOrAgent,
  verifyPermission('settings_access'),
  async (req, res) => {
    try {
      await query('DELETE FROM instagram_api WHERE uid = ?', [req.decode.uid]);
      res.json({ success: true, msg: 'Instagram account disconnected.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, msg: 'Database error' });
    }
  },
);

// 4. Webhook Verification (Challenge handshake)
router.get('/webhook/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const [user] = await query('SELECT * FROM user WHERE uid = ?', [uid]);
    if (!user) {
      return res.status(404).send('User not found');
    }

    if (mode && token) {
      if (mode === 'subscribe' && token === uid) {
        if (!challenge || !/^[a-zA-Z0-9_-]+$/.test(challenge)) {
          return res.status(400).send('Invalid challenge format');
        }
        console.log('Instagram Webhook verified successfully for tenant:', uid);
        return res.status(200).send(challenge);
      } else {
        return res.sendStatus(403);
      }
    }
    res.status(400).send('Bad Request');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// 5. Webhook Message Receiver
router.post('/webhook/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const signature = req.headers['x-hub-signature-256'];

    // Validate Signature if App Secret is set
    const appSecret = process.env.INSTAGRAM_APP_SECRET || 'example-secret';
    if (signature) {
      const parts = signature.split('=');
      const hash = parts[1];
      const rawBody = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
      const expectedHash = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

      if (hash !== expectedHash) {
        console.warn('Instagram Webhook signature validation failed.');
        // We can allow bypassing signature check in mock mode to make testing easy
        if (!env.MOCK_META_DELIVERY) {
          return res.status(401).send('Invalid signature');
        }
      }
    }

    // Acknowledge Meta Hook quickly
    const [conn] = await query(
      `SELECT * FROM channel_connections WHERE uid = ? AND channel_type = 'instagram'`,
      [uid],
    );
    if (conn) {
      await query(
        `INSERT INTO channel_incoming_queue (uid, channel_type, payload) VALUES (?, 'instagram', ?)`,
        [uid, JSON.stringify(req.body)],
      );
      return res.sendStatus(200);
    }

    res.sendStatus(200);

    const body = req.body;
    if (body.object !== 'instagram' || !body.entry) {
      return;
    }

    const entry = body.entry[0];
    const messaging = entry?.messaging?.[0];
    if (!messaging || !messaging.message) {
      return;
    }

    const senderId = messaging.sender?.id;
    const recipientId = messaging.recipient?.id;
    const message = messaging.message;

    // Retrieve access token to lookup profile / verify connection
    const [api] = await query('SELECT * FROM instagram_api WHERE uid = ?', [uid]);
    if (!api) {
      return;
    }

    let senderName = 'Instagram Contact';
    let profilePic = '';

    // If actual integration and credentials are real
    if (!env.MOCK_META_DELIVERY && api.access_token && !api.access_token.startsWith('mock_')) {
      try {
        const fetch = require('node-fetch');
        const profileRes = await fetch(
          `https://graph.facebook.com/v19.0/${senderId}?fields=name,profile_pic&access_token=${api.access_token}`,
        );
        const profileData = await profileRes.json();
        if (profileData?.name) {
          senderName = profileData.name;
          profilePic = profileData.profile_pic || '';
        }
      } catch (e) {
        console.error('Error looking up Instagram profile:', e.message);
      }
    }

    // Ensure contact exists to maintain consistency
    if (senderId) {
      const checkContact = await query(`SELECT * FROM contact WHERE uid = ? AND mobile = ?`, [
        uid,
        senderId,
      ]);
      if (checkContact.length === 0) {
        const pbName = 'Instagram Ingest';
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
          [
            uid,
            pbId,
            pbName,
            senderName || 'Instagram Contact',
            senderId,
            'Auto Created via Instagram Ingest',
          ],
        );
      }
    }

    // Check if chat thread already exists in B1GCRM
    const [existingChat] = await query('SELECT * FROM chats WHERE chat_id = ? AND uid = ?', [
      senderId,
      uid,
    ]);

    const [user] = await query('SELECT * FROM user WHERE uid = ?', [uid]);
    const userTimezone = getCurrentTimestampInTimeZone(user?.timezone);

    // Formulate the message structure
    let type = 'text';
    let msgContext = { type: 'text', text: { body: message.text || '' } };

    if (message.attachments && message.attachments.length > 0) {
      const att = message.attachments[0];
      type = att.type; // image, video, file, audio
      msgContext = {
        type,
        [type]: {
          link: att.payload?.url,
          caption: message.text || '',
        },
      };
    }

    const newMessage = {
      type,
      metaChatId: message.mid || 'mock-insta-mid-' + randomstring.generate(12),
      msgContext,
      reaction: '',
      timestamp: userTimezone,
      senderName,
      senderMobile: senderId,
      status: 'received',
      star: false,
      route: 'INCOMING',
      context: '',
      origin: 'instagram',
    };

    // Save to conversation JSON file
    const { validatePath } = require('../utils/pathSafe');
    const rootInboxDir = path.resolve(__dirname, '../conversations/inbox');
    const conversationsDir = validatePath(rootInboxDir, uid);
    if (conversationsDir) {
      if (!fs.existsSync(conversationsDir)) {
        fs.mkdirSync(conversationsDir, { recursive: true });
      }
    }
    const chatFilePath = validatePath(rootInboxDir, `${uid}/${senderId}.json`);
    let conversationHistory = [];
    if (chatFilePath && fs.existsSync(chatFilePath)) {
      try {
        conversationHistory = JSON.parse(fs.readFileSync(chatFilePath, 'utf8'));
      } catch (e) {
        console.error('JSON parse error for chat file:', e);
      }
    }
    conversationHistory.push(newMessage);
    fs.writeFileSync(chatFilePath, JSON.stringify(conversationHistory, null, 2));

    // Update or insert into chats table
    if (existingChat) {
      await query(
        `UPDATE chats 
         SET last_message_came = ?, last_message = ?, is_opened = ?, sender_name = ?, profile = ?
         WHERE chat_id = ? AND uid = ?`,
        [userTimezone, JSON.stringify(newMessage), 0, senderName, profilePic, senderId, uid],
      );
    } else {
      await query(
        `INSERT INTO chats (chat_id, uid, last_message_came, sender_name, sender_mobile, last_message, is_opened, origin, profile) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          senderId,
          uid,
          userTimezone,
          senderName,
          senderId,
          JSON.stringify(newMessage),
          0,
          'instagram',
          profilePic,
        ],
      );
    }

    // Push socket updates to user sessions
    const socketConnections = getConnectionsByUid(uid) || [];
    socketConnections.forEach(async (socket) => {
      const chatListData = await updateChatListSocket({ connectionInfo: socket });
      sendToSocketId(socket?.id, chatListData, 'update_chat_list');

      const openedChat = socket?.data?.selectedChat || null;
      if (openedChat?.chat_id === senderId || openedChat?.sender_mobile === senderId) {
        sendToSocketId(
          socket?.id,
          { conversation: { newMessage, latestMessages: conversationHistory.slice(-10) } },
          'update_conversation',
        );
      }
    });

    sendRingToUid(uid);

    // Initialize chatbot rules & triggers
    metaChatbotInit({
      latestConversation: { newMessage, latestMessages: conversationHistory.slice(-10) },
      uid,
      origin: 'instagram',
    });

    // Process webhook rules
    processWebhookRules({
      latestConversation: { newMessage, latestMessages: conversationHistory.slice(-10) },
      uid,
      origin: 'instagram',
    });
  } catch (err) {
    console.error('Instagram receiver error:', err);
  }
});

module.exports = router;
