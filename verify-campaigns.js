const axios = require('axios');
const { Client } = require('pg');
const fs = require('fs');

const queryDb = async (sql, params = []) => {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'b1gcrm',
    password: 'b1gcrm_local_dev',
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
  const auditLogs = {};

  try {
    // 1. Authenticate to get JWT token
    console.log('Logging in as User...');
    const loginRes = await axios.post('http://localhost:3010/api/user/login', {
      email: 'user@example.com',
      password: '<PASSWORD>'
    });

    const token = loginRes.data.token;
    if (!token) {
      throw new Error('Failed to login, token not returned');
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Clean up any existing test records
    await queryDb("DELETE FROM meta_api WHERE uid = 'local-user-uid'");
    await queryDb("DELETE FROM broadcast_log WHERE uid = 'local-user-uid'");
    await queryDb("DELETE FROM broadcast WHERE uid = 'local-user-uid'");
    await queryDb("DELETE FROM contact WHERE phonebook_id = 9999");
    await queryDb("DELETE FROM phonebook WHERE id = 9999");

    // 2. Setup a valid phonebook with a contact for testing
    console.log('Inserting test phonebook and contact in DB...');
    await queryDb(
      "INSERT INTO phonebook (id, uid, name) VALUES (9999, 'local-user-uid', 'Audit Campaign Phonebook')"
    );
    await queryDb(
      "INSERT INTO contact (uid, name, mobile, phonebook_id) VALUES ('local-user-uid', 'Audit Recipient', '1234567890', 9999)"
    );

    // 3. Create campaign in local simulation mode (scheduled in the past so daemon loop processes it immediately)
    console.log('Creating campaign in local simulation mode...');
    const campaignRes = await axios.post('http://localhost:3010/api/broadcast/add_new', {
      title: 'Audit Simulation Campaign',
      templet: { name: 'test_template' },
      phonebook: { id: 9999 },
      scheduleTimestamp: Date.now() - 10000, // 10 seconds in the past
      example: ["test-var"]
    }, { headers });

    console.log('Campaign Creation Response:', campaignRes.data);

    // Get created campaign from database
    const dbCampaigns = await queryDb("SELECT * FROM broadcast WHERE uid = 'local-user-uid'");
    const dbLogsBefore = await queryDb("SELECT * FROM broadcast_log WHERE uid = 'local-user-uid'");

    auditLogs.campaignCreation = {
      success: campaignRes.data.success,
      persistedInDb: dbCampaigns.length > 0,
      logCountBefore: dbLogsBefore.length,
      campaignRow: dbCampaigns[0] || null
    };

    if (!campaignRes.data.success || dbCampaigns.length < 1) {
      throw new Error('Campaign was not successfully created');
    }

    const broadcastId = dbCampaigns[0].broadcast_id;

    // 4. Wait for background daemon loop processing
    console.log('Waiting for background campaignLoop processing (12 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 12000));

    // 5. Query and verify updated status
    const dbCampaignsAfter = await queryDb("SELECT * FROM broadcast WHERE broadcast_id = $1", [broadcastId]);
    const dbLogsAfter = await queryDb("SELECT * FROM broadcast_log WHERE broadcast_id = $1", [broadcastId]);

    console.log('Campaign State After:', dbCampaignsAfter);
    console.log('Recipient Log State After:', dbLogsAfter);

    auditLogs.campaignExecution = {
      campaignStatus: dbCampaignsAfter[0]?.status,
      deliveryStatus: dbLogsAfter[0]?.delivery_status,
      executedSuccessfully: dbCampaignsAfter[0]?.status === 'FINISHED' && dbLogsAfter[0]?.delivery_status === 'sent'
    };

    // Cleanup mock credentials and data
    await queryDb("DELETE FROM meta_api WHERE uid = 'local-user-uid'");
    await queryDb("DELETE FROM broadcast_log WHERE uid = 'local-user-uid'");
    await queryDb("DELETE FROM broadcast WHERE uid = 'local-user-uid'");
    await queryDb("DELETE FROM contact WHERE phonebook_id = 9999");
    await queryDb("DELETE FROM phonebook WHERE id = 9999");

  } catch (err) {
    console.error('Campaign audit failed:', err.message);
    auditLogs.error = err.message;
  }

  console.log('\n=== Campaign Audit Summary ===');
  console.log(JSON.stringify(auditLogs, null, 2));
  fs.writeFileSync('campaign_audit_report.json', JSON.stringify(auditLogs, null, 2));
})();
