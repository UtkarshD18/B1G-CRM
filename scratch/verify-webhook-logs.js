const axios = require('axios');
const { Client } = require('pg');
const fs = require('fs');

const queryDb = async (sql, params = []) => {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'b1gcrm',
    password: process.env.PGPASSWORD || 'b1gcrm123',
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
  console.log('=== Webhook Logs Endpoint Verification ===');
  const auditLogs = {
    auth: false,
    insertTestRow: false,
    apiResponse: null,
    cleanup: false,
    pass: false
  };

  try {
    // 1. Authenticate to get JWT token
    console.log('Logging in as User...');
    const loginRes = await axios.post('http://localhost:3010/api/user/login', {
      email: 'user@example.com',
      password: process.env.TEST_USER_PASSWORD || 'User@123'
    });

    const token = loginRes.data.token;
    if (!token) {
      throw new Error('Failed to login, token not returned');
    }
    auditLogs.auth = true;
    const headers = { Authorization: `Bearer ${token}` };

    // 2. Insert a temporary test log row for local-user-uid
    console.log('Inserting a temporary test row into webhook_logs...');
    const testPayload = JSON.stringify({ message: "hello test" });
    const testResponseBody = JSON.stringify({ success: true, received: true });
    
    const insertRes = await queryDb(
      `INSERT INTO webhook_logs (uid, rule_name, target_url, payload, response_status, response_body)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['local-user-uid', 'Test Rule E2E', 'https://httpbin.org/post', testPayload, 200, testResponseBody]
    );
    const testLogId = insertRes[0].id;
    console.log('Inserted test log ID:', testLogId);
    auditLogs.insertTestRow = true;

    // 3. Request the logs endpoint
    console.log('Requesting GET /api/webhooks/logs...');
    const getRes = await axios.get('http://localhost:3010/api/webhooks/logs', { headers });
    
    console.log('API success response:', getRes.data.success);
    console.log('API returned logs count:', getRes.data.data?.length);
    
    const foundTestLog = getRes.data.data?.find(log => log.id === testLogId);
    console.log('Found inserted test log in API response:', !!foundTestLog);

    auditLogs.apiResponse = {
      success: getRes.data.success,
      count: getRes.data.data?.length,
      foundTestLog: !!foundTestLog,
      matchDetails: foundTestLog ? {
        rule_name: foundTestLog.rule_name,
        target_url: foundTestLog.target_url,
        response_status: foundTestLog.response_status
      } : null
    };

    // 4. Delete the temporary test log row
    console.log('Cleaning up temporary test row...');
    await queryDb('DELETE FROM webhook_logs WHERE id = $1', [testLogId]);
    auditLogs.cleanup = true;

    // Evaluate success
    if (auditLogs.auth && auditLogs.insertTestRow && auditLogs.apiResponse?.success && auditLogs.apiResponse?.foundTestLog && auditLogs.cleanup) {
      auditLogs.pass = true;
      console.log('✅ End-to-end verification PASSED!');
    } else {
      console.log('❌ End-to-end verification FAILED!');
    }

  } catch (err) {
    console.error('Webhook Logs verification failed:', err.message);
    auditLogs.error = err.message;
  }

  fs.writeFileSync('webhook_logs_verification_report.json', JSON.stringify(auditLogs, null, 2));
  console.log('Report saved to webhook_logs_verification_report.json');
})();
