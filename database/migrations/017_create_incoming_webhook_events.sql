\set ON_ERROR_STOP on

-- Incoming webhook events table
-- Tracks all HTTP POST requests received at the tenant's webhook URL
-- Mirrors the reference CRM's webhook-logs page feature
CREATE TABLE IF NOT EXISTS incoming_webhook_events (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  key_id VARCHAR(10) NOT NULL,
  name VARCHAR(255),
  http_method VARCHAR(10) DEFAULT 'POST',
  event_type VARCHAR(255) DEFAULT 'unknown',
  status VARCHAR(50) DEFAULT 'RECEIVED',
  payload TEXT,
  headers TEXT,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incoming_webhook_events_uid ON incoming_webhook_events(uid);
CREATE INDEX IF NOT EXISTS idx_incoming_webhook_events_key_id ON incoming_webhook_events(key_id);
