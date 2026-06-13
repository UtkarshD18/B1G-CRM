\set ON_ERROR_STOP on

CREATE TABLE IF NOT EXISTS webhook_rules (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  source VARCHAR(100) DEFAULT 'external',
  event_type VARCHAR(100) DEFAULT 'message',
  match_field VARCHAR(120) DEFAULT 'body.text',
  match_operator VARCHAR(40) DEFAULT 'contains',
  match_value TEXT,
  action_type VARCHAR(80) DEFAULT 'tag_chat',
  action_payload TEXT,
  active SMALLINT DEFAULT 1,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_rules_uid ON webhook_rules(uid);
CREATE INDEX IF NOT EXISTS idx_webhook_rules_active ON webhook_rules(uid, active);
