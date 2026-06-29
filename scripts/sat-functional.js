const axios = require('axios');
const pool = require('../database/config');


const API_BASE = 'http://127.0.0.1:3020/api';
let authHeaders = {};
let tenantUid = '';

async function log(msg) {
  console.log(`[FUNCTIONAL-SAT] ${msg}`);
}

async function fail(msg) {
  console.error(`[FUNCTIONAL-SAT ERROR] ${msg}`);
  process.exit(1);
}

async function testAuth() {
  log('Testing Authentication...');
  const res = await axios.post(`${API_BASE}/user/login`, {
    email: 'tenant@example.com',
    password: 'password'
  });
  if (!res.data.success) fail('Tenant login failed');
  authHeaders = { Authorization: `Bearer ${res.data.token}` };
  tenantUid = res.data.token; // decode if needed, but not strictly required
  log('Authentication passed.');
}

async function testWebsocket() {
  log('Testing WebSockets (Polling endpoint)...');
  const res = await axios.get(`${API_BASE.replace('/api', '')}/socket.io/?EIO=4&transport=polling`);
  if (res.status === 200 && res.data.includes('sid')) {
    log('WebSocket server is active and responding to polling handshakes.');
  } else {
    fail('WebSocket server did not respond correctly.');
  }
}

async function testContactsAPI() {
  log('Testing Contacts API...');
  const getContacts = await axios.get(`${API_BASE}/phonebook/get_uid_contacts`, { headers: authHeaders });

  if (getContacts.status !== 200 || !getContacts.data.success) {
    fail('Failed to fetch contacts');
  }
  log(`Successfully fetched contacts, found ${getContacts.data.data?.length || 0} via API.`);
}

async function testBroadcastAPI() {
  log('Testing Broadcast API...');
  const campaigns = await axios.get(`${API_BASE}/broadcast/dashboard_summary`, { headers: authHeaders });
  if (campaigns.status !== 200) {
    fail('Failed to fetch broadcast dashboard summary');
  }
  log('Successfully fetched broadcast summary.');
}

(async () => {
  try {
    await testAuth();
    await testContactsAPI();
    await testBroadcastAPI();
    await testWebsocket();

    log('✅ Functional Validation Passed! Core APIs and WebSockets are operational.');
    process.exit(0);
  } catch (err) {
    fail(err.response?.data?.msg || err.message);
  }
})();
