CREATE TABLE IF NOT EXISTS channel_inbound_idempotency (
  uid VARCHAR(191) NOT NULL,
  channel_type VARCHAR(50) NOT NULL,
  provider_message_id VARCHAR(255) NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (uid, channel_type, provider_message_id)
);
