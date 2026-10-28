const { Client } = require('pg');
const pool = require('../../database/config');

const CHANNEL = 'b1gcrm_inbox_changes';

// Workers and API processes share PostgreSQL, not a JavaScript EventEmitter.
// Send identifiers only; each authenticated socket reloads its authorized data.
async function publishInboxChange({ uid, chatId }) {
  await pool.query('SELECT pg_notify($1, $2)', [CHANNEL, JSON.stringify({ uid, chatId })]);
}

function subscribeInboxChanges(onChange, { retryMs = 3000 } = {}) {
  let stopped = false;
  let client;
  let reconnectTimer;
  function reconnect() {
    if (stopped || reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, retryMs);
    reconnectTimer.unref?.();
  }
  async function connect() {
    const previous = client;
    client = new Client(pool.options);
    const current = client;
    if (previous) previous.end().catch(() => {});
    const onDisconnect = () => {
      if (current === client) reconnect();
    };
    current.on('error', onDisconnect);
    current.on('end', onDisconnect);
    current.on('notification', (notification) => {
      if (stopped || current !== client || notification.channel !== CHANNEL) return;
      try {
        const payload = JSON.parse(notification.payload);
        if (typeof payload.uid === 'string' && typeof payload.chatId === 'string')
          onChange(payload);
      } catch {
        /* Ignore malformed notifications; they contain no trusted data. */
      }
    });
    try {
      await current.connect();
      if (stopped) {
        await current.end();
        return;
      }
      await current.query(`LISTEN ${CHANNEL}`);
    } catch (error) {
      console.error('Inbox notification listener unavailable:', error.message);
      reconnect();
    }
  }
  connect();
  return async () => {
    stopped = true;
    clearTimeout(reconnectTimer);
    if (client) await client.end().catch(() => {});
  };
}

module.exports = { publishInboxChange, subscribeInboxChanges };
