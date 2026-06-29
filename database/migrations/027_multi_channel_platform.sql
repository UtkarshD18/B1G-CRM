\set ON_ERROR_STOP on

-- 1. Generic Credentials Table
CREATE TABLE IF NOT EXISTS channel_credentials (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  channel_type VARCHAR(50) NOT NULL,
  credentials TEXT NOT NULL, -- Encrypted JSON string (AES-256-GCM)
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(uid, channel_type)
);
CREATE INDEX IF NOT EXISTS idx_channel_credentials_uid ON channel_credentials(uid);

-- 2. Generic Settings Table
CREATE TABLE IF NOT EXISTS channel_settings (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  channel_type VARCHAR(50) NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(uid, channel_type)
);
CREATE INDEX IF NOT EXISTS idx_channel_settings_uid ON channel_settings(uid);

-- 3. Unified Connection State Table
CREATE TABLE IF NOT EXISTS channel_connections (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  channel_type VARCHAR(50) NOT NULL,
  mode VARCHAR(20) DEFAULT 'mock' NOT NULL, -- 'mock', 'sandbox', 'production'
  connection_status VARCHAR(50) DEFAULT 'NEW' NOT NULL, -- 'NEW', 'CONNECTING', 'CONNECTED', 'VERIFYING', 'WARNING', 'ERROR', 'DISCONNECTED', 'DISABLED', 'RATE_LIMITED', 'MAINTENANCE'
  last_verified_at TIMESTAMPTZ,
  last_error TEXT,
  last_heartbeat TIMESTAMPTZ,
  api_version VARCHAR(50),
  UNIQUE(uid, channel_type)
);
CREATE INDEX IF NOT EXISTS idx_channel_connections_uid ON channel_connections(uid);

-- 4. Outgoing Message Queue
CREATE TABLE IF NOT EXISTS channel_outgoing_queue (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  channel_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL, -- Normalized outgoing schema
  priority INTEGER DEFAULT 0 NOT NULL,
  state VARCHAR(20) DEFAULT 'pending' NOT NULL, -- 'pending', 'sending', 'sent', 'failed', 'retrying', 'dead_letter'
  attempts INTEGER DEFAULT 0 NOT NULL,
  provider_message_id VARCHAR(255),
  scheduled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_channel_outgoing_queue_uid ON channel_outgoing_queue(uid);
CREATE INDEX IF NOT EXISTS idx_channel_outgoing_queue_state ON channel_outgoing_queue(state);

-- 5. Incoming Message Queue
CREATE TABLE IF NOT EXISTS channel_incoming_queue (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  channel_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  state VARCHAR(20) DEFAULT 'pending' NOT NULL, -- 'pending', 'processing', 'processed', 'failed'
  attempts INTEGER DEFAULT 0 NOT NULL,
  last_attempt_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_channel_incoming_queue_uid ON channel_incoming_queue(uid);
CREATE INDEX IF NOT EXISTS idx_channel_incoming_queue_state ON channel_incoming_queue(state);

-- 6. Channel Metrics Table
CREATE TABLE IF NOT EXISTS channel_metrics (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  channel_type VARCHAR(50) NOT NULL,
  messages_sent INTEGER DEFAULT 0 NOT NULL,
  messages_failed INTEGER DEFAULT 0 NOT NULL,
  avg_latency_ms INTEGER DEFAULT 0 NOT NULL,
  success_rate NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
  last_outage_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(uid, channel_type)
);
CREATE INDEX IF NOT EXISTS idx_channel_metrics_uid ON channel_metrics(uid);

-- 7. Idempotency Table
CREATE TABLE IF NOT EXISTS webhook_idempotency (
  id SERIAL PRIMARY KEY,
  provider_message_id VARCHAR(255) NOT NULL UNIQUE,
  processed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
