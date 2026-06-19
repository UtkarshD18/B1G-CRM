const axios = require('axios');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const queryDb = async (sql, params = []) => {
  const client = new Client({
    host: process.env.PGHOST || '127.0.0.1',
    port: 5432,
    user: process.env.PGUSER || 'b1gcrm',
    password: process.env.PGPASSWORD || 'CHANGE_ME',
    database: process.env.PGDATABASE || 'b1gcrm'
  });
  await client.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows;
  } finally {
    await client.end();
  }
};

(async () => {
  const inboxLogs = {};
  const tenantUid = 'local-user-uid';
  const instaChatId = 'test-insta-chat-id-999';

  try {
    // 1. Authenticate to get JWT token
    console.log('Logging in as User...');
    const loginRes = await axios.post('http://localhost:3010/api/user/login', {
      email: 'user@example.com',
      password: process.env.TEST_USER_PASSWORD || 'CHANGE_ME'
    });

    const token = loginRes.data.token;
    if (!token) {
      throw new Error('Failed to login, token not returned');
    }
    const headers = { Authorization: `Bearer ${token}` };

    // 2. Link mock Instagram account
    console.log('Linking Instagram account...');
    await axios.post('http://localhost:3010/api/instagram/save_keys', {
      instagram_business_account_id: 'insta-business-acct-mock',
      access_token: 'example-token',
      username: 'insta_inbox_test',
      name: 'Inbox Test Instagram',
      app_id: 'mock-app-id-123'
    }, { headers });

    // 3. Initialize Instagram chat thread in DB & file history
    console.log('Initializing mock Instagram chat thread in database...');
    await queryDb(
      `INSERT INTO chats (chat_id, uid, last_message_came, sender_name, sender_mobile, last_message, is_opened, origin)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (chat_id, uid) DO UPDATE 
       SET last_message_came = EXCLUDED.last_message_came, last_message = EXCLUDED.last_message, origin = EXCLUDED.origin`,
      [
        instaChatId,
        tenantUid,
        Math.round(Date.now() / 1000),
        'Insta Inbox User',
        instaChatId,
        JSON.stringify({ type: 'text', msgContext: { type: 'text', text: { body: 'Hello inbox test' } }, route: 'INCOMING' }),
        1,
        'instagram'
      ]
    );

    // Initialize conversation JSON file on disk
    const conversationsDir = path.resolve(__dirname, `conversations/inbox/${tenantUid}`);
    if (!fs.existsSync(conversationsDir)) {
      fs.mkdirSync(conversationsDir, { recursive: true });
    }
    const chatFilePath = path.join(conversationsDir, `${instaChatId}.json`);
    const initialHistory = [
      {
        type: 'text',
        metaChatId: 'mock-mid-initial',
        msgContext: { type: 'text', text: { body: 'Hello inbox test' } },
        timestamp: Math.round(Date.now() / 1000),
        senderName: 'Insta Inbox User',
        senderMobile: instaChatId,
        status: 'received',
        star: false,
        route: 'INCOMING',
        context: '',
        origin: 'instagram'
      }
    ];
    fs.writeFileSync(chatFilePath, JSON.stringify(initialHistory, null, 2));

    // 4. Retrieve chat lists from backend and verify Instagram chat rendering property
    console.log('Fetching chats list from inbox endpoints...');
    const chatsListRes = await axios.get('http://localhost:3010/api/inbox/get_chats', { headers });
    const chats = chatsListRes.data.data;
    const targetChat = chats.find(c => c.chat_id === instaChatId);

    console.log('Target Instagram Chat Card:', targetChat);
    inboxLogs.getChats = {
      success: chatsListRes.data.success,
      foundTargetChat: !!targetChat,
      originProperty: targetChat?.origin
    };

    if (!targetChat || targetChat.origin !== 'instagram') {
      throw new Error('Instagram chat was not returned by get_chats endpoint, or origin property is not set correctly.');
    }

    // 5. Send Outgoing Text Message
    console.log('Testing send outgoing text message...');
    const sendTextRes = await axios.post('http://localhost:3010/api/inbox/send_text', {
      text: 'Hello, this is an outgoing reply to Instagram!',
      toNumber: instaChatId,
      toName: 'Insta Inbox User',
      chatId: instaChatId
    }, { headers });

    console.log('Send text response:', sendTextRes.data);
    inboxLogs.sendText = sendTextRes.data;

    // 6. Send Outgoing Image Message
    console.log('Testing send outgoing image message...');
    const sendImageRes = await axios.post('http://localhost:3010/api/inbox/send_image', {
      url: 'http://localhost:3010/static/logo.png',
      toNumber: instaChatId,
      toName: 'Insta Inbox User',
      chatId: instaChatId,
      caption: 'Outgoing image reply'
    }, { headers });

    console.log('Send image response:', sendImageRes.data);
    inboxLogs.sendImage = sendImageRes.data;

    // 7. Send Outgoing Video Message
    console.log('Testing send outgoing video message...');
    const sendVideoRes = await axios.post('http://localhost:3010/api/inbox/send_video', {
      url: 'http://localhost:3010/static/video.mp4',
      toNumber: instaChatId,
      toName: 'Insta Inbox User',
      chatId: instaChatId,
      caption: 'Outgoing video reply'
    }, { headers });

    console.log('Send video response:', sendVideoRes.data);
    inboxLogs.sendVideo = sendVideoRes.data;

    // 8. Send Outgoing Document Message
    console.log('Testing send outgoing document message...');
    const sendDocRes = await axios.post('http://localhost:3010/api/inbox/send_doc', {
      url: 'http://localhost:3010/static/document.pdf',
      toNumber: instaChatId,
      toName: 'Insta Inbox User',
      chatId: instaChatId,
      caption: 'Outgoing document reply'
    }, { headers });

    console.log('Send doc response:', sendDocRes.data);
    inboxLogs.sendDoc = sendDocRes.data;

    // 9. Fetch conversation history via get_convo to verify persistence and reload rendering structures
    console.log('Retrieving conversation history to verify persistence...');
    const convoRes = await axios.post('http://localhost:3010/api/inbox/get_convo', { chatId: instaChatId }, { headers });
    const history = convoRes.data.data;
    console.log('Convo history length:', history.length);

    inboxLogs.persistenceVerification = {
      messageCount: history.length,
      initialMessageText: history[0]?.msgContext?.text?.body,
      textReplyText: history[1]?.msgContext?.text?.body,
      imageReplyUrl: history[2]?.msgContext?.image?.link,
      imageCaption: history[2]?.msgContext?.image?.caption,
      videoReplyUrl: history[3]?.msgContext?.video?.link,
      docReplyUrl: history[4]?.msgContext?.document?.link
    };

    if (history.length !== 5) {
      throw new Error(`Expected 5 messages in conversation history, but found ${history.length}`);
    }

    // Verify DB update
    const dbChatsAfterReplies = await queryDb('SELECT * FROM chats WHERE chat_id = $1 AND uid = $2', [instaChatId, tenantUid]);
    const lastMsgDb = JSON.parse(dbChatsAfterReplies[0].last_message);
    console.log('Last message persisted in chats table:', lastMsgDb);
    inboxLogs.lastDbMessagePersisted = lastMsgDb.type === 'document';

    // 10. Clean up
    console.log('Cleaning up tests...');
    await queryDb('DELETE FROM chats WHERE chat_id = $1 AND uid = $2', [instaChatId, tenantUid]);
    if (fs.existsSync(chatFilePath)) {
      fs.unlinkSync(chatFilePath);
    }
    await axios.post('http://localhost:3010/api/instagram/disconnect', {}, { headers });

  } catch (err) {
    console.error('Instagram inbox verification failed:', err.message);
    inboxLogs.error = err.message;
  }

  console.log('\n=== Instagram Inbox Verification Summary ===');
  console.log(JSON.stringify(inboxLogs, null, 2));
  fs.writeFileSync(path.join(__dirname, 'verify-instagram-inbox.json'), JSON.stringify(inboxLogs, null, 2));
})();
