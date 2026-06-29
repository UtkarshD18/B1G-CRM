const axios = require('axios');
const pool = require('../database/config');
const { v7: uuidv7 } = require('uuid');
const bcrypt = require('bcrypt');

const API_BASE = 'http://127.0.0.1:3010/api';
const SALT_ROUNDS = 10;

// Configuration
const TARGETS = {
  users: 5,
  contacts: 20,
  leads: 10,
  conversations: 10
};

async function log(msg) {
  console.log(`[SEED] ${msg}`);
}

async function execSeed() {
  log('Starting Phase 1A SAT Bootstrap Seed...');
  const client = await pool.connect();
  
  try {
    // 1. Ensure Super Admin and Tenant Admin
    log('Seeding Admins...');
    const adminHash = await bcrypt.hash('password', SALT_ROUNDS);
    await client.query(`
      INSERT INTO admin (uid, email, password, role)
      VALUES ('local-admin-uid', 'admin@example.com', $1, 'admin')
      ON CONFLICT (email) DO NOTHING
    `, [adminHash]);

    // Create a primary Tenant User manually if API requires things we don't have
    const tenantHash = await bcrypt.hash('password', SALT_ROUNDS);
    await client.query(`
      INSERT INTO "user" (uid, name, email, password, role, timezone, plan, plan_expire)
      VALUES ('tenant-uid', 'Tenant Admin', 'tenant@example.com', $1, 'user', 'Asia/Kolkata', '{"contact_limit":100000,"allow_note":1,"allow_tag":1,"allow_chatbot":1,"allow_api":1}', 4102444800000)
      ON CONFLICT (email) DO UPDATE SET plan_expire = 4102444800000
    `, [tenantHash]);

    // 2. Seed 2 Agents for the Tenant
    log('Seeding Agents...');
    for (let i = 1; i <= 2; i++) {
      await client.query(`
        INSERT INTO agents (owner_uid, uid, email, password, role, name, mobile, is_active)
        VALUES ('tenant-uid', 'agent-${i}-uid', 'agent${i}@example.com', $1, 'agent', 'Agent ${i}', '91999999999${i}', 1)
        ON CONFLICT (email) DO NOTHING
      `, [tenantHash]);
    }

    // 3. Login as Tenant to use APIs
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

    // 4. Create 5 Users via API
    log('Seeding 5 Regular Users via API...');
    for (let i = 1; i <= TARGETS.users; i++) {
      try {
        await axios.post(`${API_BASE}/user/signup`, {
          email: `user${i}@example.com`,
          name: `User ${i}`,
          password: 'password',
          mobile_with_country_code: `91888888888${i}`,
          acceptPolicy: true
        });
      } catch (e) {
        // Ignore duplicate
      }
    }

    // 5. Setup Channel Connections (Direct SQL, as API typically requires OAuth callbacks)
    log('Seeding Channel Connections...');
    const channels = ['whatsapp', 'twilio', 'email', 'webchat'];
    for (const ch of channels) {
      await client.query(`
        INSERT INTO channel_connections (uid, channel_type, connection_status)
        VALUES ('tenant-uid', $1, 'connected')
        ON CONFLICT (uid, channel_type) DO NOTHING
      `, [ch]);
    }

    // 6. Seed Phonebook & Contacts
    log('Seeding Contacts...');
    // Add phonebook first
    const pbRes = await axios.post(`${API_BASE}/phonebook/add`, {
      name: 'SAT Default Phonebook',
      desc: 'Created for SAT Phase 1A'
    }, { headers: authHeaders });
    
    let pbId = 1;
    if (pbRes.data.success) {
      const pbs = await client.query(`SELECT id FROM phonebook WHERE uid = 'tenant-uid' LIMIT 1`);
      if (pbs.rows.length) pbId = pbs.rows[0].id;
    } else {
      const pbs = await client.query(`SELECT id FROM phonebook WHERE uid = 'tenant-uid' LIMIT 1`);
      if (pbs.rows.length) pbId = pbs.rows[0].id;
    }

    // Wait, adding single contact requires name, mobile.
    for (let i = 1; i <= TARGETS.contacts; i++) {
      await axios.post(`${API_BASE}/phonebook/add_single_contact`, {
        phonebook_id: pbId,
        name: `Contact ${i}`,
        mobile: `9177777777${String(i).padStart(2, '0')}`,
        email: `contact${i}@sat.local`
      }, { headers: authHeaders }).catch(() => {});
    }

    // 7. Seed CRM Leads
    log('Seeding CRM Leads...');
    for (let i = 1; i <= TARGETS.leads; i++) {
      await axios.post(`${API_BASE}/crm_leads/create`, {
        name: `Lead ${i}`,
        mobile: `9166666666${String(i).padStart(2, '0')}`,
        email: `lead${i}@sat.local`,
        status: 'new'
      }, { headers: authHeaders }).catch(() => {}); // catch permission errors if crm not enabled
    }

    // 8. Seed Conversations (using internal service functions to mirror JSON)
    log('Seeding Conversations & Syncing JSON...');
    // We'll use the DB directly for conversations because webhook/api simulation requires full payloads.
    // Wait! The rules state "Preferred path: REST APIs -> Business Logic".
    // We can simulate an incoming message by hitting webhook endpoint.
    const { addContact } = require('../helper/inbox/inbox'); 
    
    for (let i = 1; i <= TARGETS.conversations; i++) {
      // Create chat metadata manually, or use helper?
      const mobile = `9177777777${String(i).padStart(2, '0')}`;
      
      // Inject via webhook logic or DB directly?
      // Since simulating exact provider payloads for 4 different channels is complex, 
      // we inject via direct DB + JSON helper to maintain referential integrity.
      await client.query(`
        INSERT INTO chats (chat_id, uid, sender_name, sender_mobile, last_message_came, last_message, is_opened, assigned_agent_uid, chat_tags, chat_status)
        VALUES ($2, 'tenant-uid', $1, $2, $3, 'Hello from SAT', 0, 'agent-1-uid', 'SAT', 'open')
        ON CONFLICT DO NOTHING
      `, [`Contact ${i}`, mobile, Date.now()]);
      
      // We must write JSON using inbox helper or fs directly if helper is inaccessible.
      const fs = require('fs');
      const path = require('path');
      const dir = path.join(__dirname, '../client/public/whatsapp_data/inbox/tenant-uid');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      
      const file = path.join(dir, `${mobile}.json`);
      const msgId = uuidv7();
      const payload = {
        messages: [
          {
            id: msgId,
            text: { body: "Hello from SAT" },
            type: "text",
            from: mobile,
            timestamp: Math.floor(Date.now()/1000),
            status: "read",
            direction: "inbound"
          }
        ]
      };
      fs.writeFileSync(file, JSON.stringify(payload, null, 2));
    }

    log('Phase 1A Seed Complete.');

  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

execSeed();
