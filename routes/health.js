const express = require('express');
const router = express.Router();
const pool = require('../database/config');
const rateLimit = require('express-rate-limit');

const healthLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(healthLimiter);
// Assuming WhatsApp and other channels check config or instance
// No Redis per rules.

// Liveness Probe - Is the process responding?
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Readiness Probe - Are downstream dependencies ready?
router.get('/ready', async (req, res) => {
  let dbStatus = 'DOWN';
  let isReady = false;

  try {
    const result = await pool.query('SELECT 1 as is_alive');
    if (result.rows[0].is_alive === 1) {
      dbStatus = 'UP';
      isReady = true;
    }
  } catch (err) {
    console.error('Readiness probe DB error:', err.message);
  }

  const status = isReady ? 200 : 503;
  res.status(status).json({
    status: isReady ? 'READY' : 'NOT_READY',
    components: {
      database: dbStatus,
      queue: dbStatus, // Using PG as queue
    },
    timestamp: new Date().toISOString(),
  });
});

// Comprehensive Health Probe - Detailed system states
router.get('/health', async (req, res) => {
  let isHealthy = false;
  let dbState = 'DOWN';

  try {
    await pool.query('SELECT 1');
    dbState = 'UP';
    isHealthy = true;
  } catch (err) {
    dbState = 'DOWN';
  }

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'HEALTHY' : 'UNHEALTHY',
    uptimeSeconds: process.uptime(),
    components: {
      database: dbState,
      scheduler: 'UNKNOWN', // Without Redis, workers are managed manually
      websocket: 'UP',
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
