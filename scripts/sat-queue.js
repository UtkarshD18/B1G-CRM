const pool = require('../database/config');
const { exec } = require('child_process');

async function log(msg) {
  console.log(`[QUEUE-SAT] ${msg}`);
}

async function getQueueCounts() {
  const res = await pool.query('SELECT state, COUNT(*) FROM channel_outgoing_queue GROUP BY state');
  const counts = { pending: 0, retry: 0, failed: 0, completed: 0 };
  res.rows.forEach(r => counts[r.state] = parseInt(r.count, 10));
  return counts;
}

(async () => {
  try {
    log('Starting Phase 4 Queue Validation...');

    const initial = await getQueueCounts();
    log(`Initial state: Pending=${initial.pending}, Retry=${initial.retry}, Failed=${initial.failed}, Completed=${initial.completed}`);

    if (initial.pending === 0 && initial.retry === 0) {
      log('Queue is already empty! Skipping worker test.');
      process.exit(0);
    }

    log('Starting retryWorker.js...');
    const worker = exec('node workers/retryWorker.js', { env: process.env });

    log('Waiting 10 seconds for worker to process messages...');
    await new Promise(r => setTimeout(r, 10000));

    log('Stopping worker...');
    worker.kill();

    const final = await getQueueCounts();
    log(`Final state: Pending=${final.pending}, Retry=${final.retry}, Failed=${final.failed}, Completed=${final.completed}`);

    const processed = (initial.pending - final.pending) + (initial.retry - final.retry);
    
    if (processed === 0) {
      console.error('[QUEUE-SAT ERROR] Worker did not process any pending/retry items!');
      process.exit(1);
    }

    log(`✅ Queue Validation Passed! Worker processed ${processed} items.`);
    process.exit(0);
  } catch (err) {
    console.error(`[QUEUE-SAT ERROR] ${err.message}`);
    process.exit(1);
  } finally {
    pool.end();
  }
})();
