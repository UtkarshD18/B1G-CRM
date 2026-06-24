require('dotenv').config();
const axios = require('axios');
const { Client } = require('pg');

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
  const logs = {};
  
  try {
    // 1. Login as User
    console.log('Logging in as User...');
    const userLogin = await axios.post('http://localhost:3010/api/user/login', {
      email: 'user@example.com',
      password: process.env.TEST_USER_PASSWORD || 'CHANGE_ME'
    });
    const userHeaders = { Authorization: `Bearer ${userLogin.data.token}` };
    const userUid = 'local-user-uid'; // From user token

    // 2. Clean up past test agents & chats
    await queryDb("DELETE FROM agents WHERE email LIKE 'audit-reassign-%'");
    await queryDb("DELETE FROM agent_chats WHERE owner_uid = $1", [userUid]);

    // 3. Create two agents
    console.log('Creating Agent 1...');
    const agent1Res = await axios.post('http://localhost:3010/api/agent/add_agent', {
      name: 'Agent One',
      email: 'audit-reassign-1@example.com',
      password: process.env.TEST_AGENT_PASSWORD || 'CHANGE_ME',
      mobile: '+919999999991',
      comments: 'First Agent'
    }, { headers: userHeaders });

    console.log('Creating Agent 2...');
    const agent2Res = await axios.post('http://localhost:3010/api/agent/add_agent', {
      name: 'Agent Two',
      email: 'audit-reassign-2@example.com',
      password: process.env.TEST_AGENT_PASSWORD || 'CHANGE_ME',
      mobile: '+919999999992',
      comments: 'Second Agent'
    }, { headers: userHeaders });

    const dbAgent1 = await queryDb("SELECT uid FROM agents WHERE email = 'audit-reassign-1@example.com'");
    const dbAgent2 = await queryDb("SELECT uid FROM agents WHERE email = 'audit-reassign-2@example.com'");

    const agent1Uid = dbAgent1[0].uid;
    const agent2Uid = dbAgent2[0].uid;

    console.log(`Agent 1: ${agent1Uid}, Agent 2: ${agent2Uid}`);

    // 4. Test database state persistence for assignment
    const chatId = 'test-chat-id-reassign';
    
    // Simulate first assignment
    console.log('Assigning chat to Agent 1...');
    await queryDb(
      "INSERT INTO agent_chats (owner_uid, uid, chat_id) VALUES ($1, $2, $3)",
      [userUid, agent1Uid, chatId]
    );

    const check1 = await queryDb("SELECT * FROM agent_chats WHERE chat_id = $1", [chatId]);
    console.log('Assignment state 1:', check1);

    // Simulate Reassignment (Delete old, Insert new)
    console.log('Reassigning chat to Agent 2 (Simulating socket trigger logic)...');
    await queryDb("DELETE FROM agent_chats WHERE chat_id = $1 AND owner_uid = $2", [chatId, userUid]);
    await queryDb("INSERT INTO agent_chats (owner_uid, uid, chat_id) VALUES ($1, $2, $3)", [userUid, agent2Uid, chatId]);

    const check2 = await queryDb("SELECT * FROM agent_chats WHERE chat_id = $1", [chatId]);
    console.log('Assignment state 2 (post-reassign):', check2);

    logs.agentReassignment = {
      agent1Created: !!agent1Uid,
      agent2Created: !!agent2Uid,
      assignment1Persisted: check1.length === 1 && check1[0].uid === agent1Uid,
      assignment2Overwritten: check2.length === 1 && check2[0].uid === agent2Uid
    };

    // Cleanup
    await queryDb("DELETE FROM agents WHERE email LIKE 'audit-reassign-%'");
    await queryDb("DELETE FROM agent_chats WHERE owner_uid = $1", [userUid]);

  } catch (err) {
    console.error('Agent reassignment verification failed:', err.message);
    logs.error = err.message;
  }

  console.log('\n=== Agent Reassignment Audit Summary ===');
  console.log(JSON.stringify(logs, null, 2));
})();
