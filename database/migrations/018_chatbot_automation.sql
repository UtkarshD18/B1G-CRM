CREATE TABLE IF NOT EXISTS automation_flows (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  flow_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  is_published SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_automation_flows_uid ON automation_flows(uid);

CREATE TABLE IF NOT EXISTS automation_nodes (
  id SERIAL PRIMARY KEY,
  flow_id VARCHAR(255) NOT NULL REFERENCES automation_flows(flow_id) ON DELETE CASCADE,
  node_id VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  position_x NUMERIC(10, 2),
  position_y NUMERIC(10, 2),
  data TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(flow_id, node_id)
);

CREATE TABLE IF NOT EXISTS automation_edges (
  id SERIAL PRIMARY KEY,
  flow_id VARCHAR(255) NOT NULL REFERENCES automation_flows(flow_id) ON DELETE CASCADE,
  edge_id VARCHAR(255) NOT NULL,
  source VARCHAR(255) NOT NULL,
  target VARCHAR(255) NOT NULL,
  source_handle VARCHAR(255),
  target_handle VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(flow_id, edge_id)
);

CREATE TABLE IF NOT EXISTS flow_executions (
  id SERIAL PRIMARY KEY,
  flow_id VARCHAR(255) NOT NULL REFERENCES automation_flows(flow_id) ON DELETE CASCADE,
  uid VARCHAR(191) NOT NULL,
  sender_name VARCHAR(255),
  sender_mobile VARCHAR(100),
  status VARCHAR(50) DEFAULT 'running',
  current_node_id VARCHAR(255),
  variables TEXT,
  labels TEXT,
  execution_path TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_flow_executions_uid_flow ON flow_executions(uid, flow_id);

CREATE TABLE IF NOT EXISTS flow_execution_logs (
  id SERIAL PRIMARY KEY,
  execution_id INTEGER NOT NULL REFERENCES flow_executions(id) ON DELETE CASCADE,
  flow_id VARCHAR(255) NOT NULL,
  node_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  error_message TEXT,
  execution_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_flow_execution_logs_exec ON flow_execution_logs(execution_id);

CREATE TABLE IF NOT EXISTS flow_variables (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(uid, name)
);
