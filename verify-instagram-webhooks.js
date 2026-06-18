const axios = require('axios');
const { Client } = require('pg');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const queryDb = async (sql, params = []) => {
  const client = new Client({
    host: process.env.PGHOST || '127.0.0.1',
    port: 5432,
    user: process.env.PGUSER || 'b1gcrm',
    password: process.env.PGPASSWORD || 'b1gcrm_local_dev',
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
  const verificationLogs = {};
  const tenantUid = 'local-user-uid';

  try {
    // 1. Authenticate to get JWT token
    console.log('Logging in as User...');
    const loginRes = await axios.post('http://localhost:3010/api/user/login', {
      email: 'user@example.com',
      password: '<PASSWORD>'
    });

    const token = loginRes.data.token;
    if (!token) {
      throw new Error('Failed to login, token not returned');
    }
    const headers = { Authorization: `Bearer ${token}` };

    // 2. Link mock Instagram account keys
    console.log('Linking mock Instagram account keys...');
    const saveKeysRes = await axios.post('http://localhost:3010/api/instagram/save_keys', {
      instagram_business_account_id: 'insta-business-acct-mock',
      access_token: 'example-token',
      username: 'mock_instagram_business',
      name: 'Mock Instagram Page',
      app_id: 'mock-app-id-123'
    }, { headers });

    console.log('Save keys response:', saveKeysRes.data);
    verificationLogs.linkAccount = saveKeysRes.data;

    // Verify key persistence in DB
    const dbKeys = await queryDb('SELECT * FROM instagram_api WHERE uid = $1', [tenantUid]);
    console.log('DB active Instagram keys:', dbKeys);
    verificationLogs.dbKeysPersisted = dbKeys.length > 0;

    if (dbKeys.length < 1) {
      throw new Error('Instagram API credentials were not stored in database');
    }

    // 3. Webhook subscription verification GET
    console.log('Verifying Instagram Webhook GET handshake...');
    const challengeVal = 'insta-challenge-token-123';
    const verifyGetUrl = `http://localhost:3010/api/instagram/webhook/${tenantUid}?hub.mode=subscribe&hub.verify_token=${tenantUid}&hub.challenge=${challengeVal}`;
    const getHandshakeRes = await axios.get(verifyGetUrl);

    console.log('GET handshake status:', getHandshakeRes.status, 'Body:', getHandshakeRes.data);
    verificationLogs.getHandshake = {
      status: getHandshakeRes.status,
      bodyMatchesChallenge: getHandshakeRes.data === challengeVal
    };

    if (getHandshakeRes.data !== challengeVal) {
      throw new Error('GET Handshake did not return challenge parameter');
    }

    // 4. Create Chatbot automation for Instagram
    // Create flow
    const flowId = `insta-flow-${Date.now()}`;
    const flowTitle = `Instagram Automation Flow`;
    const nodes = [
      { id: '1', type: 'START', data: { label: 'Start' } },
      { id: '2', type: 'TEXT', data: { msgContent: { text: { body: 'Hello from Instagram Bot!' } } } }
    ];
    const edges = [
      { source: '1', sourceHandle: 'trigger', target: '2' }
    ];

    console.log(`Creating chatbot flow: ${flowTitle} (ID: ${flowId})...`);
    await axios.post('http://localhost:3010/api/chat_flow/add_new', {
      title: flowTitle,
      flowId,
      nodes,
      edges
    }, { headers });

    const flowRows = await queryDb('SELECT * FROM flow WHERE flow_id = $1', [flowId]);
    const flowDbRow = flowRows[0];

    // Create chatbot rule
    const botTitle = `Instagram Keyword Bot`;
    console.log('Creating Chatbot rule bound to INSTAGRAM origin...');
    const botCreateRes = await axios.post('http://localhost:3010/api/chatbot/add_chatbot', {
      title: botTitle,
      flow: {
        id: flowDbRow.id,
        flow_id: flowId,
        title: flowTitle
      },
      for_all: true,
      chats: [],
      origin: { code: 'INSTAGRAM', data: {} }
    }, { headers });

    verificationLogs.createChatbot = botCreateRes.data;

    // 5. Simulate an incoming DM POST
    console.log('Sending mock Instagram message event via webhook...');
    const senderPsid = `sender-psid-${Date.now()}`;
    const webhookPayload = {
      object: 'instagram',
      entry: [
        {
          id: 'insta-business-acct-mock',
          time: Date.now(),
          messaging: [
            {
              sender: { id: senderPsid },
              recipient: { id: 'insta-business-acct-mock' },
              timestamp: Date.now(),
              message: {
                mid: `mid-insta-test-${Date.now()}`,
                text: 'trigger'
              }
            }
          ]
        }
      ]
    };

    // Calculate signature using mock app secret 'example-secret'
    const rawBody = JSON.stringify(webhookPayload);
    const signature = 'sha256=' + crypto.createHmac('sha256', 'example-secret').update(rawBody).digest('hex');

    const webhookPostUrl = `http://localhost:3010/api/instagram/webhook/${tenantUid}`;
    const postRes = await axios.post(webhookPostUrl, webhookPayload, {
      headers: {
        'X-Hub-Signature-256': signature,
        'Content-Type': 'application/json'
      }
    });

    console.log('Webhook POST response status:', postRes.status);
    verificationLogs.webhookPostStatus = postRes.status;

    // Wait a brief moment for async socket and chatbot operations to complete
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Verify chat entry was created in database
    console.log('Checking database chats table for Instagram origin chat...');
    const dbChats = await queryDb('SELECT * FROM chats WHERE chat_id = $1 AND uid = $2', [senderPsid, tenantUid]);
    console.log('DB Chat entry:', dbChats[0]);

    verificationLogs.chatPersisted = dbChats.length > 0 && dbChats[0].origin === 'instagram';

    if (dbChats.length < 1) {
      throw new Error('Chat thread row was not created in database for Instagram message');
    }

    // Verify conversation JSON history file exists
    const chatFilePath = path.join(__dirname, `conversations/inbox/${tenantUid}/${senderPsid}.json`);
    const fileExists = fs.existsSync(chatFilePath);
    console.log('Conversation file exists:', fileExists);
    verificationLogs.fileHistoryPersisted = fileExists;

    if (fileExists) {
      const history = JSON.parse(fs.readFileSync(chatFilePath, 'utf8'));
      console.log('Conversation history message count:', history.length);
      console.log('Last message:', history[history.length - 1]);
      verificationLogs.incomingMessageText = history[0]?.msgContext?.text?.body;
    } else {
      throw new Error('Conversation JSON history file not found on disk: ' + chatFilePath);
    }

    // Verify chatbot trigger execution logs
    console.log('Checking chatbot execution logs in database...');
    const chatbotLogs = await queryDb('SELECT * FROM chatbot_log WHERE uid = $1 AND sender_number = $2', [tenantUid, senderPsid]);
    console.log('Chatbot trigger logs count:', chatbotLogs.length);
    verificationLogs.chatbotTriggered = chatbotLogs.length > 0 && chatbotLogs[0].status === 'matched';

    if (chatbotLogs.length > 0) {
      console.log('Chatbot log status:', chatbotLogs[0].status, 'matched keyword:', chatbotLogs[0].incoming_message);
    } else {
      throw new Error('Chatbot execution log was not recorded in DB');
    }

    // 6. Clean up resources
    console.log('Cleaning up chatbot, flow, and disconnecting Instagram...');
    const chatbotFromDb = await queryDb('SELECT * FROM chatbot WHERE title = $1 AND uid = $2', [botTitle, tenantUid]);
    if (chatbotFromDb.length > 0) {
      await axios.post('http://localhost:3010/api/chatbot/del_chatbot', { id: chatbotFromDb[0].id }, { headers });
    }
    if (flowDbRow) {
      await axios.post('http://localhost:3010/api/chat_flow/del_flow', { id: flowDbRow.id, flowId }, { headers });
    }
    await axios.post('http://localhost:3010/api/instagram/disconnect', {}, { headers });

    const dbKeysAfterDisconnect = await queryDb('SELECT * FROM instagram_api WHERE uid = $1', [tenantUid]);
    verificationLogs.cleanupDisconnectSuccess = dbKeysAfterDisconnect.length === 0;

  } catch (err) {
    console.error('Instagram Webhooks verification failed:', err.message);
    verificationLogs.error = err.message;
  }

  console.log('\n=== Instagram Webhooks & Chatbot Verification Summary ===');
  console.log(JSON.stringify(verificationLogs, null, 2));
  fs.writeFileSync(path.join(__dirname, 'verify-instagram-webhooks.json'), JSON.stringify(verificationLogs, null, 2));
})();
