require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const pool = require('../../database/config');
const { query, withTransaction } = require('../../database/dbpromise');
const os = require('os');
const { version } = require('../../package.json');
const ConfigService = require('../ConfigService');
const registry = require('./ChannelAdapterRegistry');
const { decrypt } = require('./encryption');

const logger = require('../logger');
const WORKER_NAME = 'retryQueueWorker';
const HOSTNAME = os.hostname();
const PID = process.pid;

let dedicatedClient = null;
let isShuttingDown = false;
let heartbeatInterval = null;
let scanTimeout = null;

const circuitBreakers = new Map();
function getCircuitBreaker(uid, channelType) {
  const key = `${uid}:${channelType}`;
  if (!circuitBreakers.has(key)) {
    circuitBreakers.set(key, { state: "CLOSED", failures: 0, lastFailureTime: null });
  }
  return circuitBreakers.get(key);
}

const rateLimiters = new Map();
function checkRateLimit(uid, channelType, limits) {
  const key = `${uid}:${channelType}`;
  if (!rateLimiters.has(key)) rateLimiters.set(key, { tokens: limits.burst || 10, lastRefill: Date.now() });
  
  const limiter = rateLimiters.get(key);
  const now = Date.now();
  const refillRate = (limits.requestsPerMinute || 60) / 60000;
  
  limiter.tokens = Math.min(limits.burst || 10, limiter.tokens + (now - limiter.lastRefill) * refillRate);
  limiter.lastRefill = now;
  
  if (limiter.tokens >= 1) {
    limiter.tokens -= 1;
    return true;
  }
  return false;
}

function convertNumberToRandomString(number) {
  if (!number) return "NA";
  const mapping = { 0: "i", 1: "j", 2: "I", 3: "u", 4: "I", 5: "U", 6: "S", 7: "D", 8: "B", 9: "j" };
  const numStr = number.toString();
  let result = "";
  for (let i = 0; i < numStr.length; i++) result += mapping[numStr[i]] || numStr[i];
  return result;
}

async function syncMessageState(uid, recipientId, correlationId, newState, providerMessageId) {
  try {
    const chatId = convertNumberToRandomString(recipientId);
    const chatPath = path.join(__dirname, '..', '..', 'conversations', 'inbox', uid.toString(), `${chatId}.json`);
    
    let chatData = [];
    if (fs.existsSync(chatPath)) {
      try {
        chatData = JSON.parse(fs.readFileSync(chatPath, 'utf8'));
      } catch (e) {
        logger.warn(`[${WORKER_NAME}] Corrupt JSON file for ${uid}/${chatId}`);
      }
    }
    
    let matchedMsg = null;
    let matchedIdx = -1;
    
    // Fallback matching logic as mandated
    for (let i = chatData.length - 1; i >= 0; i--) {
      const msg = chatData[i];
      if (msg.metaChatId === correlationId || msg.metaChatId === providerMessageId) {
        matchedMsg = msg;
        matchedIdx = i;
        break;
      }
    }

    if (matchedMsg) {
      if (matchedMsg.status === newState && matchedMsg.metaChatId === (providerMessageId || correlationId)) {
        return; // Idempotent: already mutated
      }
      
      matchedMsg.status = newState;
      if (providerMessageId) {
        matchedMsg.metaChatId = providerMessageId;
      }
      
      fs.writeFileSync(chatPath, JSON.stringify(chatData, null, 2));

      // Sync chats table idempotently
      const [chatRow] = await query(`SELECT last_message FROM chats WHERE chat_id = ? AND uid = ?`, [chatId, uid]);
      if (chatRow && chatRow.last_message) {
        try {
          const lastMsg = JSON.parse(chatRow.last_message);
          if (lastMsg.metaChatId === correlationId || lastMsg.metaChatId === providerMessageId) {
            lastMsg.status = newState;
            if (providerMessageId) lastMsg.metaChatId = providerMessageId;
            await query(`UPDATE chats SET last_message = ? WHERE chat_id = ? AND uid = ?`, [JSON.stringify(lastMsg), chatId, uid]);
          }
        } catch (e) {}
      }
    } else {
      logger.warn(JSON.stringify({
        event: "json_sync_warning",
        correlation_id: correlationId,
        uid,
        message: "Message not found in JSON cache during sync"
      }));
    }
  } catch (err) {
    logger.warn(`[${WORKER_NAME}] JSON sync isolated failure: ${err.message}`);
  }
}

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
    logger.error(`[${WORKER_NAME}] Error upserting heartbeat:`, err.message);
  }
}

async function startOutgoingQueueWorker() {
  logger.info(`[${WORKER_NAME}] Starting sequence...`);
  
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
    if (msg.channel === 'channel_outgoing_queue') {
      await processQueueRow(msg.payload);
    }
  });

  dedicatedClient.on('error', (err) => {
    logger.error(`[${WORKER_NAME}] Dedicated client error:`, err.message);
    if (!isShuttingDown) reconnectDedicatedClient(config.listenReconnectRetryDelayMs);
  });

  await dedicatedClient.connect();
  await dedicatedClient.query('LISTEN channel_outgoing_queue');

  await upsertHeartbeat('STARTING');
  
  await runRecoveryScan();

  await upsertHeartbeat('RUNNING');
  heartbeatInterval = setInterval(() => upsertHeartbeat('RUNNING'), 15000);
  
  scheduleNextScan(config.recoveryScanIntervalSeconds * 1000 || 30000);

  logger.info(`[${WORKER_NAME}] Started successfully.`);
}

