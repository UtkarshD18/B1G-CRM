const axios = require('axios');

const API_BASE = 'http://127.0.0.1:3020/api';

async function log(msg) {
  console.log(`[OBSERVABILITY-SAT] ${msg}`);
}

async function fail(msg) {
  console.error(`[OBSERVABILITY-SAT ERROR] ${msg}`);
  process.exit(1);
}

(async () => {
  try {
    log('Starting Phase 9 Observability Validation...');

    const res = await axios.post(`${API_BASE}/user/login`, { email: 'tenant@example.com', password: 'password' });
    
    // Check response headers
    const correlationId = res.headers['x-correlation-id'];
    if (!correlationId) {
      fail('No X-Correlation-Id header found in response. Observability middleware is not working.');
    }
    
    log(`Successfully received correlation ID: ${correlationId}`);
    log('✅ Observability Validation Passed!');
    process.exit(0);
  } catch (err) {
    fail(err.message);
  }
})();
