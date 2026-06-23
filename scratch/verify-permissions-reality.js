const axios = require('axios');
const jwt = require('jsonwebtoken');
const { query } = require('../database/dbpromise.js');
const env = require('../env');

const BASE_URL = 'http://127.0.0.1:3010/api';

const ALL_PERMISSIONS = [
  'inbox_access', 'task_access', 'contacts_access', 'kanban_access',
  'leads_access', 'campaigns_access', 'flows_access', 'chatbot_access',
  'knowledgebase_access', 'website_access', 'reports_access',
  'billing_access', 'api_access', 'settings_access'
];

async function runAudit() {
  console.log('=== PHASE 2 — AGENT PERMISSION REALITY TEST ===\n');

  // Find a tenant owner user to associate the agents with
  const users = await query('SELECT uid FROM user LIMIT 1');
  if (!users.length) {
    console.error('No users found in database to associate agents with.');
    process.exit(1);
  }
  const ownerUid = users[0].uid;
  console.log(`Using owner UID: ${ownerUid}`);

  // Create temporary agents A, B, C
  const agentA = {
    uid: 'agent-a-' + Date.now(),
    email: 'agent-a@example.com',
    name: 'Agent A (Inbox Only)',
    permissions: ['inbox_access']
  };

  const agentB = {
    uid: 'agent-b-' + Date.now(),
    email: 'agent-b@example.com',
    name: 'Agent B (Inbox + Tasks)',
    permissions: ['inbox_access', 'task_access']
  };

  const agentC = {
    uid: 'agent-c-' + Date.now(),
    email: 'agent-c@example.com',
    name: 'Agent C (Full Access)',
    permissions: ALL_PERMISSIONS
  };

  // Helper to insert agent
  async function insertAgent(agent) {
    await query(
      `INSERT INTO agents (owner_uid, uid, name, email, password, role, permissions, is_active)
       VALUES (?, ?, ?, ?, 'hashedpass', 'agent', ?, 1)`,
      [ownerUid, agent.uid, agent.name, agent.email, JSON.stringify(agent.permissions)]
    );
  }

  await insertAgent(agentA);
  await insertAgent(agentB);
  await insertAgent(agentC);
  console.log('Temporary agents created in database.');

  // Generate tokens
  function getToken(agent) {
    return jwt.sign(
      { uid: agent.uid, role: 'agent', email: agent.email, owner_uid: ownerUid, permissions: agent.permissions },
      env.JWT_SECRET
    );
  }

  const tokenA = getToken(agentA);
  const tokenB = getToken(agentB);
  const tokenC = getToken(agentC);

  const testCases = [
    {
      name: 'Contacts API Access (contacts_access)',
      endpoint: '/phonebook/get_by_uid',
      method: 'get',
      permissionNeeded: 'contacts_access'
    },
    {
      name: 'Leads API Access (leads_access)',
      endpoint: '/crm/leads',
      method: 'get',
      permissionNeeded: 'leads_access'
    },
    {
      name: 'Automation Flows API Access (flows_access)',
      endpoint: '/chat_flow/get_mine',
      method: 'get',
      permissionNeeded: 'flows_access'
    },
    {
      name: 'Chatbot API Access (chatbot_access)',
      endpoint: '/chatbot/get_chatbot',
      method: 'get',
      permissionNeeded: 'chatbot_access'
    }
  ];

  let passed = true;

  for (const tc of testCases) {
    console.log(`\nTesting: ${tc.name}`);

    // Test Agent A (Deny)
    try {
      await axios[tc.method](`${BASE_URL}${tc.endpoint}`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      console.log(`  ❌ Agent A: Unexpectedly ALLOWED`);
      passed = false;
    } catch (err) {
      console.log(`  ✅ Agent A: Denied as expected (Status: ${err.response?.status})`);
    }

    // Test Agent B (Deny)
    try {
      await axios[tc.method](`${BASE_URL}${tc.endpoint}`, {
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      console.log(`  ❌ Agent B: Unexpectedly ALLOWED`);
      passed = false;
    } catch (err) {
      console.log(`  ✅ Agent B: Denied as expected (Status: ${err.response?.status})`);
    }

    // Test Agent C (Allow)
    try {
      const res = await axios[tc.method](`${BASE_URL}${tc.endpoint}`, {
        headers: { Authorization: `Bearer ${tokenC}` }
      });
      console.log(`  ✅ Agent C: Allowed as expected (Success: ${res.data?.success})`);
    } catch (err) {
      console.log(`  ❌ Agent C: Unexpectedly Denied (Status: ${err.response?.status}, Msg: ${err.response?.data?.msg})`);
      passed = false;
    }
  }

  // Cleanup
  await query('DELETE FROM agents WHERE uid IN (?, ?, ?)', [agentA.uid, agentB.uid, agentC.uid]);
  console.log('\nTemporary agents cleaned up.');

  if (passed) {
    console.log('\n🎉 ALL AGENT PERMISSION REALITY TESTS PASSED!');
  } else {
    console.log('\n❌ AGENT PERMISSION REALITY TESTS FAILED!');
  }
}

runAudit();
