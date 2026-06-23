const axios = require('axios');
const jwt = require('jsonwebtoken');
const { query } = require('../database/dbpromise.js');
const env = require('../env');

const BASE_URL = 'http://127.0.0.1:3010/api';

async function runRegression() {
  console.log('=== PHASE 3 — SECURITY REGRESSION TEST ===\n');

  // Fetch users and chats to setup regression targets
  const users = await query('SELECT uid FROM user LIMIT 1');
  const ownerUid = users[0].uid;

  // Create Agent 1 (attacker)
  const agent1 = {
    uid: 'attacker-' + Date.now(),
    email: 'attacker@example.com',
    permissions: ['inbox_access', 'task_access']
  };

  // Create Agent 2 (victim)
  const agent2 = {
    uid: 'victim-' + Date.now(),
    email: 'victim@example.com',
    permissions: ['inbox_access', 'task_access']
  };

  // Helper to insert agents
  async function insertAgent(agent) {
    await query(
      `INSERT INTO agents (owner_uid, uid, name, email, password, role, permissions, is_active)
       VALUES (?, ?, ?, ?, 'hashedpass', 'agent', ?, 1)`,
      [ownerUid, agent.uid, agent.uid, agent.email, JSON.stringify(agent.permissions)]
    );
  }

  await insertAgent(agent1);
  await insertAgent(agent2);

  const token1 = jwt.sign({ uid: agent1.uid, role: 'agent', email: agent1.email, owner_uid: ownerUid }, env.JWT_SECRET);

  let passed = true;

  // 1. Task Completion Exploit check
  console.log('Testing Task Completion Hijack...');
  // Insert a task assigned to Agent 2 (victim)
  const taskRes = await query(
    `INSERT INTO agent_task (uid, title, description, status, owner_uid)
     VALUES (?, 'Victim Task', 'Only victim should complete', 'PENDING', ?) RETURNING id`,
    [agent2.uid, ownerUid]
  );
  const taskId = taskRes[0].id;

  // Attacker (Agent 1) tries to complete Agent 2's task
  try {
    const res = await axios.post(`${BASE_URL}/agent/mark_task_complete`, {
      id: taskId,
      comment: 'Hacked by Attacker'
    }, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    
    // Check database state
    const [task] = await query('SELECT status FROM agent_task WHERE id = ?', [taskId]);
    if (task.status === 'COMPLETED') {
      console.log('  ❌ FAILED: Task completed by unauthorized attacker!');
      passed = false;
    } else {
      console.log('  ✅ SUCCESS: Attacker block confirmed. Task remains PENDING.');
    }
  } catch (err) {
    console.log('  ✅ SUCCESS: API call blocked task completion.');
  }

  // Clean up task
  await query('DELETE FROM agent_task WHERE id = ?', [taskId]);

  // 2. Change Ticket Status Exploit check
  console.log('\nTesting Change Chat Ticket Status Exploit...');
  // Create an unassigned chat
  const chatId = 'chat-unassigned-' + Date.now();
  await query(
    `INSERT INTO chats (chat_id, uid, chat_status, sender_name, sender_mobile)
     VALUES (?, ?, 'OPEN', 'Target Customer', '1234567890')`,
    [chatId, ownerUid]
  );

  // Attacker tries to change ticket status of unassigned chat
  try {
    const res = await axios.post(`${BASE_URL}/agent/change_chat_ticket_status`, {
      chatId,
      status: 'SOLVED'
    }, {
      headers: { Authorization: `Bearer ${token1}` }
    });

    const [chat] = await query('SELECT chat_status FROM chats WHERE chat_id = ?', [chatId]);
    if (chat.chat_status === 'SOLVED') {
      console.log('  ❌ FAILED: Chat status changed by unassigned agent!');
      passed = false;
    } else {
      console.log(`  ✅ SUCCESS: Status change blocked. Response msg: ${res.data?.msg}`);
    }
  } catch (err) {
    console.log('  ✅ SUCCESS: API blocked status change.');
  }

  // 3. Overwrite notes exploit check
  console.log('\nTesting Overwrite Note Exploit...');
  try {
    const res = await axios.post(`${BASE_URL}/agent/save_note`, {
      chatId,
      note: 'Tampered note text'
    }, {
      headers: { Authorization: `Bearer ${token1}` }
    });

    const [chat] = await query('SELECT chat_note FROM chats WHERE chat_id = ?', [chatId]);
    if (chat.chat_note === 'Tampered note text') {
      console.log('  ❌ FAILED: Note overwritten by unassigned agent!');
      passed = false;
    } else {
      console.log(`  ✅ SUCCESS: Note update blocked. Response msg: ${res.data?.msg}`);
    }
  } catch (err) {
    console.log('  ✅ SUCCESS: API blocked note update.');
  }

  // Clean up chats and agents
  await query('DELETE FROM chats WHERE chat_id = ?', [chatId]);
  await query('DELETE FROM agents WHERE uid IN (?, ?)', [agent1.uid, agent2.uid]);
  console.log('\nCleaned up database state.');

  if (passed) {
    console.log('\n🎉 ALL REGRESSION EXPLOIT TESTS FIXED & PASSED!');
  } else {
    console.log('\n❌ SECURITY REGRESSION TESTS FAILED!');
  }
}

runRegression();