async function reconnectDedicatedClient(delayMs) {
  if (isShuttingDown) return;
  try {
    await dedicatedClient.end().catch(() => {});
    dedicatedClient.connect();
    await dedicatedClient.query('LISTEN channel_outgoing_queue');
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
      SELECT id FROM channel_outgoing_queue 
      WHERE (state IN ('pending', 'retrying') 
         OR (state = 'processing' AND processing_started_at < NOW() - INTERVAL '5 minutes'))
      AND (scheduled_at IS NULL OR scheduled_at <= CURRENT_TIMESTAMP)
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      ORDER BY priority DESC, created_at ASC
    `);
    
    for (const row of rows) {
      if (isShuttingDown) break;
      await processQueueRow(row.id);
    }
  } catch (err) {
    logger.error(`[${WORKER_NAME}] Recovery scan error:`, err.message);
  }
}

async function processQueueRow(id) {
  if (isShuttingDown) return;
  
  let item = null;
  try {
    await withTransaction(async (txQuery) => {
      const lockedRows = await txQuery(`
        SELECT * FROM channel_outgoing_queue 
        WHERE id = ? 
        AND (state IN ('pending', 'retrying') OR (state = 'processing' AND processing_started_at < NOW() - INTERVAL '5 minutes'))
        AND (scheduled_at IS NULL OR scheduled_at <= CURRENT_TIMESTAMP)
        FOR UPDATE SKIP LOCKED
      `, [id]);
      
      if (lockedRows.length === 0) return;
      item = lockedRows[0];
      
      logger.info(JSON.stringify({
        event: "outbound_message_processing",
        correlation_id: item.correlation_id,
        queue_id: item.id,
        worker: WORKER_NAME,
        channel: item.channel_type,
        message: "Started processing outgoing message"
      }));

      await txQuery(`UPDATE channel_outgoing_queue SET state = 'processing', processing_started_at = NOW(), last_attempt_at = NOW() WHERE id = ?`, [item.id]);
    });
  } catch (err) {
    logger.error(`[${WORKER_NAME}] Error locking row ${id}:`, err.message);
    return;
  }
  
  if (!item) return;

  // -- OUTSIDE TRANSACTION: PROVIDER CALL --
  let sendSuccess = false;
  let errorMsg = null;
  let result = null;
  const startTime = Date.now();

  try {
    const cb = getCircuitBreaker(item.uid, item.channel_type);
    if (cb.state === "OPEN") {
      if (Date.now() - cb.lastFailureTime > 30000) {
        cb.state = "HALF_OPEN";
      } else {
        throw new Error("Circuit breaker OPEN");
      }
    }

    const adapterClass = registry.getAdapterClass(item.channel_type);
    if (!adapterClass) throw new Error('Adapter not found');

    const dummyAdapter = new adapterClass(item.uid);
    if (!checkRateLimit(item.uid, item.channel_type, dummyAdapter.limits)) {
      throw new Error("Rate limit exceeded");
    }

    const [credRow] = await query(`SELECT credentials FROM channel_credentials WHERE uid = ? AND channel_type = ?`, [item.uid, item.channel_type]);
    const [settingRow] = await query(`SELECT settings FROM channel_settings WHERE uid = ? AND channel_type = ?`, [item.uid, item.channel_type]);

    let creds = {};
    if (credRow?.credentials) {
      try { creds = JSON.parse(decrypt(credRow.credentials)); } catch (e) {}
    }
    const settings = settingRow?.settings || {};
    const adapter = new adapterClass(item.uid, creds, settings);

    await adapter.beforeSend(item.payload);
    
    // Configurable timeout loaded through ConfigService in real-world, fallback here 30000ms
    const timeoutMs = 30000;
    const sendPromise = adapter.send(item.payload);
    result = await Promise.race([
      sendPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Provider timeout')), timeoutMs))
    ]);

    sendSuccess = !!result.success;
    await adapter.afterSend(item.payload, result);
    
    if (cb.state !== "CLOSED") {
      cb.state = "CLOSED";
      cb.failures = 0;
      await query(`UPDATE channel_connections SET circuit_state = 'CLOSED', failure_count = 0 WHERE uid = ? AND channel_type = ?`, [item.uid, item.channel_type]);
    }
  } catch (err) {
    errorMsg = err.message;
    sendSuccess = false;
    
    const cb = getCircuitBreaker(item.uid, item.channel_type);
    cb.failures += 1;
    cb.lastFailureTime = Date.now();
    let newState = cb.state;
    if (cb.failures >= 3 && cb.state !== "OPEN") {
      cb.state = "OPEN";
      newState = "OPEN";
    }
    
    await query(`UPDATE channel_connections SET circuit_state = ?, failure_count = ?, last_failure_at = NOW() WHERE uid = ? AND channel_type = ?`, 
      [newState, cb.failures, item.uid, item.channel_type]);
  }

  const latency = Date.now() - startTime;

  // -- FINALIZE STATE --
  try {
    if (sendSuccess) {
      logger.info(JSON.stringify({
        event: "outbound_message_processed",
        correlation_id: item.correlation_id,
        queue_id: item.id,
        worker: WORKER_NAME,
        channel: item.channel_type,
        message_id: result?.provider_message_id,
        latency,
        message: "Successfully processed outgoing message"
      }));

      await query(
        `UPDATE channel_outgoing_queue 
         SET state = 'sent', provider_message_id = ?, attempts = attempts + 1, last_error = NULL 
         WHERE id = ?`,
        [result?.provider_message_id || null, item.id]
      );
      
      let payloadObj = {};
      try { payloadObj = JSON.parse(item.payload); } catch (e) {}
      await syncMessageState(item.uid, payloadObj.recipientId, item.correlation_id, 'sent', result?.provider_message_id);

      await query(
        `INSERT INTO channel_metrics (uid, channel_type, messages_sent, avg_latency_ms, success_rate, updated_at)
         VALUES (?, ?, 1, ?, 100.00, CURRENT_TIMESTAMP)
         ON CONFLICT (uid, channel_type) DO UPDATE SET
         messages_sent = channel_metrics.messages_sent + 1,
         avg_latency_ms = (channel_metrics.avg_latency_ms * channel_metrics.messages_sent + ?) / (channel_metrics.messages_sent + 1),
         success_rate = (channel_metrics.messages_sent + 1)::numeric / (channel_metrics.messages_sent + channel_metrics.messages_failed + 1)::numeric * 100.00,
         updated_at = CURRENT_TIMESTAMP`,
        [item.uid, item.channel_type, latency, latency]
      );
    } else {
      const adapterClass = registry.getAdapterClass(item.channel_type);
      const dummyAdapter = adapterClass ? new adapterClass(item.uid) : null;
      const maxAttempts = dummyAdapter?.retryPolicy?.maxAttempts || 5;
      const attempts = item.attempts + 1;
      const willRetry = attempts < maxAttempts;
      
      logger.info(JSON.stringify({
        event: "outbound_message_failed",
        correlation_id: item.correlation_id,
        queue_id: item.id,
        worker: WORKER_NAME,
        channel: item.channel_type,
        error: errorMsg || "Unknown Failure",
        attempts,
        will_retry: willRetry,
        latency,
        message: "Failed to process outgoing message"
      }));

      await query(
        `UPDATE channel_outgoing_queue 
         SET state = ?, attempts = ?, last_error = ? 
         WHERE id = ?`,
        [willRetry ? "retrying" : "dead_letter", attempts, errorMsg || "Unknown Failure", item.id]
      );
      
      let payloadObj = {};
      try { payloadObj = JSON.parse(item.payload); } catch (e) {}
      await syncMessageState(item.uid, payloadObj.recipientId, item.correlation_id, willRetry ? 'retrying' : 'failed', null);

      if (!willRetry) {
        await query(
          `INSERT INTO channel_dead_letter_queue (uid, channel_type, payload, attempts, last_error, correlation_id, provider_message_id) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [item.uid, item.channel_type, JSON.stringify(item.payload), attempts, errorMsg, item.correlation_id, null]
        );
      }
      
      await query(
        `INSERT INTO channel_metrics (uid, channel_type, messages_failed, retry_count, updated_at)
         VALUES (?, ?, 1, 1, CURRENT_TIMESTAMP)
         ON CONFLICT (uid, channel_type) DO UPDATE SET
         messages_failed = channel_metrics.messages_failed + 1,
         retry_count = channel_metrics.retry_count + 1,
         success_rate = channel_metrics.messages_sent::numeric / (channel_metrics.messages_sent + channel_metrics.messages_failed + 1)::numeric * 100.00,
         updated_at = CURRENT_TIMESTAMP`,
        [item.uid, item.channel_type]
      );
    }
  } catch (dbErr) {
    logger.error(`[${WORKER_NAME}] Error saving result for row ${id}:`, dbErr.message);
  }
}

function stopOutgoingQueueWorker() {
  shutdown('SIGTERM');
}

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`\n[${WORKER_NAME}] Received ${signal}, starting graceful shutdown...`);

  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (scanTimeout) clearTimeout(scanTimeout);

  try {
    if (dedicatedClient) {
      await dedicatedClient.query('UNLISTEN *');
      await dedicatedClient.end();
    }
    
    await upsertHeartbeat('STOPPED');
    await pool.end();

    logger.info(`[${WORKER_NAME}] Graceful shutdown complete.`);
    process.exit(0);
  } catch (err) {
    logger.error(`[${WORKER_NAME}] Error during shutdown:`, err.message);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = {
  startOutgoingQueueWorker,
  stopOutgoingQueueWorker,
  processOutgoingQueue: runRecoveryScan
};
