ALTER TABLE channel_connections
ADD COLUMN circuit_state VARCHAR(20) DEFAULT 'CLOSED' NOT NULL,
ADD COLUMN failure_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN opened_at TIMESTAMPTZ,
ADD COLUMN last_failure_at TIMESTAMPTZ,
ADD COLUMN half_open_attempts INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN rate_limit_tokens NUMERIC(8,2) DEFAULT 10.00 NOT NULL,
ADD COLUMN rate_limit_last_refill TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL;

ALTER TABLE channel_outgoing_queue
ADD COLUMN correlation_id UUID DEFAULT gen_random_uuid() NOT NULL,
ADD COLUMN processing_started_at TIMESTAMPTZ,
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE channel_outgoing_queue ALTER COLUMN correlation_id DROP DEFAULT;

ALTER TABLE channel_incoming_queue
ADD COLUMN correlation_id UUID DEFAULT gen_random_uuid() NOT NULL,
ADD COLUMN processing_started_at TIMESTAMPTZ,
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
ADD COLUMN provider_message_id VARCHAR(255);
ALTER TABLE channel_incoming_queue ALTER COLUMN correlation_id DROP DEFAULT;

CREATE TABLE channel_dead_letter_queue (
    id SERIAL PRIMARY KEY,
    uid VARCHAR(191) NOT NULL,
    channel_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    attempts INTEGER NOT NULL,
    last_error TEXT,
    provider_response JSONB,
    correlation_id UUID NOT NULL,
    provider_message_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transport_workers (
    worker_name VARCHAR(100) PRIMARY KEY,
    hostname VARCHAR(255) NOT NULL,
    pid INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    last_seen TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    version VARCHAR(50) NOT NULL
);

CREATE OR REPLACE FUNCTION notify_channel_outgoing_queue_insert()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('channel_outgoing_queue', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_channel_outgoing_queue_insert_trigger ON channel_outgoing_queue;
CREATE TRIGGER notify_channel_outgoing_queue_insert_trigger
AFTER INSERT ON channel_outgoing_queue
FOR EACH ROW EXECUTE FUNCTION notify_channel_outgoing_queue_insert();

CREATE OR REPLACE FUNCTION notify_channel_incoming_queue_insert()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('channel_incoming_queue', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_channel_incoming_queue_insert_trigger ON channel_incoming_queue;
CREATE TRIGGER notify_channel_incoming_queue_insert_trigger
AFTER INSERT ON channel_incoming_queue
FOR EACH ROW EXECUTE FUNCTION notify_channel_incoming_queue_insert();

CREATE INDEX IF NOT EXISTS idx_outgoing_state_priority ON channel_outgoing_queue(state, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_outgoing_correlation ON channel_outgoing_queue(correlation_id);
CREATE INDEX IF NOT EXISTS idx_incoming_state ON channel_incoming_queue(state, created_at);
CREATE INDEX IF NOT EXISTS idx_dead_letter_created ON channel_dead_letter_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_outgoing_provider_msg_id ON channel_outgoing_queue(provider_message_id);
CREATE INDEX IF NOT EXISTS idx_incoming_provider_msg_id ON channel_incoming_queue(provider_message_id);
CREATE INDEX IF NOT EXISTS idx_dead_letter_provider_msg_id ON channel_dead_letter_queue(provider_message_id);
