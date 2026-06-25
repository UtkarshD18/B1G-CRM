const { query } = require('../../database/dbpromise');
const registry = require('./ChannelAdapterRegistry');
const { decrypt } = require('./encryption');

// Simple in-memory Circuit Breaker Registry
const circuitBreakers = new Map();

function getCircuitBreaker(uid, channelType) {
  const key = `${uid}:${channelType}`;
  if (!circuitBreakers.has(key)) {
    circuitBreakers.set(key, {
      state: "CLOSED", // "CLOSED", "OPEN", "HALF_OPEN"
      failures: 0,
      lastFailureTime: null
    });
  }
  return circuitBreakers.get(key);
}

// Simple in-memory Token Bucket Rate Limiter
const rateLimiters = new Map();

function checkRateLimit(uid, channelType, limits) {
  const key = `${uid}:${channelType}`;
  if (!rateLimiters.has(key)) {
    rateLimiters.set(key, {
      tokens: limits.burst || 10,
      lastRefill: Date.now()
    });
  }

  const limiter = rateLimiters.get(key);
  const now = Date.now();
  const timePassed = now - limiter.lastRefill;
  const refillRate = (limits.requestsPerMinute || 60) / 60000; // tokens per ms

  limiter.tokens = Math.min(limits.burst || 10, limiter.tokens + timePassed * refillRate);
  limiter.lastRefill = now;

  if (limiter.tokens >= 1) {
    limiter.tokens -= 1;
    return true;
  }
  return false;
}

async function processOutgoingQueue() {
  try {
    const queueItems = await query(
      `SELECT * FROM channel_outgoing_queue 
       WHERE state IN ('pending', 'retrying') 
       AND (scheduled_at IS NULL OR scheduled_at <= CURRENT_TIMESTAMP)
       AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
       ORDER BY priority DESC, created_at ASC`
    );

    for (const item of queueItems) {
      const cb = getCircuitBreaker(item.uid, item.channel_type);
      
      // If Circuit Breaker is OPEN, check if cooldown period (e.g. 30 sec) has passed
      if (cb.state === "OPEN") {
        if (Date.now() - cb.lastFailureTime > 30000) {
          cb.state = "HALF_OPEN";
          console.log(`[Circuit Breaker] Cooldown expired. Testing half-open state for ${item.channel_type}`);
        } else {
          console.log(`[Circuit Breaker] OPEN state blocks message sending for ${item.channel_type}`);
          continue;
        }
      }

      // Load adapter metadata and check limits
      const adapterClass = registry.getAdapterClass(item.channel_type);
      if (!adapterClass) {
        await query(
          `UPDATE channel_outgoing_queue SET state = 'dead_letter', last_error = 'Adapter not found' WHERE id = ?`,
          [item.id]
        );
        continue;
      }

      const dummyAdapter = new adapterClass(item.uid);
      if (!checkRateLimit(item.uid, item.channel_type, dummyAdapter.limits)) {
        console.warn(`[Rate Limiter] Rate limit exceeded for ${item.channel_type}. Throttling...`);
        continue;
      }

      // Load credentials and settings
      const [credRow] = await query(
        `SELECT credentials FROM channel_credentials WHERE uid = ? AND channel_type = ?`,
        [item.uid, item.channel_type]
      );
      const [settingRow] = await query(
        `SELECT settings FROM channel_settings WHERE uid = ? AND channel_type = ?`,
        [item.uid, item.channel_type]
      );

      let creds = {};
      if (credRow?.credentials) {
        try {
          const decrypted = decrypt(credRow.credentials);
          creds = JSON.parse(decrypted);
        } catch (e) {
          console.error("Credentials decryptions failed in send loop:", e.message);
        }
      }

      const settings = settingRow?.settings || {};
      const adapter = new adapterClass(item.uid, creds, settings);

      // Execute Send
      let sendSuccess = false;
      let errorMsg = null;
      let result = null;
      const startTime = Date.now();

      await query(
        `UPDATE channel_outgoing_queue SET state = 'sending', last_attempt_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [item.id]
      );

      try {
        await adapter.beforeSend(item.payload);
        result = await adapter.send(item.payload);
        sendSuccess = !!result.success;
        await adapter.afterSend(item.payload, result);
      } catch (err) {
        errorMsg = err.message;
      }

      const latency = Date.now() - startTime;

      if (sendSuccess) {
        cb.state = "CLOSED";
        cb.failures = 0;

        await query(
          `UPDATE channel_outgoing_queue 
           SET state = 'sent', provider_message_id = ?, attempts = attempts + 1, last_error = NULL 
           WHERE id = ?`,
          [result.provider_message_id || null, item.id]
        );

        // Update metrics
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
        cb.failures += 1;
        cb.lastFailureTime = Date.now();
        if (cb.failures >= 3) {
          cb.state = "OPEN";
          console.warn(`[Circuit Breaker] State tripped to OPEN for ${item.channel_type} after ${cb.failures} failures.`);
        }

        const maxAttempts = adapter.retryPolicy?.maxAttempts || 5;
        const attempts = item.attempts + 1;
        const willRetry = attempts < maxAttempts;

        await query(
          `UPDATE channel_outgoing_queue 
           SET state = ?, attempts = ?, last_error = ? 
           WHERE id = ?`,
          [willRetry ? "retrying" : "dead_letter", attempts, errorMsg || "Unknown Failure", item.id]
        );

        // Update metrics
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
    }
  } catch (err) {
    console.error("Outgoing queue processing error:", err.message);
  }
}

let queueInterval = null;
function startOutgoingQueueWorker(intervalMs = 5000) {
  if (queueInterval) clearInterval(queueInterval);
  queueInterval = setInterval(processOutgoingQueue, intervalMs);
}

function stopOutgoingQueueWorker() {
  if (queueInterval) {
    clearInterval(queueInterval);
    queueInterval = null;
  }
}

module.exports = {
  processOutgoingQueue,
  startOutgoingQueueWorker,
  stopOutgoingQueueWorker
};
