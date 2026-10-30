CREATE TABLE IF NOT EXISTS offline_payment_requests (
  id BIGSERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  plan_id INTEGER NOT NULL,
  plan_snapshot JSONB NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by VARCHAR(191),
  review_note TEXT
);

CREATE INDEX IF NOT EXISTS idx_offline_payment_requests_status_created
  ON offline_payment_requests (status, created_at);
