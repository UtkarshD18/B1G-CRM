const fs = require('fs');
const path = require('path');
const pool = require('../database/config');

async function log(msg) {
  console.log(`[AUDIT] ${msg}`);
}
async function fail(msg) {
  console.error(`[AUDIT ERROR] ${msg}`);
  process.exit(1);
}

async function execAudit() {
  log('Starting Phase 1 Integrity Audit...');
  const client = await pool.connect();
  
  try {
    // 1. Orphan Checks
    log('Checking for orphans...');
    
    // Contacts without Users/Phonebook
    const orphanContacts = await client.query(`SELECT id FROM contact WHERE phonebook_id NOT IN (SELECT id FROM phonebook)`);
    if (orphanContacts.rows.length > 0) fail(`Found ${orphanContacts.rows.length} orphan contacts.`);
    
    // CRM Leads without Tenant
    const orphanLeads = await client.query(`SELECT id FROM crm_leads WHERE uid NOT IN (SELECT uid FROM "user")`);
    if (orphanLeads.rows.length > 0) fail(`Found ${orphanLeads.rows.length} orphan leads.`);

    // Chats without Tenant
    const orphanChats = await client.query(`SELECT id FROM chats WHERE uid NOT IN (SELECT uid FROM "user")`);
    if (orphanChats.rows.length > 0) fail(`Found ${orphanChats.rows.length} orphan chats.`);
    
    // Outgoing queue without valid connection or tenant
    const orphanOutgoing = await client.query(`
      SELECT id FROM channel_outgoing_queue 
      WHERE uid NOT IN (SELECT uid FROM "user")
    `);
    if (orphanOutgoing.rows.length > 0) fail(`Found ${orphanOutgoing.rows.length} orphan outgoing queue rows.`);

    // Incoming queue without valid connection or tenant
    const orphanIncoming = await client.query(`
      SELECT id FROM channel_incoming_queue 
      WHERE uid NOT IN (SELECT uid FROM "user")
    `);
    if (orphanIncoming.rows.length > 0) fail(`Found ${orphanIncoming.rows.length} orphan incoming queue rows.`);

    // 2. JSON Synchronization checks
    log('Checking JSON mirror integrity...');
    const chats = await client.query(`SELECT uid, sender_mobile as mobile, chat_id FROM chats`);
    for (const chat of chats.rows) {
      const file = path.join(__dirname, '../client/public/whatsapp_data/inbox', chat.uid, `${chat.mobile}.json`);
      if (!fs.existsSync(file)) {
        fail(`Missing JSON mirror for DB chat: Tenant=${chat.uid} Mobile=${chat.mobile}`);
      }
      
      const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (!payload.messages || !Array.isArray(payload.messages)) {
        fail(`Invalid JSON structure in ${file}`);
      }
      
      // Check duplicate UUIDs in the JSON
      const ids = payload.messages.map(m => m.id);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        fail(`Duplicate UUIDv7 found in ${file}`);
      }
    }

    log('✅ Integrity Audit Passed! Environment is ready for SAT Browser Testing.');

  } catch (err) {
    fail(err.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

execAudit();
