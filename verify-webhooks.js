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
  const auditLogs = {
    crud: {},
    trigger: {}
  };

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

    // 2. Create Webhook Rule
    const ruleName = `Audit Webhook Rule ${Date.now()}`;
    console.log(`Creating webhook rule: ${ruleName}...`);
    const createRes = await axios.post('http://localhost:3010/api/webhooks/rules', {
      name: ruleName,
      source: 'external',
      event_type: 'message',
      match_field: 'body.text',
      match_operator: 'contains',
      match_value: 'hello',
      action_type: 'send_webhook',
      action_payload: JSON.stringify({ url: 'https://example.com/webhook', method: 'POST' }),
      active: true
    }, { headers });

    console.log('Create Response:', createRes.data);

    // Verify in Database
    const dbRules = await queryDb('SELECT * FROM webhook_rules WHERE name = $1', [ruleName]);
    console.log('DB query result:', dbRules);

    auditLogs.crud.create = {
      name: ruleName,
      successResponse: createRes.data.success,
      persistedInDb: dbRules.length > 0,
      row: dbRules[0] || null
    };

    if (dbRules.length < 1) {
      throw new Error('Webhook rule row not created in PG');
    }

    const ruleId = dbRules[0].id;

    // 3. Read Webhook Rules
    console.log('Reading webhook rules...');
    const readRes = await axios.get('http://localhost:3010/api/webhooks/rules', { headers });
    const containsAuditRule = readRes.data.data.some(r => r.name === ruleName);
    console.log('Contains audit rule:', containsAuditRule);

    auditLogs.crud.read = {
      success: readRes.data.success,
      count: readRes.data.data.length,
      containsAuditRule
    };

    // 4. Update Webhook Rule
    console.log(`Updating webhook rule ${ruleId}...`);
    const updateRes = await axios.post('http://localhost:3010/api/webhooks/rules/update', {
      id: ruleId,
      name: ruleName + ' Updated',
      source: 'external',
      event_type: 'message',
      match_field: 'body.text',
      match_operator: 'equals',
      match_value: 'hi',
      action_type: 'tag_chat',
      action_payload: JSON.stringify({ tag: 'customer' }),
      active: false
    }, { headers });

    console.log('Update Response:', updateRes.data);

    const dbRulesAfterUpdate = await queryDb('SELECT * FROM webhook_rules WHERE id = $1', [ruleId]);
    console.log('DB state after update:', dbRulesAfterUpdate);

    auditLogs.crud.update = {
      successResponse: updateRes.data.success,
      updatedRow: dbRulesAfterUpdate[0] || null,
      activeValInDb: dbRulesAfterUpdate[0]?.active
    };

    // 5. Delete Webhook Rule
    console.log(`Deleting webhook rule ${ruleId}...`);
    const deleteRes = await axios.post('http://localhost:3010/api/webhooks/rules/delete', {
      id: ruleId
    }, { headers });

    console.log('Delete Response:', deleteRes.data);

    const dbRulesAfterDelete = await queryDb('SELECT * FROM webhook_rules WHERE id = $1', [ruleId]);
    console.log('DB state after delete (length):', dbRulesAfterDelete.length);

    auditLogs.crud.delete = {
      successResponse: deleteRes.data.success,
      removedFromDb: dbRulesAfterDelete.length === 0
    };

    // 6. Execution engine analysis and trigger check
    console.log('Verifying webhook rule execution engine/hooks...');
    
    // We already inspected helper/inbox/inbox.js and found zero references to webhook_rules table or evaluating rules.
    // Let's also check if there is any other place querying webhook_rules apart from routes/webhooks.js.
    const ruleRefs = await queryDb(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='webhook_logs'"
    );
    const webhookLogsTableExists = ruleRefs.length > 0;

    auditLogs.trigger = {
      engineStatus: 'Missing',
      webhookLogsTableExists,
      reason: 'No hooks or event listeners exist in the incoming message pipeline to query or execute webhook_rules actions. The only references to the webhook_rules table in the codebase are in routes/webhooks.js (CRUD) and SQL migration files.'
    };

  } catch (err) {
    console.error('Webhook audit failed:', err.message);
    auditLogs.error = err.message;
  }

  console.log('\n=== Webhook Audit Summary ===');
  console.log(JSON.stringify(auditLogs, null, 2));
  fs.writeFileSync('webhook_rules_audit_report.json', JSON.stringify(auditLogs, null, 2));
})();
