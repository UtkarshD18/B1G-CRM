-- Migration: 025_enterprise_permissions_and_activity.sql

-- 1. Create Base Tables
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(255) DEFAULT NULL, -- NULL represents system template, otherwise tenant uid
  name VARCHAR(50) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(uid, name)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(255) UNIQUE NOT NULL, -- references user.uid or agents.uid
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(255) NOT NULL, -- references user.uid or agents.uid
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(uid, permission_id)
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(255) NOT NULL, -- Tenant Owner UID
  user_id VARCHAR(255) NOT NULL, -- Active User UID
  action VARCHAR(255) NOT NULL,
  module VARCHAR(100) NOT NULL,
  target VARCHAR(255),
  details TEXT,
  execution_id VARCHAR(255) DEFAULT NULL,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS ai_feedback (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  execution_id VARCHAR(255) NOT NULL,
  rating VARCHAR(10) NOT NULL, -- 'like' or 'dislike'
  comment TEXT,
  model VARCHAR(100),
  flow_id VARCHAR(100),
  conversation_id VARCHAR(100),
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_uid ON activity_logs(uid);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_module ON activity_logs(module);

-- 2. Seed Permissions
INSERT INTO permissions (key, description) VALUES
  ('inbox.read', 'Read operator inbox messages and chats'),
  ('inbox.reply', 'Reply to chats and send outbound template/custom messages'),
  ('contacts.read', 'View contact details and lists'),
  ('contacts.write', 'Create, edit, and update contacts'),
  ('kb.read', 'View Knowledge Base library documents'),
  ('kb.write', 'Upload documents, scrape website URLs, and add resources'),
  ('kb.delete', 'Delete documents and resources from Knowledge Base'),
  ('kb.reindex', 'Trigger manual re-indexing of documents'),
  ('automation.read', 'View automation chat flows'),
  ('automation.edit', 'Modify and construct chat flows in Builder'),
  ('automation.publish', 'Publish/deploy chat flows'),
  ('ai.inspector', 'Full access to AI Execution Logs and Developer Tools'),
  ('ai.execution', 'Access AI execution details, timeline, variables, and overview metrics'),
  ('ai.sources', 'View retrieved document citation links'),
  ('ai.chunks', 'View text chunks, highlighted passages, and chunk indexes'),
  ('ai.prompt', 'View LLM system and user prompt strings'),
  ('ai.payload', 'View LLM raw API request and response JSON payloads'),
  ('settings.ai', 'Manage AI Provider credentials and configs'),
  ('settings.whatsapp', 'Manage WhatsApp Cloud API connection details'),
  ('settings.users', 'Manage operator staff accounts, roles, and permissions')
ON CONFLICT (key) DO NOTHING;

-- 3. Seed System Template Roles
INSERT INTO roles (uid, name, description, is_system) VALUES
  (NULL, 'Owner', 'Full access to all CRM workspace features and administration', TRUE),
  (NULL, 'Admin', 'Administrative access to workspace configurations and features', TRUE),
  (NULL, 'Manager', 'Management access to support, contacts, and knowledge resources', TRUE),
  (NULL, 'Agent', 'Standard support agent access to reply to tickets and contacts', TRUE)
ON CONFLICT (uid, name) DO NOTHING;

-- 4. Map Template Roles to default permissions
-- Owner Template Role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.uid IS NULL AND r.name = 'Owner'
ON CONFLICT DO NOTHING;

-- Admin Template Role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.uid IS NULL AND r.name = 'Admin' AND p.key IN (
  'inbox.read', 'inbox.reply', 'contacts.read', 'contacts.write',
  'kb.read', 'kb.write', 'kb.delete', 'kb.reindex',
  'automation.read', 'automation.edit', 'automation.publish',
  'ai.inspector', 'ai.execution', 'ai.sources', 'ai.chunks', 'ai.prompt', 'ai.payload',
  'settings.ai', 'settings.whatsapp'
)
ON CONFLICT DO NOTHING;

-- Manager Template Role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.uid IS NULL AND r.name = 'Manager' AND p.key IN (
  'inbox.read', 'inbox.reply', 'contacts.read', 'contacts.write',
  'kb.read', 'kb.write', 'kb.reindex',
  'automation.read', 'automation.edit',
  'ai.execution', 'ai.sources', 'ai.chunks'
)
ON CONFLICT DO NOTHING;

-- Agent Template Role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.uid IS NULL AND r.name = 'Agent' AND p.key IN (
  'inbox.read', 'inbox.reply', 'contacts.read', 'kb.read'
)
ON CONFLICT DO NOTHING;

-- 5. Backfill/Clone Roles for each existing Tenant Owner workspace
DO $$
DECLARE
  u RECORD;
  r RECORD;
  new_role_id INT;
  old_owner_role_id INT;
  old_admin_role_id INT;
  old_manager_role_id INT;
  old_agent_role_id INT;
BEGIN
  -- Get template role IDs
  SELECT id INTO old_owner_role_id FROM roles WHERE uid IS NULL AND name = 'Owner';
  SELECT id INTO old_admin_role_id FROM roles WHERE uid IS NULL AND name = 'Admin';
  SELECT id INTO old_manager_role_id FROM roles WHERE uid IS NULL AND name = 'Manager';
  SELECT id INTO old_agent_role_id FROM roles WHERE uid IS NULL AND name = 'Agent';

  FOR u IN SELECT DISTINCT uid FROM "user" LOOP
    -- Clone Owner Role
    INSERT INTO roles (uid, name, description, is_system)
    VALUES (u.uid, 'Owner', 'Full access to all CRM workspace features and administration', FALSE)
    ON CONFLICT (uid, name) DO NOTHING;
    
    SELECT id INTO new_role_id FROM roles WHERE uid = u.uid AND name = 'Owner';
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT new_role_id, permission_id FROM role_permissions WHERE role_id = old_owner_role_id
    ON CONFLICT DO NOTHING;
    
    -- Map Owner user to Owner Role
    INSERT INTO user_roles (uid, role_id)
    VALUES (u.uid, new_role_id)
    ON CONFLICT (uid) DO NOTHING;

    -- Clone Admin Role
    INSERT INTO roles (uid, name, description, is_system)
    VALUES (u.uid, 'Admin', 'Administrative access to workspace configurations and features', FALSE)
    ON CONFLICT (uid, name) DO NOTHING;
    
    SELECT id INTO new_role_id FROM roles WHERE uid = u.uid AND name = 'Admin';
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT new_role_id, permission_id FROM role_permissions WHERE role_id = old_admin_role_id
    ON CONFLICT DO NOTHING;

    -- Clone Manager Role
    INSERT INTO roles (uid, name, description, is_system)
    VALUES (u.uid, 'Manager', 'Management access to support, contacts, and knowledge resources', FALSE)
    ON CONFLICT (uid, name) DO NOTHING;
    
    SELECT id INTO new_role_id FROM roles WHERE uid = u.uid AND name = 'Manager';
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT new_role_id, permission_id FROM role_permissions WHERE role_id = old_manager_role_id
    ON CONFLICT DO NOTHING;

    -- Clone Agent Role
    INSERT INTO roles (uid, name, description, is_system)
    VALUES (u.uid, 'Agent', 'Standard support agent access to reply to tickets and contacts', FALSE)
    ON CONFLICT (uid, name) DO NOTHING;
    
    SELECT id INTO new_role_id FROM roles WHERE uid = u.uid AND name = 'Agent';
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT new_role_id, permission_id FROM role_permissions WHERE role_id = old_agent_role_id
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- 6. Map existing agents to their respective Tenant's cloned Agent role
DO $$
DECLARE
  a RECORD;
  target_role_id INT;
BEGIN
  FOR a IN SELECT uid, owner_uid, permissions FROM agents LOOP
    -- Find the cloned Agent role for this agent's owner_uid
    SELECT id INTO target_role_id FROM roles WHERE uid = a.owner_uid AND name = 'Agent';
    
    IF target_role_id IS NOT NULL THEN
      -- Map Agent user to Agent Role
      INSERT INTO user_roles (uid, role_id)
      VALUES (a.uid, target_role_id)
      ON CONFLICT (uid) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;
