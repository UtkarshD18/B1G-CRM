const axios = require('axios');
const { Client } = require('pg');

const queryDb = async (sql, params = []) => {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'b1gcrm',
    password: process.env.PGPASSWORD || 'CHANGE_ME',
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
  const logs = {};

  try {
    // 1. Login as User
    console.log('Logging in as User...');
    const loginRes = await axios.post('http://localhost:3010/api/user/login', {
      email: 'user@example.com',
      password: process.env.TEST_USER_PASSWORD || 'CHANGE_ME'
    });
    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    const userUid = 'local-user-uid';

    // Cleanup past rules and logs
    await queryDb("DELETE FROM webhook_rules WHERE name = 'Audit Webhook Engine Rule'");
    await queryDb("DELETE FROM webhook_logs WHERE uid = $1", [userUid]);

    // 2. Create Webhook Rule
    console.log('Creating active Webhook Rule...');
    const ruleRes = await axios.post('http://localhost:3010/api/webhooks/rules', {
      name: 'Audit Webhook Engine Rule',
      source: 'external',
      event_type: 'message',
      match_field: 'body.text',
      match_operator: 'contains',
      match_value: 'trigger-webhook',
      action_type: 'send_webhook',
      action_payload: JSON.stringify({ url: 'http://localhost:3010/api/health', method: 'POST' }),
      active: true
    }, { headers });

    const ruleId = ruleRes.data.data.id;
    console.log('Created rule ID:', ruleId);

    // 3. Post mock message to trigger rule
    console.log('Triggering rule by posting mock incoming webhook message...');
    const webhookPayload = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    from: '1234567890',
                    id: 'mock_message_id_123',
                    timestamp: '1781773788',
                    text: {
                      body: 'this is a trigger-webhook message'
                    },
                    type: 'text'
                  }
                ],
                contacts: [
                  {
                    profile: {
                      name: 'Audit Sender'
                    },
                    wa_id: '1234567890'
                  }
                ]
              },
              field: 'messages'
            }
          ]
        }
      ]
    };

    const triggerRes = await axios.post(`http://localhost:3010/api/inbox/webhook/${userUid}`, webhookPayload);
    console.log('Trigger post status:', triggerRes.status);

    // 4. Wait for processing to complete (the engine logs asynchronously)
    console.log('Waiting for rule execution logs processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Verify log creation in database
    const dbLogs = await queryDb('SELECT * FROM webhook_logs WHERE rule_id = $1', [ruleId]);
    console.log('Database Webhook logs:', dbLogs);

    logs.webhookEngine = {
      ruleCreated: !!ruleId,
      triggerRequestSucceeded: triggerRes.status === 200,
      logEntryPersisted: dbLogs.length > 0,
      responseStatusReturned: dbLogs[0]?.response_status,
      logRow: dbLogs[0] || null
    };

    // Cleanup
    await queryDb("DELETE FROM webhook_rules WHERE id = $1", [ruleId]);
    await queryDb("DELETE FROM webhook_logs WHERE rule_id = $1", [ruleId]);

  } catch (err) {
    console.error('Webhook execution engine verification failed:', err.message);
    logs.error = err.message;
  }

  console.log('\n=== Webhook Execution Engine Audit Summary ===');
  console.log(JSON.stringify(logs, null, 2));
})();
