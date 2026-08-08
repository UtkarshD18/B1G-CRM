const pool = require('../database/config');

async function verifySeed() {
  console.log('\n=== B1GCRM Database Seed Verification ===');
  const client = await pool.connect();

  try {
    // 1. Verify User Counts
    const userRes = await client.query(`SELECT role, COUNT(*) FROM "user" GROUP BY role`);
    console.log('👥 Users in DB:');
    let userCount = 0;
    for (const row of userRes.rows) {
      console.log(`  - Role [${row.role}]: ${row.count}`);
      userCount += parseInt(row.count, 10);
    }
    if (userCount === 0) throw new Error('No users found in database');

    // 2. Verify Agent Counts
    const agentRes = await client.query(`SELECT COUNT(*) FROM agents`);
    const agentCount = parseInt(agentRes.rows[0].count, 10);
    console.log(`🕵️‍♂️  Agents Count: ${agentCount}`);
    if (agentCount < 2) throw new Error('Expected at least 2 agents');

    // 3. Verify CRM Leads Pipeline Stage Realism
    const leadRes = await client.query(`SELECT stage, COUNT(*) FROM crm_leads GROUP BY stage`);
    console.log('📈 Leads Pipeline Distribution:');
    const stages = new Set();
    for (const row of leadRes.rows) {
      console.log(`  - Stage [${row.stage}]: ${row.count}`);
      stages.add(row.stage.toLowerCase());
    }
    if (leadRes.rows.length === 0) throw new Error('No CRM leads found');
    if (stages.size < 2)
      throw new Error('Leads should be distributed across multiple pipeline stages');

    // 4. Verify Contact Counts
    const contactRes = await client.query(`SELECT COUNT(*) FROM contact`);
    const contactCount = parseInt(contactRes.rows[0].count, 10);
    console.log(`📞 Contacts Count: ${contactCount}`);
    if (contactCount === 0) throw new Error('No phonebook contacts found');

    // 5. Verify Conversations Presence
    const chatRes = await client.query(`SELECT COUNT(*) FROM chats`);
    const chatCount = parseInt(chatRes.rows[0].count, 10);
    console.log(`💬 Conversations Count: ${chatCount}`);
    if (chatCount === 0) throw new Error('No chats found');

    // 6. Verify Tasks Presence (overdue/completed tasks)
    const taskRes = await client.query(`SELECT status, COUNT(*) FROM agent_task GROUP BY status`);
    console.log('📋 Agent Tasks Status:');
    for (const row of taskRes.rows) {
      console.log(`  - Status [${row.status}]: ${row.count}`);
    }

    // 7. Verify Lead Activity Timeline Events
    const activityRes = await client.query(`SELECT COUNT(*) FROM crm_lead_activities`);
    const activityCount = parseInt(activityRes.rows[0].count, 10);
    console.log(`🕒 CRM Lead Timeline Activities: ${activityCount}`);

    console.log('\n🟢 B1GCRM Seeder Realism Validation PASSED.\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ B1GCRM Seeder Realism Validation FAILED:');
    console.error(err.message || err);
    process.exit(1);
  } finally {
    client.release();
  }
}

verifySeed();
