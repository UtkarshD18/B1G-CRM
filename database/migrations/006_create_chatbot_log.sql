CREATE TABLE IF NOT EXISTS chatbot_log (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  chatbot_id INTEGER,
  chatbot_title VARCHAR(255),
  flow_id VARCHAR(255),
  sender_number VARCHAR(191),
  sender_name VARCHAR(255),
  incoming_message TEXT,
  origin VARCHAR(50),
  matched SMALLINT DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'received',
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chatbot_log_uid_created_at ON chatbot_log(uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_log_uid_chatbot ON chatbot_log(uid, chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_log_uid_status ON chatbot_log(uid, status);
