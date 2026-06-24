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
  const auditLogs = {
    tagging: {}
  };

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

    // 2. Fetch active chats to get a valid chatId
    console.log('Fetching active chats...');
    const chats = await queryDb('SELECT * FROM chats LIMIT 1');
    if (chats.length < 1) {
      throw new Error('No chats found in database to perform tagging audit.');
    }
    const chatId = chats[0].chat_id;
    console.log(`Auditing tags for chatId: ${chatId}`);

    // 3. Add Tag
    const testTag = `TestTag-${Date.now()}`;
    console.log(`Adding tag "${testTag}" to chat ${chatId}...`);
    const pushRes = await axios.post('http://localhost:3010/api/user/push_tag', {
      chatId,
      tag: testTag
    }, { headers });

    console.log('Push Response:', pushRes.data);

    // Verify in DB
    const dbChatsPush = await queryDb('SELECT * FROM chats WHERE chat_id = $1', [chatId]);
    const tagsAfterPush = dbChatsPush[0]?.chat_tags ? JSON.parse(dbChatsPush[0].chat_tags) : [];
    const isTagAdded = tagsAfterPush.includes(testTag);

    auditLogs.tagging.push = {
      tag: testTag,
      successResponse: pushRes.data.success,
      persistedInDb: isTagAdded,
      allTags: tagsAfterPush
    };

    if (!isTagAdded) {
      throw new Error('Tag was not found in database after push_tag call');
    }

    // 4. Delete Tag
    console.log(`Deleting tag "${testTag}" from chat ${chatId}...`);
    const delRes = await axios.post('http://localhost:3010/api/user/del_tag', {
      chatId,
      tag: testTag
    }, { headers });

    console.log('Del Response:', delRes.data);

    // Verify in DB
    const dbChatsDel = await queryDb('SELECT * FROM chats WHERE chat_id = $1', [chatId]);
    const tagsAfterDel = dbChatsDel[0]?.chat_tags ? JSON.parse(dbChatsDel[0].chat_tags) : [];
    const isTagDeleted = !tagsAfterDel.includes(testTag);

    auditLogs.tagging.delete = {
      successResponse: delRes.data.success,
      persistedInDb: isTagDeleted,
      allTags: tagsAfterDel
    };

    if (!isTagDeleted) {
      throw new Error('Tag was still found in database after del_tag call');
    }

    console.log('✅ Tagging CRUD validation passed successfully!');

  } catch (err) {
    console.error('Tagging audit failed:', err.message);
    auditLogs.error = err.message;
    process.exit(1);
  }

  console.log('\n=== Tagging Audit Summary ===');
  console.log(JSON.stringify(auditLogs, null, 2));
  fs.writeFileSync('tagging_audit_report.json', JSON.stringify(auditLogs, null, 2));
})();
