require('dotenv').config();
const { Client } = require('pg');
const pool = require('../../database/config');
const { query, withTransaction } = require('../../database/dbpromise');
const os = require('os');
const { version } = require('../../package.json');
const ConfigService = require('../ConfigService');
const registry = require('./ChannelAdapterRegistry');
const eventBus = require('./eventBus');

const WORKER_NAME = 'incomingQueueWorker';
const HOSTNAME = os.hostname();
const PID = process.pid;

let dedicatedClient = null;
let isShuttingDown = false;
let heartbeatInterval = null;
let scanTimeout = null;

async function upsertHeartbeat(status = 'RUNNING') {
  try {
    await query(`
      INSERT INTO transport_workers (worker_name, hostname, pid, status, last_seen, started_at, version)
      VALUES (?, ?, ?, ?, NOW(), NOW(), ?)
      ON CONFLICT (worker_name) DO UPDATE 
      SET hostname = EXCLUDED.hostname, 
          pid = EXCLUDED.pid, 
          status = EXCLUDED.status, 
          version = EXCLUDED.version, 
          last_seen = NOW();
    `, [WORKER_NAME, HOSTNAME, PID, status, version]);
  } catch (err) {
    console.error(`[${WORKER_NAME}] Error upserting heartbeat:`, err.message);
  }
}

async function startIncomingQueueWorker() {
  console.log(`[${WORKER_NAME}] Starting sequence...`);
  
  const config = await ConfigService.getAll();

  const connectionString = process.env.DATABASE_URL;
  const clientConfig = connectionString ? { connectionString } : {
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  };
  if (process.env.PGSSL) clientConfig.ssl = { rejectUnauthorized: false };
  
  dedicatedClient = new Client(clientConfig);

  dedicatedClient.on('notification', async (msg) => {
    if (isShuttingDown) return;
    if (msg.channel === 'channel_incoming_queue') {
      await processQueueRow(msg.payload);
    }
  });

  dedicatedClient.on('error', (err) => {
    console.error(`[${WORKER_NAME}] Dedicated client error:`, err.message);
    if (!isShuttingDown) reconnectDedicatedClient(config.listenReconnectRetryDelayMs);
  });

  await dedicatedClient.connect();
  await dedicatedClient.query('LISTEN channel_incoming_queue');

  await upsertHeartbeat('STARTING');
  
  await runRecoveryScan();

  await upsertHeartbeat('RUNNING');
  heartbeatInterval = setInterval(() => upsertHeartbeat('RUNNING'), 15000);
  
  scheduleNextScan(config.recoveryScanIntervalSeconds * 1000 || 30000);

  console.log(`[${WORKER_NAME}] Started successfully.`);
}

async function reconnectDedicatedClient(delayMs) {
  if (isShuttingDown) return;
  try {
    await dedicatedClient.end().catch(() => {});
    dedicatedClient.connect();
    await dedicatedClient.query('LISTEN channel_incoming_queue');
    await runRecoveryScan();
  } catch (err) {
    setTimeout(() => reconnectDedicatedClient(delayMs), delayMs || 5000);
  }
}

function scheduleNextScan(intervalMs) {
  if (isShuttingDown) return;
  scanTimeout = setTimeout(async () => {
    await runRecoveryScan();
    scheduleNextScan(intervalMs);
  }, intervalMs);
}

async function runRecoveryScan() {
  if (isShuttingDown) return;
  try {
    const rows = await query(`
      SELECT id FROM channel_incoming_queue 
      WHERE state = 'pending' 
         OR (state = 'processing' AND processing_started_at < NOW() - INTERVAL '5 minutes')
      ORDER BY created_at ASC
    `);
    
    for (const row of rows) {
      if (isShuttingDown) break;
      await processQueueRow(row.id);
    }
  } catch (err) {
    console.error(`[${WORKER_NAME}] Recovery scan error:`, err.message);
  }
}

