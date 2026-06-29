CREATE TABLE IF NOT EXISTS knowledge_base_chunks (
  id SERIAL PRIMARY KEY,
  kb_id INTEGER NOT NULL,
  uid VARCHAR(191) NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding TEXT NOT NULL, -- JSON array of floats
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kb_chunks_uid ON knowledge_base_chunks(uid);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_kb_id ON knowledge_base_chunks(kb_id);

CREATE TABLE IF NOT EXISTS ai_execution_logs (
  id SERIAL PRIMARY KEY,
  execution_id VARCHAR(191) NOT NULL UNIQUE,
  flow_id VARCHAR(191) NOT NULL,
  node_id VARCHAR(191) NOT NULL,
  uid VARCHAR(191) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  user_input TEXT,
  vector_retrieval TEXT, -- Store JSON
  keyword_retrieval TEXT, -- Store JSON
  merged_context TEXT, -- Store JSON
  llm_call TEXT, -- Store JSON
  flow_builder TEXT, -- Store JSON
  result TEXT -- Store JSON
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_uid ON ai_execution_logs(uid);
CREATE INDEX IF NOT EXISTS idx_ai_logs_flow_id ON ai_execution_logs(flow_id);
