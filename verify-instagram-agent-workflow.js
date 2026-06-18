const axios = require('axios');
const { Client } = require('pg');
const fs = require('fs');
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
  const agentLogs = {};
  const tenantUid = 'local-user-uid';
  const agentUid = 'local-agent-uid';
  const agentEmail = 'agent@example.com';
  const instaChatId = 'test-agent-insta-chat-888';

  try {
    // 1. Authenticate User and Agent
    console.log('Logging in as User...');
    const userLoginRes = await axios.post('http://localhost:3010/api/user/login', {
      email: 'user@example.com',
      password: '<PASSWORD>'
    });
    const userToken = userLoginRes.data.token;
    const userHeaders = { Authorization: `Bearer ${userToken}` };

    console.log('Logging in as Agent...');
    const agentLoginRes = await axios.post('http://localhost:3010/api/agent/login', {
      email: agentEmail,
      password: '<PASSWORD>'
    });
    const agentToken = agentLoginRes.data.token;
    const agentHeaders = { Authorization: `Bearer ${agentToken}` };

    // 2. Link Instagram credentials
    console.log('Linking Instagram account...');
    await axios.post('http://localhost:3010/api/instagram/save_keys', {
      instagram_business_account_id: 'insta-business-acct-mock',
      access_token: 'example-token',
      username: 'insta_agent_test',
      name: 'Agent Test Instagram',
      app_id: 'mock-app-id-123'
    }, { headers: userHeaders });

    // 3. Initialize Instagram chat thread in database
    console.log('Initializing Instagram chat thread...');
    await queryDb(
      `INSERT INTO chats (chat_id, uid, last_message_came, sender_name, sender_mobile, last_message, is_opened, origin)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (chat_id, uid) DO UPDATE 
       SET last_message_came = EXCLUDED.last_message_came, last_message = EXCLUDED.last_message, origin = EXCLUDED.origin, chat_note = NULL`,
      [
        instaChatId,
        tenantUid,
        Math.round(Date.now() / 1000),
        'Insta Agent User',
        instaChatId,
        JSON.stringify({ type: 'text', msgContext: { type: 'text', text: { body: 'Hello agent test' } }, route: 'INCOMING' }),
        1,
        'instagram'
      ]
    );

    // Initialize conversation JSON file
    const conversationsDir = path.resolve(__dirname, `conversations/inbox/${tenantUid}`);
    if (!fs.existsSync(conversationsDir)) {
      fs.mkdirSync(conversationsDir, { recursive: true });
    }
    const chatFilePath = path.join(conversationsDir, `${instaChatId}.json`);
    const initialHistory = [
      {
        type: 'text',
        metaChatId: 'mock-mid-initial',
        msgContext: { type: 'text', text: { body: 'Hello agent test' } },
        timestamp: Math.round(Date.now() / 1000),
        senderName: 'Insta Agent User',
        senderMobile: instaChatId,
        status: 'received',
        star: false,
        route: 'INCOMING',
        context: '',
        origin: 'instagram'
      }
    ];
    fs.writeFileSync(chatFilePath, JSON.stringify(initialHistory, null, 2));

    // 4. Verify restricted inbox visibility (Agent cannot see unassigned chat)
    console.log('Verifying agent restricted visibility before assignment...');
    const agentChatsBeforeRes = await axios.get('http://localhost:3010/api/agent/get_my_assigned_chats', { headers: agentHeaders });
    const chatsBefore = agentChatsBeforeRes.data.data || [];
    const isVisibleBefore = chatsBefore.some(c => c.chat_id === instaChatId);

    console.log('Is chat visible to agent before assignment?', isVisibleBefore);
    agentLogs.visibilityBeforeAssignment = {
      isVisible: isVisibleBefore,
      chatsCount: chatsBefore.length
    };

    if (isVisibleBefore) {
      throw new Error('Agent can see the Instagram chat before it is assigned to them');
    }

    // 5. Assign chat to agent
    console.log('Assigning Instagram chat to agent...');
    const assignRes = await axios.post('http://localhost:3010/api/agent/update_agent_in_chat', {
      assignAgent: { uid: agentUid, email: agentEmail },
      chatId: instaChatId
    }, { headers: userHeaders });

    console.log('Assignment response:', assignRes.data);
    agentLogs.assignmentResponse = assignRes.data;

    // Verify DB entry in agent_chats
    const dbAssignments = await queryDb('SELECT * FROM agent_chats WHERE chat_id = $1 AND uid = $2', [instaChatId, agentUid]);
    console.log('DB Assignment records:', dbAssignments);
    agentLogs.dbAssignmentPersisted = dbAssignments.length > 0;

    if (dbAssignments.length < 1) {
      throw new Error('Assignment record was not created in PG agent_chats table');
    }

    // 6. Verify visibility after assignment
    console.log('Verifying agent visibility after assignment...');
    const agentChatsAfterRes = await axios.get('http://localhost:3010/api/agent/get_my_assigned_chats', { headers: agentHeaders });
    const chatsAfter = agentChatsAfterRes.data.data || [];
    const isVisibleAfter = chatsAfter.some(c => c.chat_id === instaChatId);

    console.log('Is chat visible to agent after assignment?', isVisibleAfter);
    agentLogs.visibilityAfterAssignment = {
      isVisible: isVisibleAfter,
      chatsCount: chatsAfter.length
    };

    if (!isVisibleAfter) {
      throw new Error('Agent cannot see the Instagram chat even after assignment');
    }

    // 7. Add Agent Note
    console.log('Saving agent note on Instagram chat...');
    const noteContent = 'This is an agent note on Instagram chat!';
    const saveNoteRes = await axios.post('http://localhost:3010/api/agent/save_note', {
      chatId: instaChatId,
      note: noteContent
    }, { headers: agentHeaders });

    console.log('Save note response:', saveNoteRes.data);

    // Verify note persistence in DB
    const dbChatsAfterNote = await queryDb('SELECT * FROM chats WHERE chat_id = $1 AND uid = $2', [instaChatId, tenantUid]);
    console.log('DB Chat note stored:', dbChatsAfterNote[0]?.chat_note);
    agentLogs.notePersisted = dbChatsAfterNote[0]?.chat_note === noteContent;

    if (dbChatsAfterNote[0]?.chat_note !== noteContent) {
      throw new Error('Agent note was not persisted in chats database table');
    }

    // 8. Send Agent Outgoing Reply
    console.log('Testing agent outgoing reply...');
    const agentReplyText = 'Agent reply from restricted workspace!';
    const agentReplyRes = await axios.post('http://localhost:3010/api/agent/send_text', {
      text: agentReplyText,
      toNumber: instaChatId,
      toName: 'Insta Agent User',
      chatId: instaChatId
    }, { headers: agentHeaders });

    console.log('Agent reply response:', agentReplyRes.data);
    agentLogs.agentReply = agentReplyRes.data;

    // Verify reply in conversation file
    if (fs.existsSync(chatFilePath)) {
      const history = JSON.parse(fs.readFileSync(chatFilePath, 'utf8'));
      const lastMsg = history[history.length - 1];
      console.log('Last message in history:', lastMsg);
      agentLogs.replyPersisted = lastMsg.msgContext?.text?.body === agentReplyText && lastMsg.route === 'OUTGOING';
    } else {
      throw new Error('Conversation JSON history file was deleted or not found');
    }

    // 9. Clean up
    console.log('Cleaning up agent tests...');
    await queryDb('DELETE FROM agent_chats WHERE chat_id = $1 AND uid = $2', [instaChatId, agentUid]);
    await queryDb('DELETE FROM chats WHERE chat_id = $1 AND uid = $2', [instaChatId, tenantUid]);
    if (fs.existsSync(chatFilePath)) {
      fs.unlinkSync(chatFilePath);
    }
    await axios.post('http://localhost:3010/api/instagram/disconnect', {}, { headers: userHeaders });

  } catch (err) {
    console.error('Agent workflow verification failed:', err.message);
    agentLogs.error = err.message;
  }

  console.log('\n=== Instagram Agent Workflow Verification Summary ===');
  console.log(JSON.stringify(agentLogs, null, 2));
  fs.writeFileSync(path.join(__dirname, 'verify-instagram-agent-workflow.json'), JSON.stringify(agentLogs, null, 2));
})();
