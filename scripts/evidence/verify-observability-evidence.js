const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../../server.js');

console.log('[OBSERVABILITY-AUDIT] Starting observability audit...');

if (!fs.existsSync(serverPath)) {
  console.error('[OBSERVABILITY-AUDIT] ERROR: server.js not found.');
  process.exit(1);
}

const serverCode = fs.readFileSync(serverPath, 'utf8');

let hasAccessLogger = serverCode.includes('logger.info(`[ACCESS]');
let hasLatency = serverCode.includes('latencyMs: latency');
let hasStatus = serverCode.includes('status: res.statusCode');

if (!hasAccessLogger || !hasLatency || !hasStatus) {
  console.error('[OBSERVABILITY-AUDIT] FAIL: Access logger is missing from server.js');
  process.exit(1);
}

console.log('[OBSERVABILITY-AUDIT] PASS: Access logger correctly implemented in server.js.');
process.exit(0);
