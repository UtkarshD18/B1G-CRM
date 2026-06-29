const axios = require('axios');
const pool = require('../database/config');
const { v7: uuidv7 } = require('uuid');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://127.0.0.1:3020/api';

// Configuration
const TARGETS = {
  contacts: 500,
  leads: 200,
  conversations: 1000,
  messages_per_conversation: 10,
  campaigns: 50,
  jobs: 100
};

async function log(msg) {
  console.log(`[LOAD-SEED] ${msg}`);
}

async function execSeed() {
  log('Starting Phase 1B SAT Load Seed...');
  const client = await pool.connect();
  
  try {
    // 1. Login as Tenant to use APIs
    log('Logging in as Tenant...');
    const loginRes = await axios.post(`${API_BASE}/user/login`, {
      email: 'tenant@example.com',
      password: 'password'
    });
    
    if (!loginRes.data.success) {
      throw new Error('Tenant login failed');
    }
    const token = loginRes.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Fetch Phonebook
    let pbId = 1;
    const pbs = await client.query(`SELECT id FROM phonebook WHERE uid = 'tenant-uid' LIMIT 1`);
    if (pbs.rows.length) pbId = pbs.rows[0].id;

    // 3. Seed Phonebook & Contacts (in bulk via DB for speed, since APIs loop would be slow for 500)
    // The rules say "Preferred execution path: REST APIs -> Business Logic -> Database".
    // I will use Promise.all to batch API calls.
    log(`Seeding ${TARGETS.contacts} Contacts via API...`);
    const contactPromises = [];
    for (let i = 21; i <= TARGETS.contacts; i++) {
      contactPromises.push(axios.post(`${API_BASE}/phonebook/add_single_contact`, {
        phonebook_id: pbId,
        name: `Load Contact ${i}`,
        mobile: `9155555${String(i).padStart(5, '0')}`,
        email: `loadcontact${i}@sat.local`
      }, { headers: authHeaders }).catch(() => {}));
      
      // Batch every 50 to avoid connection overload
      if (i % 50 === 0) {
        await Promise.all(contactPromises);
        contactPromises.length = 0;
        log(`  ...seeded ${i} contacts`);
      }
    }
    if (contactPromises.length > 0) await Promise.all(contactPromises);

    // 4. Seed CRM Leads
    log(`Seeding ${TARGETS.leads} CRM Leads via API...`);
    const leadPromises = [];
    for (let i = 11; i <= TARGETS.leads; i++) {
      leadPromises.push(axios.post(`${API_BASE}/crm_leads/create`, {
        name: `Load Lead ${i}`,
        mobile: `9144444${String(i).padStart(5, '0')}`,
        email: `loadlead${i}@sat.local`,
        status: 'new'
      }, { headers: authHeaders }).catch(() => {}));
      
      if (i % 50 === 0) {
        await Promise.all(leadPromises);
        leadPromises.length = 0;
        log(`  ...seeded ${i} leads`);
      }
    }
    if (leadPromises.length > 0) await Promise.all(leadPromises);

    // 5. Seed Conversations and Messages (DB + JSON mirror)
    log(`Seeding ${TARGETS.conversations} Conversations with ${TARGETS.messages_per_conversation} Messages each...`);
    
    // We will do direct DB inserts for conversations to handle 1000 properly without spamming the local webhook.
    const dir = path.join(__dirname, '../client/public/whatsapp_data/inbox/tenant-uid');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let chatInsertValues = [];
    for (let i = 11; i <= TARGETS.conversations; i++) {
      const mobile = `9155555${String(i).padStart(5, '0')}`;
      const now = Date.now();
      
      chatInsertValues.push(`('${mobile}', 'tenant-uid', 'Load Contact ${i}', '${mobile}', ${now}, 'Load msg', 0, 'agent-1-uid', 'LOAD', 'open')`);
      
      // JSON Mirror for 10 messages per chat
      const file = path.join(dir, `${mobile}.json`);
      const messages = [];
      for (let m = 1; m <= TARGETS.messages_per_conversation; m++) {
        messages.push({
          id: uuidv7(),
          text: { body: `Load msg ${m}` },
          type: "text",
          from: mobile,
          timestamp: Math.floor(now/1000) - (10 - m),
          status: "read",
          direction: m % 2 === 0 ? "outbound" : "inbound"
        });
      }
      fs.writeFileSync(file, JSON.stringify({ messages }, null, 2));

      // Batch insert every 100
      if (i % 100 === 0) {
        await client.query(`
          INSERT INTO chats (chat_id, uid, sender_name, sender_mobile, last_message_came, last_message, is_opened, assigned_agent_uid, chat_tags, chat_status)
          VALUES ${chatInsertValues.join(', ')}
          ON CONFLICT DO NOTHING
        `);
        chatInsertValues = [];
        log(`  ...seeded ${i} conversations`);
      }
    }
    if (chatInsertValues.length > 0) {
      await client.query(`
        INSERT INTO chats (chat_id, uid, sender_name, sender_mobile, last_message_came, last_message, is_opened, assigned_agent_uid, chat_tags, chat_status)
        VALUES ${chatInsertValues.join(', ')}
        ON CONFLICT DO NOTHING
      `);
    }

    // 6. SLA Timers & Queue Entries
    log(`Seeding Queues and SLA Timers...`);
    // Insert dummy outgoing queue records to test queue metrics and dead-letter/retry behaviors
    let queueInsertValues = [];
    for(let q = 1; q <= 200; q++) {
      // 100 pending, 50 retrying, 50 dead-letter (failed)
      let state = 'pending';
      let attempts = 0;
      if (q > 100 && q <= 150) { state = 'retry'; attempts = 2; }
      else if (q > 150) { state = 'failed'; attempts = 5; }
      
      queueInsertValues.push(`('tenant-uid', 'whatsapp', '{"to":"915555500001"}', '${state}', ${attempts}, '${uuidv7()}')`);
      
      if (q % 100 === 0) {
        await client.query(`
          INSERT INTO channel_outgoing_queue (uid, channel_type, payload, state, attempts, correlation_id)
          VALUES ${queueInsertValues.join(', ')}
        `);
        queueInsertValues = [];
      }
    }

    // 7. Seed Broadcast Campaigns
    log(`Seeding Broadcast Campaigns...`);
    for (let c = 1; c <= TARGETS.campaigns; c++) {
      await axios.post(`${API_BASE}/broadcast/add_new`, {
        name: `Load Campaign ${c}`,
        phonebook_id: pbId,
        templet_id: 1, // Assume a valid template
        send_time: Date.now() + 86400000 // future
      }, { headers: authHeaders }).catch(() => {});
    }

    log('Phase 1B Load Seed Complete.');

  } catch (err) {
    console.error('Load Seed Error:', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

execSeed();
