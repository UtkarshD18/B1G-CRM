-- Migration: 012_sprint11_crm_completion.sql

-- 1. Tenant Configurable AI Providers
CREATE TABLE IF NOT EXISTS tenant_ai_providers (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  provider VARCHAR(50) NOT NULL, -- 'openai', 'gemini', 'claude', 'openrouter', 'ollama', 'custom'
  api_key TEXT,
  model VARCHAR(255),
  temperature NUMERIC(3, 2) DEFAULT 0.7,
  enabled SMALLINT DEFAULT 1,
  custom_endpoint TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (uid, provider)
);

-- 2. Knowledge Base
CREATE TABLE IF NOT EXISTS knowledge_base (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'pdf', 'docx', 'txt', 'url'
  source_path TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Website Integration
CREATE TABLE IF NOT EXISTS website_integrations (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  verification_token VARCHAR(255) NOT NULL,
  verified SMALLINT DEFAULT 0,
  tracking_code TEXT,
  widget_customization TEXT, -- JSON configuration for styling
  lead_capture_enabled SMALLINT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (uid, domain)
);

-- 4. Lead Pipeline
CREATE TABLE IF NOT EXISTS crm_leads (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(50) NOT NULL,
  stage VARCHAR(50) NOT NULL DEFAULT 'Lead', -- 'Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'
  owner_agent_uid VARCHAR(191),
  notes TEXT,
  value NUMERIC(12, 2) DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_lead_reminders (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  lead_id INTEGER NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_lead_activities (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  lead_id INTEGER NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'note', 'call', 'email', 'meeting', 'reminder'
  description TEXT NOT NULL,
  agent_uid VARCHAR(191),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Agent Workflow SLA and Escalations
CREATE TABLE IF NOT EXISTS agent_response_logs (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  agent_uid VARCHAR(191) NOT NULL,
  chat_id VARCHAR(255) NOT NULL,
  response_time_seconds INTEGER NOT NULL,
  sla_violated SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS escalation_queue (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  chat_id VARCHAR(255) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  escalated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  resolved SMALLINT DEFAULT 0,
  resolved_at TIMESTAMPTZ
);

-- 6. Helper columns on chats table
ALTER TABLE chats ADD COLUMN IF NOT EXISTS assigned_agent_uid VARCHAR(191);
ALTER TABLE chats ADD COLUMN IF NOT EXISTS last_reply_by VARCHAR(50); -- 'user', 'agent', 'bot'
ALTER TABLE chats ADD COLUMN IF NOT EXISTS last_incoming_time BIGINT;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS last_outgoing_time BIGINT;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS sla_expires_at TIMESTAMPTZ;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS sla_violated SMALLINT DEFAULT 0;
