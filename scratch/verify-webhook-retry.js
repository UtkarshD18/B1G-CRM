require('dotenv').config();
const http = require('http');
const { Client } = require('pg');
const fs = require('fs');

const PORT = 3333;
const uid = 'local-user-uid';
const ruleName = 'test-webhook-retry-rule';

const queryDb = async (sql, params = []) => {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'b1gcrm',
    password: process.env.PGPASSWORD || '',
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
  console.log('=== Webhook Retry Engine Verification ===\n');
  const results = {
    serverVerification: false,
    retryCountVerified: false,
    backoffTimingVerified: false,
    databaseLoggingVerified: false,
    cleanup: false,
    pass: false
  };

  let requestCount = 0;
  const requestTimes = [];

  // 1. Start local mock HTTP server
  const server = http.createServer((req, res) => {
    requestCount++;
    requestTimes.push(Date.now());
    console.log(`[Mock Server] Received request ${requestCount}`);

    if (requestCount < 3) {
      // Fail the first two requests
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Server Error (Simulated)');
    } else {
      // Succeed on the third request
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, message: 'Simulated success' }));
    }
  });

  server.listen(PORT, '127.0.0.1', async () => {
    console.log(`Mock server listening on 127.0.0.1:${PORT}`);

    try {
      // 2. Setup rule in DB
      console.log('Setting up webhook rule in DB...');
      const insertRes = await queryDb(
        `INSERT INTO webhook_rules (uid, name, match_operator, match_value, action_type, action_payload, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [uid, ruleName, 'equals', 'trigger-webhook-retry', 'send_webhook', JSON.stringify({ url: `http://127.0.0.1:${PORT}/webhook` }), 1]
      );
      const ruleId = insertRes[0].id;
      console.log(`- Webhook rule created with ID: ${ruleId}`);

      // 3. Trigger rules processor
      console.log('\nProcessing webhook rules with mock matching conversation...');
      const { processWebhookRules } = require('../helper/webhooks/engine');

      const mockConversation = {
        newMessage: {
          chatId: 'test-chat-id-retry',
          senderMobile: '1234567890',
          senderName: 'Test Retry User',
          text: 'trigger-webhook-retry',
          timestamp: Date.now()
        }
      };

      await processWebhookRules({
        latestConversation: mockConversation,
        uid,
        origin: 'verification-origin'
      });

      console.log('\nVerification processing completed. Analyzing results...');

      // 4. Assert requestCount
      console.log(`- Total requests received by mock server: ${requestCount} (Expected: 3)`);
      if (requestCount === 3) {
        results.retryCountVerified = true;
      }

      // 5. Assert backoff timing (expecting ~1000ms delay between 1-2, and ~2000ms delay between 2-3)
      if (requestTimes.length === 3) {
        const delay1 = requestTimes[1] - requestTimes[0];
        const delay2 = requestTimes[2] - requestTimes[1];
        console.log(`- Delay between request 1 and 2: ${delay1}ms (Expected >= 950ms)`);
        console.log(`- Delay between request 2 and 3: ${delay2}ms (Expected >= 1900ms)`);

        if (delay1 >= 900 && delay2 >= 1800) {
          results.backoffTimingVerified = true;
          console.log('  ✅ Exponential backoff delays verified!');
        } else {
          console.log('  ❌ Backoff delays do not match expected exponential intervals.');
        }
      }

      // 6. Assert database logging
      const logs = await queryDb(
        `SELECT * FROM webhook_logs WHERE uid = $1 AND rule_id = $2 ORDER BY createdAt DESC LIMIT 1`,
        [uid, ruleId]
      );
      if (logs.length > 0) {
        const log = logs[0];
        console.log(`- Database log entry found.`);
        console.log(`  - Target URL: ${log.target_url}`);
        console.log(`  - Response Status: ${log.response_status} (Expected: 200)`);
        console.log(`  - Response Body: ${log.response_body}`);

        if (log.response_status === 200 && log.response_body.includes('Simulated success')) {
          results.databaseLoggingVerified = true;
          console.log('  ✅ Database logging of webhook outcome verified!');
        }
      } else {
        console.log('  ❌ No webhook log entry found in DB.');
      }

      // 7. Cleanup DB
      console.log('\nCleaning up database records...');
      await queryDb('DELETE FROM webhook_rules WHERE id = $1', [ruleId]);
      await queryDb('DELETE FROM webhook_logs WHERE uid = $1 AND rule_id = $2', [uid, ruleId]);
      results.cleanup = true;
      console.log('- Database cleanup completed.');

      // Check pass criteria
      if (results.retryCountVerified && results.backoffTimingVerified && results.databaseLoggingVerified && results.cleanup) {
        results.pass = true;
        console.log('\n✅ Webhook Retry Engine checks PASSED!');
      } else {
        console.log('\n❌ Webhook Retry Engine verification FAILED!');
      }

    } catch (err) {
      console.error('Verification failed with error:', err.message, err.stack);
      results.error = err.message;
    } finally {
      server.close(() => {
        console.log('Mock server closed.');
        fs.writeFileSync('webhook_retry_verification_report.json', JSON.stringify(results, null, 2));
        console.log('Report saved to webhook_retry_verification_report.json');
        process.exit(results.pass ? 0 : 1);
      });
    }
  });
})();
