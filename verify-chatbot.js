require('dotenv').config();
const axios = require('axios');
const { Client } = require('pg');
const fs = require('fs');

const queryDb = async (sql, params = []) => {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'b1gcrm',
    password: process.env.PGPASSWORD || 'CHANGE_ME',
    database: 'b1gcrm'
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
  const auditLogs = {};
  
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

    // 2. Create a temporary visual flow (chatbot requires a saved flow in database!)
    const flowId = `audit-flow-${Date.now()}`;
    const flowTitle = `Audit Flow for Bot ${Date.now()}`;
    const nodes = [{ id: '1', type: 'START', data: { label: 'Start' } }];
    const edges = [];

    console.log(`Creating flow: ${flowTitle} (ID: ${flowId})...`);
    const flowCreateRes = await axios.post('http://localhost:3010/api/chat_flow/add_new', {
      title: flowTitle,
      flowId,
      nodes,
      edges
    }, { headers });

    // Fetch the flow ID from DB
    const dbFlows = await queryDb('SELECT * FROM flow WHERE flow_id = $1', [flowId]);
    if (dbFlows.length < 1) {
      throw new Error('Flow row was not created in PG');
    }
    const flowDbRow = dbFlows[0];

    // 3. Create Chatbot binding that flow
    const botTitle = `Audit Chatbot ${Date.now()}`;
    console.log(`Creating chatbot: ${botTitle} ...`);
    const chatbotCreateRes = await axios.post('http://localhost:3010/api/chatbot/add_chatbot', {
      title: botTitle,
      flow: {
        id: flowDbRow.id,
        flow_id: flowId,
        title: flowTitle
      },
      for_all: true,
      chats: [],
      origin: { code: 'META', data: {} }
    }, { headers });

    console.log('Create response:', chatbotCreateRes.data);

    // Verify DB entry
    const dbBots = await queryDb('SELECT * FROM chatbot WHERE flow_id = $1', [flowId]);
    console.log('DB bots match:', dbBots);

    auditLogs.create = {
      title: botTitle,
      successResponse: chatbotCreateRes.data.success,
      persistedInDb: dbBots.length > 0,
      row: dbBots[0] || null
    };

    if (dbBots.length < 1) {
      throw new Error('Chatbot row not found in PostgreSQL chatbot table');
    }

    const botId = dbBots[0].id;

    // 4. Disable Chatbot
    console.log('Disabling chatbot active state...');
    const disableRes = await axios.post('http://localhost:3010/api/chatbot/change_bot_status', {
      id: botId,
      status: false
    }, { headers });

    const dbBotsAfterDisable = await queryDb('SELECT * FROM chatbot WHERE id = $1', [botId]);
    console.log('DB active flag after disable:', dbBotsAfterDisable[0]?.active);

    auditLogs.disable = {
      successResponse: disableRes.data.success,
      activeValInDb: dbBotsAfterDisable[0]?.active
    };

    // 5. Enable Chatbot
    console.log('Enabling chatbot active state...');
    const enableRes = await axios.post('http://localhost:3010/api/chatbot/change_bot_status', {
      id: botId,
      status: true
    }, { headers });

    const dbBotsAfterEnable = await queryDb('SELECT * FROM chatbot WHERE id = $1', [botId]);
    console.log('DB active flag after enable:', dbBotsAfterEnable[0]?.active);

    auditLogs.enable = {
      successResponse: enableRes.data.success,
      activeValInDb: dbBotsAfterEnable[0]?.active
    };

    // 6. Read chatbot config
    console.log('Reading chatbot rule configurations...');
    const getRes = await axios.get('http://localhost:3010/api/chatbot/get_chatbot', { headers });
    console.log('Read response chatbots count:', getRes.data.data.length);
    auditLogs.read = {
      success: getRes.data.success,
      count: getRes.data.data.length,
      containsAuditBot: getRes.data.data.some(b => b.title === botTitle)
    };

    // 7. Delete Chatbot
    console.log('Deleting chatbot...');
    const deleteRes = await axios.post('http://localhost:3010/api/chatbot/del_chatbot', {
      id: botId
    }, { headers });

    console.log('Delete response:', deleteRes.data);

    // Verify DB deletion
    const dbBotsAfterDelete = await queryDb('SELECT * FROM chatbot WHERE id = $1', [botId]);
    console.log('DB bots count after delete:', dbBotsAfterDelete.length);

    auditLogs.delete = {
      successResponse: deleteRes.data.success,
      removedFromDb: dbBotsAfterDelete.length === 0
    };

    // 8. Delete temporary flow
    console.log('Cleaning up temporary flow...');
    await axios.post('http://localhost:3010/api/chat_flow/del_flow', {
      id: flowDbRow.id,
      flowId
    }, { headers });

  } catch (err) {
    console.error('Chatbot audit failed:', err.message);
    auditLogs.error = err.message;
  }

  console.log('\n=== Chatbot Audit Summary ===');
  console.log(JSON.stringify(auditLogs, null, 2));
  fs.writeFileSync('chatbot_audit_report.json', JSON.stringify(auditLogs, null, 2));
})();
