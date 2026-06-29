-- Migration: 026_flow_versioning.sql

-- 1. Create Environments Table
CREATE TABLE IF NOT EXISTS environments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT
);

INSERT INTO environments (name, description) VALUES
  ('Production', 'Production active consumer environment'),
  ('Staging', 'Pre-release testing environment'),
  ('Development', 'Active operator drafting workspace')
ON CONFLICT (name) DO NOTHING;

-- 2. Create Flow Versions Table
CREATE TABLE IF NOT EXISTS automation_flow_versions (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  flow_id VARCHAR(255) NOT NULL,
  version INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'draft', 'published', 'historical'
  name VARCHAR(255) NOT NULL,
  flow_json JSONB NOT NULL, -- Canonical single source of truth
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMPTZ DEFAULT NULL,
  created_by VARCHAR(255) NOT NULL,
  published_by VARCHAR(255),
  rollback_source_version INTEGER DEFAULT NULL,
  version_notes TEXT, -- Supports Markdown
  checksum VARCHAR(64) NOT NULL, -- SHA-256 hash
  release_tag VARCHAR(50) DEFAULT 'Draft',
  environment_id INTEGER REFERENCES environments(id) ON DELETE SET NULL,
  revision INTEGER DEFAULT 1 NOT NULL,
  UNIQUE(uid, flow_id, version)
);

CREATE INDEX IF NOT EXISTS idx_flow_versions_uid_flow ON automation_flow_versions(uid, flow_id);

-- 3. Create Flow Version Metrics Table
CREATE TABLE IF NOT EXISTS automation_flow_version_metrics (
  id SERIAL PRIMARY KEY,
  version_id INTEGER NOT NULL REFERENCES automation_flow_versions(id) ON DELETE CASCADE UNIQUE,
  conversation_count INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2) DEFAULT 0.00,
  fallback_rate NUMERIC(5,2) DEFAULT 0.00,
  ai_calls INTEGER DEFAULT 0,
  average_latency INTEGER DEFAULT 0,
  average_cost NUMERIC(10,4) DEFAULT 0.0000,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Flow Templates Table
CREATE TABLE IF NOT EXISTS flow_templates (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  version_id INTEGER NOT NULL REFERENCES automation_flow_versions(id) ON DELETE CASCADE UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  thumbnail TEXT,
  description TEXT,
  author VARCHAR(255),
  rating NUMERIC(3,2) DEFAULT 5.00,
  downloads INTEGER DEFAULT 0,
  visibility VARCHAR(20) DEFAULT 'private',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Alter automation_flows for locks and optimistic concurrency
ALTER TABLE automation_flows ADD COLUMN IF NOT EXISTS revision INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE automation_flows ADD COLUMN IF NOT EXISTS last_saved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE automation_flows ADD COLUMN IF NOT EXISTS last_saved_by VARCHAR(255) DEFAULT NULL;
ALTER TABLE automation_flows ADD COLUMN IF NOT EXISTS locked_by VARCHAR(255) DEFAULT NULL;
ALTER TABLE automation_flows ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ DEFAULT NULL;

-- 6. Alter flow_executions for runtime pinning
ALTER TABLE flow_executions ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT NULL;

-- 7. Seed Permissions
INSERT INTO permissions (key, description) VALUES
  ('automation.rollback', 'Rollback visual flows to historical versions'),
  ('automation.compare', 'Compare different versions of visual flows'),
  ('automation.history', 'View flow version history lists and metrics'),
  ('automation.template', 'Manage and clone flow templates'),
  ('automation.export', 'Export flow schemas and snapshots as JSON'),
  ('automation.import', 'Import flow schemas and snapshots as JSON')
ON CONFLICT (key) DO NOTHING;

-- 8. Backfill Existing Flows into automation_flow_versions as Version 1
DO $$
DECLARE
  f RECORD;
  nodes_json JSON;
  edges_json JSON;
  flow_json_data JSONB;
  checksum_val VARCHAR(64);
  version_id_val INT;
  env_id INT;
BEGIN
  -- Get environment ID for Production
  SELECT id INTO env_id FROM environments WHERE name = 'Production' LIMIT 1;
  
  FOR f IN SELECT * FROM automation_flows LOOP
    -- Build nodes JSON safely
    SELECT json_agg(json_build_object(
      'id', node_id,
      'type', type,
      'position', json_build_object('x', position_x, 'y', position_y),
      'data', CASE WHEN data IS NULL OR data = '' THEN '{}'::json ELSE data::json END
    )) INTO nodes_json
    FROM automation_nodes
    WHERE flow_id = f.flow_id;

    -- Build edges JSON safely
    SELECT json_agg(json_build_object(
      'id', edge_id,
      'source', source,
      'target', target,
      'sourceHandle', source_handle,
      'targetHandle', target_handle
    )) INTO edges_json
    FROM automation_edges
    WHERE flow_id = f.flow_id;

    -- Combine into canonical flow_json structure
    flow_json_data := jsonb_build_object(
      'nodes', COALESCE(nodes_json, '[]'::json),
      'edges', COALESCE(edges_json, '[]'::json),
      'viewport', '{"x":0,"y":0,"zoom":1}'::json,
      'variables', '{}'::json,
      'settings', '{}'::json,
      'metadata', '{}'::json
    );

    -- Calculate SHA-256 checksum
    checksum_val := encode(sha256(flow_json_data::text::bytea), 'hex');

    -- Insert version 1
    INSERT INTO automation_flow_versions (
      uid, flow_id, version, status, name, flow_json, created_by, published_by, 
      version_notes, checksum, release_tag, environment_id, published_at
    ) VALUES (
      f.uid, f.flow_id, 1, 
      CASE WHEN f.is_published = 1 THEN 'published' ELSE 'draft' END,
      f.name, flow_json_data, f.uid, 
      CASE WHEN f.is_published = 1 THEN f.uid ELSE NULL END,
      'Initial migration version', checksum_val, 
      CASE WHEN f.is_published = 1 THEN 'Production' ELSE 'Draft' END, 
      env_id,
      CASE WHEN f.is_published = 1 THEN CURRENT_TIMESTAMP ELSE NULL END
    ) RETURNING id INTO version_id_val;

    -- Insert default metrics row
    INSERT INTO automation_flow_version_metrics (version_id)
    VALUES (version_id_val)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;
