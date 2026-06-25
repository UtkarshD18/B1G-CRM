const { query } = require('../../database/dbpromise');
const registry = require('./ChannelAdapterRegistry');
const eventBus = require('./eventBus');
const { decrypt } = require('./encryption');

async function processIncomingQueue() {
  try {
    const queueItems = await query(
      `SELECT * FROM channel_incoming_queue 
       WHERE state = 'pending' 
       ORDER BY created_at ASC`
    );

    for (const item of queueItems) {
      await query(
        `UPDATE channel_incoming_queue SET state = 'processing', last_attempt_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [item.id]
      );

      const adapterClass = registry.getAdapterClass(item.channel_type);
      if (!adapterClass) {
        await query(
          `UPDATE channel_incoming_queue SET state = 'failed', last_error = 'Adapter not found' WHERE id = ?`,
          [item.id]
        );
        continue;
      }

      // Load settings
      const [settingRow] = await query(
        `SELECT settings FROM channel_settings WHERE uid = ? AND channel_type = ?`,
        [item.uid, item.channel_type]
      );
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
        await query(
          `UPDATE channel_incoming_queue SET state = 'failed', last_error = ? WHERE id = ?`,
          [errorMsg || "Payload normalization failed", item.id]
        );
        continue;
      }

      // Webhook Idempotency Check using provider message ID
      const providerMsgId = normalizedMsg.metadata?.message_id || normalizedMsg.metadata?.messages?.[0]?.id || normalizedMsg.metadata?.entry?.[0]?.messaging?.[0]?.message?.mid || "incoming-mock-id-" + Math.random();
      
      let isDuplicate = false;
      try {
        await query(
          `INSERT INTO webhook_idempotency (provider_message_id) VALUES (?)`,
          [providerMsgId]
        );
      } catch (dbErr) {
        // Unique constraint violation means we've already processed this message ID
        if (dbErr.code === '23505' || dbErr.message.includes('unique')) {
          isDuplicate = true;
        } else {
          console.error("Idempotency checking error:", dbErr.message);
        }
      }

      if (isDuplicate) {
        console.log(`[Idempotency] Duplicate webhook message detected (${providerMsgId}). Skipping...`);
        await query(
          `UPDATE channel_incoming_queue SET state = 'processed', last_error = 'Duplicate webhook message skipped' WHERE id = ?`,
          [item.id]
        );
        continue;
      }

      // Publish normalized message on Event Bus
      eventBus.emit('incoming_message', { ...normalizedMsg, uid: item.uid });

      await query(
        `UPDATE channel_incoming_queue SET state = 'processed' WHERE id = ?`,
        [item.id]
      );
    }
  } catch (err) {
    console.error("Incoming queue worker error:", err.message);
  }
}

let queueInterval = null;
function startIncomingQueueWorker(intervalMs = 3000) {
  if (queueInterval) clearInterval(queueInterval);
  queueInterval = setInterval(processIncomingQueue, intervalMs);
}

function stopIncomingQueueWorker() {
  if (queueInterval) {
    clearInterval(queueInterval);
    queueInterval = null;
  }
}

module.exports = {
  processIncomingQueue,
  startIncomingQueueWorker,
  stopIncomingQueueWorker
};
