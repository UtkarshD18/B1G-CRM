require('dotenv').config();
const { Client } = require('pg');
const pool = require('../database/config');
const { query } = require('../database/dbpromise');
const os = require('os');
const { version } = require('../package.json');
const ConfigService = require('../utils/ConfigService');
const { runHealthChecks } = require('../utils/channels/healthMonitor');

const WORKER_NAME = 'healthWorker';
const HOSTNAME = os.hostname();
const PID = process.pid;

let dedicatedClient = null;
let isShuttingDown = false;
let heartbeatInterval = null;

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

async function startWorker() {
  console.log(`[${WORKER_NAME}] Starting sequence...`);
  
  // 1. Load runtime configuration
  const config = await ConfigService.getAll();
  
  // 2. Initialize general PostgreSQL query pool (done via require)

  // 3. Initialize dedicated LISTEN pg.Client
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
  await dedicatedClient.connect();

  // 4. Register LISTEN subscriptions (None required for healthWorker)
  
  // 5. Register or UPSERT its heartbeat
  await upsertHeartbeat('STARTING');

  // 6. Execute an initial recovery scan (N/A for healthWorker)

  // 7. Begin normal processing
  await upsertHeartbeat('RUNNING');
  heartbeatInterval = setInterval(() => upsertHeartbeat('RUNNING'), 15000);

  console.log(`[${WORKER_NAME}] Started successfully.`);
  await runCycle();
}

async function runCycle() {
  if (isShuttingDown) return;
  
  try {
    const lockRows = await query(`SELECT pg_try_advisory_lock(74001) as locked`);
    if (lockRows[0] && lockRows[0].locked) {
      await runHealthChecks();
      await query(`SELECT pg_advisory_unlock(74001)`);
    }
  } catch (err) {
    console.error(`[${WORKER_NAME}] Cycle error:`, err.message);
  }

  setTimeout(async () => {
    runCycle();
  }, 60000);
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

startWorker().catch(err => {
  console.error(`[${WORKER_NAME}] Failed to start:`, err);
  process.exit(1);
});
