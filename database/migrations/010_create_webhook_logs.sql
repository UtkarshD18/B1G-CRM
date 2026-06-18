\set ON_ERROR_STOP on

CREATE TABLE IF NOT EXISTS webhook_logs (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  rule_id INTEGER,
  rule_name VARCHAR(255),
  target_url TEXT,
  payload TEXT,
  response_status INTEGER,
  response_body TEXT,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_uid ON webhook_logs(uid);
