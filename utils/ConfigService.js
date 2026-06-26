const { query } = require('../database/dbpromise');

class ConfigService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5000; // 5 seconds
    this.defaults = {
      outgoingQueueRetentionDays: 30,
      deadLetterRetentionDays: 30,
      metricsRetentionDays: 90,
      webhookIdempotencyRetentionDays: 7,
      workerHeartbeatStaleMinutes: 5,
      recoveryScanIntervalSeconds: 30,
      listenReconnectRetryDelayMs: 5000,
      providerTimeoutMs: 30000
    };
  }

  async get(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp < this.cacheTTL)) {
      return cached.value;
    }

    try {
      const rows = await query(`SELECT setting_value FROM system_settings WHERE setting_key = ?`, [key]);
      if (rows.length > 0) {
        let val = rows[0].setting_value;
        if (!isNaN(Number(val))) val = Number(val);
        this.cache.set(key, { value: val, timestamp: Date.now() });
        return val;
      }
    } catch (e) {
      // Ignore missing table or errors, fallback to default
    }

    const val = process.env[key] !== undefined ? (isNaN(Number(process.env[key])) ? process.env[key] : Number(process.env[key])) : (this.defaults[key] !== undefined ? this.defaults[key] : null);
    this.cache.set(key, { value: val, timestamp: Date.now() });
    return val;
  }

  async getAll() {
    const keys = Object.keys(this.defaults);
    const config = {};
    for (const k of keys) {
      config[k] = await this.get(k);
    }
    return config;
  }
}

module.exports = new ConfigService();
