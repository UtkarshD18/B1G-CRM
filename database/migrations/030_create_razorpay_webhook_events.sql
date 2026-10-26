CREATE TABLE IF NOT EXISTS razorpay_webhook_events (
  id BIGSERIAL PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255),
  order_id VARCHAR(255),
  payment_id VARCHAR(255),
  status VARCHAR(30) NOT NULL DEFAULT 'received',
  attempts INTEGER NOT NULL DEFAULT 1,
  last_error TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_razorpay_webhook_order_id
  ON razorpay_webhook_events (order_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_webhook_payment_id
  ON razorpay_webhook_events (payment_id);
