require('dotenv').config();
const { Client } = require('pg');
const pool = require('../database/config');
const { query } = require('../database/dbpromise');
const os = require('os');
const { version } = require('../package.json');
const ConfigService = require('../utils/ConfigService');

const WORKER_NAME = 'schedulerWorker';
const HOSTNAME = os.hostname();
const PID = process.pid;

let dedicatedClient = null;
let isShuttingDown = false;
let heartbeatInterval = null;

async function upsertHeartbeat(status = 'RUNNING') {
  try {
    await query(
      `
      INSERT INTO transport_workers (worker_name, hostname, pid, status, last_seen, started_at, version)
      VALUES (?, ?, ?, ?, NOW(), NOW(), ?)
      ON CONFLICT (worker_name) DO UPDATE 
      SET hostname = EXCLUDED.hostname, 
          pid = EXCLUDED.pid, 
          status = EXCLUDED.status, 
          version = EXCLUDED.version, 
          last_seen = NOW();
    `,
      [WORKER_NAME, HOSTNAME, PID, status, version],
    );
  } catch (err) {
    console.error(`[${WORKER_NAME}] Error upserting heartbeat:`, err.message);
  }
}

async function startWorker() {
  console.log(`[${WORKER_NAME}] Starting sequence...`);

  const config = await ConfigService.getAll();

  const connectionString = process.env.DATABASE_URL;
  const clientConfig = connectionString
    ? { connectionString }
    : {
        host: process.env.PGHOST,
        port: process.env.PGPORT,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
      };
  if (process.env.PGSSL) clientConfig.ssl = { rejectUnauthorized: false };

  dedicatedClient = new Client(clientConfig);
  await dedicatedClient.connect();

  await upsertHeartbeat('STARTING');

  await upsertHeartbeat('RUNNING');
  heartbeatInterval = setInterval(() => upsertHeartbeat('RUNNING'), 15000);

  console.log(`[${WORKER_NAME}] Started successfully.`);
  await runCycle();
}

async function checkSlaEscalations() {
  try {
    const breachingChats = await query(
      `SELECT id, chat_id, uid, sender_name, last_incoming_time 
       FROM chats 
       WHERE last_reply_by = 'user' AND sla_violated = 0 AND sla_expires_at < CURRENT_TIMESTAMP`,
    );

    for (const chat of breachingChats) {
      await query('UPDATE chats SET sla_violated = 1 WHERE id = ?', [chat.id]);
      const existingEsc = await query(
        'SELECT * FROM escalation_queue WHERE chat_id = ? AND resolved = 0',
        [chat.chat_id],
      );
      if (existingEsc.length === 0) {
        await query('INSERT INTO escalation_queue (uid, chat_id, reason) VALUES (?, ?, ?)', [
          chat.uid,
          chat.chat_id,
          'SLA response window breached (unanswered for >5 minutes)',
        ]);
        console.log(`[Scheduler] Chat ${chat.chat_id} escalated due to SLA breach`);
      }
    }
  } catch (err) {
    console.error('[Scheduler] SLA Checker Error:', err.message);
  }
}

async function executeRetentionPolicies(config) {
  try {
    const {
      outgoingQueueRetentionDays = 30,
      deadLetterRetentionDays = 30,
      metricsRetentionDays = 90,
      webhookIdempotencyRetentionDays = 7,
      workerHeartbeatStaleMinutes = 5,
    } = config;

    await query(
      `DELETE FROM channel_outgoing_queue WHERE created_at < NOW() - CAST(? || ' days' AS INTERVAL) AND state IN ('sent', 'failed', 'dead_letter')`,
      [Number(outgoingQueueRetentionDays)],
    );
    await query(
      `DELETE FROM channel_incoming_queue WHERE created_at < NOW() - CAST(? || ' days' AS INTERVAL) AND state IN ('processed', 'failed')`,
      [Number(outgoingQueueRetentionDays)],
    );
    await query(
      `DELETE FROM channel_dead_letter_queue WHERE created_at < NOW() - CAST(? || ' days' AS INTERVAL)`,
      [Number(deadLetterRetentionDays)],
    );
    await query(
      `DELETE FROM channel_metrics WHERE updated_at < NOW() - CAST(? || ' days' AS INTERVAL)`,
      [Number(metricsRetentionDays)],
    );
    await query(
      `DELETE FROM webhook_idempotency WHERE processed_at < NOW() - CAST(? || ' days' AS INTERVAL)`,
      [Number(webhookIdempotencyRetentionDays)],
    );
    await query(
      `DELETE FROM transport_workers WHERE last_seen < NOW() - CAST(? || ' minutes' AS INTERVAL)`,
      [Number(workerHeartbeatStaleMinutes)],
    );
  } catch (err) {
    console.error(`[${WORKER_NAME}] Retention Policy Error:`, err.message);
  }
}

async function runCycle() {
  if (isShuttingDown) return;

  try {
    const lockRows = await query(`SELECT pg_try_advisory_lock(74002) as locked`);
    if (lockRows[0] && lockRows[0].locked) {
      const config = await ConfigService.getAll();

      await checkSlaEscalations();
      await executeRetentionPolicies(config);

      await query(`SELECT pg_advisory_unlock(74002)`);
    }
  } catch (err) {
    console.error(`[${WORKER_NAME}] Cycle error:`, err.message);
  }

  setTimeout(async () => {
    runCycle();
  }, 30000); // Poll every 30s
}

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n[${WORKER_NAME}] Received ${signal}, starting graceful shutdown...`);

  if (heartbeatInterval) clearInterval(heartbeatInterval);

  try {
    if (dedicatedClient) {
      await dedicatedClient.query('UNLISTEN *');
    }

    await query(`SELECT pg_advisory_unlock_all()`).catch(() => {});

    if (dedicatedClient) {
      await dedicatedClient.end();
    }

    await upsertHeartbeat('STOPPED');
    await pool.end();

    console.log(`[${WORKER_NAME}] Graceful shutdown complete.`);
    process.exit(0);
  } catch (err) {
    console.error(`[${WORKER_NAME}] Error during shutdown:`, err.message);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startWorker().catch((err) => {
  console.error(`[${WORKER_NAME}] Failed to start:`, err);
  process.exit(1);
});