async function processQueueRow(id) {
  if (isShuttingDown) return;
  
  try {
    await withTransaction(async (txQuery) => {
      const lockedRows = await txQuery(`
        SELECT * FROM channel_incoming_queue 
        WHERE id = ? AND (state = 'pending' OR (state = 'processing' AND processing_started_at < NOW() - INTERVAL '5 minutes'))
        FOR UPDATE SKIP LOCKED
      `, [id]);
      
      if (lockedRows.length === 0) return;
      
      const item = lockedRows[0];
      
      console.log(JSON.stringify({
        event: "inbound_message_processing",
        correlation_id: item.correlation_id,
        queue_id: item.id,
        worker: WORKER_NAME,
        channel: item.channel_type,
        message: "Started processing incoming message"
      }));

      await txQuery(`UPDATE channel_incoming_queue SET state = 'processing', processing_started_at = NOW(), last_attempt_at = NOW() WHERE id = ?`, [item.id]);
      
      const adapterClass = registry.getAdapterClass(item.channel_type);
      if (!adapterClass) {
        console.log(JSON.stringify({
          event: "inbound_message_failed",
          correlation_id: item.correlation_id,
          queue_id: item.id,
          worker: WORKER_NAME,
          channel: item.channel_type,
          error: "Adapter not found",
          message: "Failed to process incoming message"
        }));
        await txQuery(`UPDATE channel_incoming_queue SET state = 'failed', last_error = 'Adapter not found' WHERE id = ?`, [item.id]);
        return;
      }

      const [settingRow] = await txQuery(`SELECT settings FROM channel_settings WHERE uid = ? AND channel_type = ?`, [item.uid, item.channel_type]);
      const settings = settingRow?.settings || {};

      const adapter = new adapterClass(item.uid, {}, settings);

      let normalizedMsg = null;
      let errorMsg = null;

      try {
        await adapter.beforeReceive(item.payload);
        normalizedMsg = adapter.normalizeIncoming(item.payload);
        await adapter.afterReceive(item.payload, normalizedMsg);
      } catch (err) {
        errorMsg = err.message;
      }

      if (!normalizedMsg) {
        console.log(JSON.stringify({
          event: "inbound_message_failed",
          correlation_id: item.correlation_id,
          queue_id: item.id,
          worker: WORKER_NAME,
          channel: item.channel_type,
          error: errorMsg || "Payload normalization failed",
          message: "Failed to process incoming message"
        }));
        await txQuery(`UPDATE channel_incoming_queue SET state = 'failed', last_error = ? WHERE id = ?`, [errorMsg || "Payload normalization failed", item.id]);
        return;
      }

      const providerMsgId = normalizedMsg.metadata?.message_id || normalizedMsg.metadata?.messages?.[0]?.id || normalizedMsg.metadata?.entry?.[0]?.messaging?.[0]?.message?.mid || item.provider_message_id || ("incoming-mock-id-" + item.id);
      
      try {
        await txQuery(`INSERT INTO webhook_idempotency (provider_message_id) VALUES (?)`, [providerMsgId]);
      } catch (dbErr) {
        if (dbErr.code === '23505' || dbErr.message.includes('unique')) {
          console.log(JSON.stringify({
            event: "inbound_message_idempotency_skip",
            correlation_id: item.correlation_id,
            queue_id: item.id,
            worker: WORKER_NAME,
            channel: item.channel_type,
            message_id: providerMsgId,
            message: "Duplicate webhook message skipped"
          }));
          await txQuery(`UPDATE channel_incoming_queue SET state = 'processed', last_error = 'Duplicate webhook message skipped', provider_message_id = ? WHERE id = ?`, [providerMsgId, item.id]);
          return;
        } else {
          throw dbErr;
        }
      }

      eventBus.emit('incoming_message', { ...normalizedMsg, uid: item.uid, correlation_id: item.correlation_id });

      console.log(JSON.stringify({
        event: "inbound_message_processed",
        correlation_id: item.correlation_id,
        queue_id: item.id,
        worker: WORKER_NAME,
        channel: item.channel_type,
        message_id: providerMsgId,
        message: "Successfully processed incoming message"
      }));

      await txQuery(`UPDATE channel_incoming_queue SET state = 'processed', provider_message_id = ? WHERE id = ?`, [providerMsgId, item.id]);
    });
  } catch (err) {
    console.error(`[${WORKER_NAME}] Error processing row ${id}:`, err.message);
  }
}

function stopIncomingQueueWorker() {
  shutdown('SIGTERM');
}

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n[${WORKER_NAME}] Received ${signal}, starting graceful shutdown...`);

  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (scanTimeout) clearTimeout(scanTimeout);

  try {
    if (dedicatedClient) {
      await dedicatedClient.query('UNLISTEN *');
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

module.exports = {
  startIncomingQueueWorker,
  stopIncomingQueueWorker,
  processIncomingQueue: runRecoveryScan
};
