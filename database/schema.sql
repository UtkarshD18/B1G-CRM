-- B1G CRM canonical PostgreSQL schema.
-- Use this file for new local and deployed databases.
-- database/postgres-local-schema.sql is kept as the local bootstrap copy.

CREATE TABLE IF NOT EXISTS admin (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "user" (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL UNIQUE,
  name VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  mobile_with_country_code VARCHAR(50),
  timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
  plan TEXT,
  plan_expire BIGINT,
  trial SMALLINT DEFAULT 0,
  api_key VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS plan TEXT;
ALTER TABLE "user" ALTER COLUMN plan TYPE TEXT USING plan::TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS plan_expire BIGINT;
ALTER TABLE admin ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin';

CREATE TABLE IF NOT EXISTS plan (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  short_description TEXT NOT NULL,
  allow_tag SMALLINT DEFAULT 0,
  allow_note SMALLINT DEFAULT 0,
  allow_chatbot SMALLINT DEFAULT 0,
  contact_limit INTEGER DEFAULT 0,
  allow_api SMALLINT DEFAULT 0,
  is_trial SMALLINT DEFAULT 0,
  price NUMERIC(12, 2) DEFAULT 0,
  price_strike NUMERIC(12, 2) DEFAULT 0,
  plan_duration_in_days INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plan_is_trial ON plan(is_trial);

CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  owner_uid VARCHAR(191) NOT NULL,
  uid VARCHAR(191) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'agent',
  name VARCHAR(255),
  mobile VARCHAR(50),
  comments TEXT,
  is_active SMALLINT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE agents ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'agent';

CREATE INDEX IF NOT EXISTS idx_agents_owner_uid ON agents(owner_uid);

CREATE TABLE IF NOT EXISTS phonebook (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (uid, name)
);

CREATE INDEX IF NOT EXISTS idx_phonebook_uid ON phonebook(uid);

CREATE TABLE IF NOT EXISTS contact (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  phonebook_id INTEGER,
  phonebook_name VARCHAR(255),
  name VARCHAR(255),
  mobile VARCHAR(50) NOT NULL,
  var1 TEXT,
  var2 TEXT,
  var3 TEXT,
  var4 TEXT,
  var5 TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_uid ON contact(uid);
CREATE INDEX IF NOT EXISTS idx_contact_phonebook_id ON contact(phonebook_id);
CREATE INDEX IF NOT EXISTS idx_contact_mobile ON contact(mobile);

CREATE TABLE IF NOT EXISTS broadcast (
  id SERIAL PRIMARY KEY,
  broadcast_id VARCHAR(191) NOT NULL,
  uid VARCHAR(191) NOT NULL,
  title TEXT,
  templet TEXT,
  phonebook TEXT,
  status VARCHAR(191) NOT NULL DEFAULT 'QUEUE',
  schedule TIMESTAMPTZ,
  timezone VARCHAR(191),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_broadcast_status ON broadcast(status);
CREATE INDEX IF NOT EXISTS idx_broadcast_uid ON broadcast(uid);
CREATE INDEX IF NOT EXISTS idx_broadcast_id ON broadcast(broadcast_id);

CREATE TABLE IF NOT EXISTS broadcast_log (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  broadcast_id VARCHAR(191) NOT NULL,
  templet_name TEXT,
  sender_mobile VARCHAR(191),
  send_to VARCHAR(191),
  delivery_status VARCHAR(191),
  example TEXT,
  contact TEXT,
  meta_msg_id VARCHAR(191),
  delivery_time BIGINT,
  err TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_broadcast_log_bid_status ON broadcast_log(broadcast_id, delivery_status);
CREATE INDEX IF NOT EXISTS idx_broadcast_log_uid_bid ON broadcast_log(uid, broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_log_meta_msg_id ON broadcast_log(meta_msg_id);

ALTER TABLE admin ADD COLUMN IF NOT EXISTS createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE admin ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS web_public (
  id SERIAL PRIMARY KEY,
  logo TEXT,
  app_name VARCHAR(255) DEFAULT 'B1G CRM',
  custom_home TEXT,
  is_custom_home SMALLINT DEFAULT 0,
  meta_description TEXT,
  currency_code VARCHAR(20) DEFAULT 'USD',
  currency_symbol VARCHAR(20) DEFAULT '$',
  home_page_tutorial TEXT,
  chatbot_screen_tutorial TEXT,
  broadcast_screen_tutorial TEXT,
  login_header_footer TEXT,
  exchange_rate NUMERIC(12, 4) DEFAULT 1,
  google_client_id TEXT,
  google_login_active SMALLINT DEFAULT 0,
  fb_login_app_id TEXT,
  fb_login_app_sec TEXT,
  fb_login_active SMALLINT DEFAULT 0,
  rtl SMALLINT DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO web_public (app_name, currency_code, currency_symbol, exchange_rate)
SELECT 'B1G CRM', 'USD', '$', 1
WHERE NOT EXISTS (SELECT 1 FROM web_public);

CREATE TABLE IF NOT EXISTS web_private (
  id SERIAL PRIMARY KEY,
  pay_offline_id TEXT,
  pay_offline_key TEXT,
  offline_active SMALLINT DEFAULT 0,
  pay_stripe_id TEXT,
  pay_stripe_key TEXT,
  stripe_active SMALLINT DEFAULT 0,
  pay_paypal_id TEXT,
  pay_paypal_key TEXT,
  paypal_active SMALLINT DEFAULT 0,
  rz_id TEXT,
  rz_key TEXT,
  rz_active SMALLINT DEFAULT 0,
  pay_paystack_id TEXT,
  pay_paystack_key TEXT,
  paystack_active SMALLINT DEFAULT 0,
  pay_mercadopago_id TEXT,
  pay_mercadopago_key TEXT,
  mercadopago_active SMALLINT DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO web_private (offline_active)
SELECT 0
WHERE NOT EXISTS (SELECT 1 FROM web_private);

CREATE TABLE IF NOT EXISTS partners (
  id SERIAL PRIMARY KEY,
  filename TEXT,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faq (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS page (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title TEXT,
  image TEXT,
  content TEXT,
  permanent SMALLINT DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO page (slug, title, content, permanent)
SELECT 'terms-and-conditions', 'Terms and Conditions', '', 1
WHERE NOT EXISTS (SELECT 1 FROM page WHERE slug = 'terms-and-conditions');

INSERT INTO page (slug, title, content, permanent)
SELECT 'privacy-policy', 'Privacy Policy', '', 1
WHERE NOT EXISTS (SELECT 1 FROM page WHERE slug = 'privacy-policy');

CREATE TABLE IF NOT EXISTS testimonial (
  id SERIAL PRIMARY KEY,
  title TEXT,
  description TEXT,
  reviewer_name TEXT,
  reviewer_position TEXT,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  payment_mode VARCHAR(100),
  amount NUMERIC(12, 2) DEFAULT 0,
  data TEXT,
  s_token TEXT,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_uid ON orders(uid);

CREATE TABLE IF NOT EXISTS contact_form (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  name VARCHAR(255),
  mobile VARCHAR(100),
  content TEXT,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS smtp (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  host VARCHAR(255),
  port VARCHAR(50),
  password TEXT,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gen_links (
  id SERIAL PRIMARY KEY,
  wa_mobile VARCHAR(100),
  email VARCHAR(255),
  msg TEXT,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meta_api (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL UNIQUE,
  waba_id TEXT,
  business_account_id TEXT,
  access_token TEXT,
  business_phone_number_id TEXT,
  app_id TEXT,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS instagram_api (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL UNIQUE,
  instagram_business_account_id VARCHAR(255),
  access_token TEXT,
  username VARCHAR(255),
  name VARCHAR(255),
  app_id VARCHAR(255),
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_instagram_api_uid ON instagram_api(uid);


CREATE TABLE IF NOT EXISTS meta_templet_media (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  templet_name TEXT,
  meta_hash TEXT,
  file_name TEXT,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meta_templet_media_name ON meta_templet_media(templet_name);

CREATE TABLE IF NOT EXISTS chats (
  id SERIAL PRIMARY KEY,
  chat_id VARCHAR(255) NOT NULL,
  uid VARCHAR(191) NOT NULL,
  last_message_came BIGINT,
  sender_name TEXT,
  sender_mobile VARCHAR(100),
  last_message TEXT,
  is_opened SMALLINT DEFAULT 0,
  chat_status VARCHAR(50) DEFAULT 'open',
  chat_note TEXT,
  chat_tags TEXT,
  origin VARCHAR(50) DEFAULT 'META',
  profile TEXT,
  other TEXT,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (chat_id, uid)
);

CREATE INDEX IF NOT EXISTS idx_chats_uid ON chats(uid);
CREATE INDEX IF NOT EXISTS idx_chats_status ON chats(uid, chat_status);
CREATE INDEX IF NOT EXISTS idx_chats_last_message_came ON chats(last_message_came);

CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  socket_id TEXT,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rooms_uid ON rooms(uid);

CREATE TABLE IF NOT EXISTS agent_chats (
  id SERIAL PRIMARY KEY,
  owner_uid VARCHAR(191) NOT NULL,
  uid VARCHAR(191) NOT NULL,
  chat_id VARCHAR(255) NOT NULL,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_chats_owner ON agent_chats(owner_uid);
CREATE INDEX IF NOT EXISTS idx_agent_chats_uid ON agent_chats(uid);
CREATE INDEX IF NOT EXISTS idx_agent_chats_chat ON agent_chats(chat_id);

CREATE TABLE IF NOT EXISTS chat_tags (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  hex VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_tags_uid ON chat_tags(uid);

CREATE TABLE IF NOT EXISTS chatbot (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  title VARCHAR(255) NOT NULL,
  for_all SMALLINT DEFAULT 0,
  chats TEXT,
  flow TEXT,
  flow_id VARCHAR(255),
  active SMALLINT DEFAULT 1,
  origin TEXT,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chatbot_uid ON chatbot(uid);
CREATE INDEX IF NOT EXISTS idx_chatbot_active ON chatbot(uid, active);

CREATE TABLE IF NOT EXISTS flow (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  flow_id VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  prevent_list TEXT,
  ai_list TEXT,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_flow_uid ON flow(uid);

CREATE TABLE IF NOT EXISTS flow_data (
  id SERIAL PRIMARY KEY,
  chatId VARCHAR(255),
  uid VARCHAR(191),
  uniqueId VARCHAR(255) UNIQUE,
  inputs TEXT,
  other TEXT,
  last_node TEXT,
  disabled SMALLINT DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_flow_data_uid ON flow_data(uid);

CREATE TABLE IF NOT EXISTS templets (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  content TEXT,
  type VARCHAR(100),
  title VARCHAR(255),
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_templets_uid ON templets(uid);

CREATE TABLE IF NOT EXISTS instance (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  title VARCHAR(255),
  uniqueId VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'INIT',
  other TEXT,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_instance_uid ON instance(uid);

CREATE TABLE IF NOT EXISTS agent_task (
  id SERIAL PRIMARY KEY,
  owner_uid VARCHAR(191) NOT NULL,
  uid VARCHAR(191) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'PENDING',
  agent_comments TEXT,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_task_owner ON agent_task(owner_uid);
CREATE INDEX IF NOT EXISTS idx_agent_task_uid ON agent_task(uid);

CREATE TABLE IF NOT EXISTS chat_widget (
  id SERIAL PRIMARY KEY,
  unique_id VARCHAR(255) NOT NULL UNIQUE,
  uid VARCHAR(191) NOT NULL,
  title VARCHAR(255),
  whatsapp_number VARCHAR(100),
  logo TEXT,
  place VARCHAR(100),
  size INTEGER DEFAULT 60,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_widget_uid ON chat_widget(uid);

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

CREATE TABLE IF NOT EXISTS webhook_rules (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  source VARCHAR(100) DEFAULT 'external',
  event_type VARCHAR(100) DEFAULT 'message',
  match_field VARCHAR(120) DEFAULT 'body.text',
  match_operator VARCHAR(40) DEFAULT 'contains',
  match_value TEXT,
  action_type VARCHAR(80) DEFAULT 'tag_chat',
  action_payload TEXT,
  active SMALLINT DEFAULT 1,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_rules_uid ON webhook_rules(uid);
CREATE INDEX IF NOT EXISTS idx_webhook_rules_active ON webhook_rules(uid, active);

INSERT INTO plan (
  title,
  short_description,
  allow_tag,
  allow_note,
  allow_chatbot,
  contact_limit,
  allow_api,
  is_trial,
  price,
  price_strike,
  plan_duration_in_days
)
SELECT
  'Trial',
  '10-day evaluation for onboarding teams',
  1,
  1,
  1,
  1000,
  1,
  1,
  0,
  0,
  10
WHERE NOT EXISTS (SELECT 1 FROM plan WHERE title = 'Trial');

INSERT INTO plan (
  title,
  short_description,
  allow_tag,
  allow_note,
  allow_chatbot,
  contact_limit,
  allow_api,
  is_trial,
  price,
  price_strike,
  plan_duration_in_days
)
SELECT
  'Premium',
  'Core inbox, automation, and campaign workspace',
  1,
  1,
  1,
  100000,
  1,
  0,
  149,
  199,
  365
WHERE NOT EXISTS (SELECT 1 FROM plan WHERE title = 'Premium');

INSERT INTO plan (
  title,
  short_description,
  allow_tag,
  allow_note,
  allow_chatbot,
  contact_limit,
  allow_api,
  is_trial,
  price,
  price_strike,
  plan_duration_in_days
)
SELECT
  'Platinum',
  'Broader automation, API, and scaling controls',
  1,
  1,
  1,
  250000,
  1,
  0,
  299,
  399,
  365
WHERE NOT EXISTS (SELECT 1 FROM plan WHERE title = 'Platinum');

INSERT INTO admin (uid, email, password, role)
VALUES ('local-admin-uid', 'admin@example.com', '$2b$10$QjLCkPVd83A5hebBarGAFedPqWLhc8iHXufUx0QJoXrp1Av.5ngGa', 'admin')
ON CONFLICT (email) DO UPDATE
SET uid = EXCLUDED.uid,
    password = EXCLUDED.password,
    role = EXCLUDED.role;

INSERT INTO "user" (uid, name, email, password, role, timezone, plan, plan_expire)
VALUES (
  'local-user-uid',
  'Local User',
  'user@example.com',
  '$2b$10$QjLCkPVd83A5hebBarGAFedPqWLhc8iHXufUx0QJoXrp1Av.5ngGa',
  'user',
  'Asia/Kolkata',
  '{"contact_limit":100000,"allow_note":1,"allow_tag":1,"allow_chatbot":1,"allow_api":1}',
  4102444800000
)
ON CONFLICT (email) DO UPDATE
SET uid = EXCLUDED.uid,
    name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    timezone = EXCLUDED.timezone,
    plan = EXCLUDED.plan,
    plan_expire = EXCLUDED.plan_expire;

INSERT INTO agents (owner_uid, uid, email, password, role, name, mobile, comments, is_active)
VALUES ('local-user-uid', 'local-agent-uid', 'agent@example.com', '$2b$10$QjLCkPVd83A5hebBarGAFedPqWLhc8iHXufUx0QJoXrp1Av.5ngGa', 'agent', 'Local Agent', '', 'Local development agent', 1)
ON CONFLICT (email) DO UPDATE
SET owner_uid = EXCLUDED.owner_uid,
    uid = EXCLUDED.uid,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    is_active = EXCLUDED.is_active;

CREATE TABLE IF NOT EXISTS webhook_logs (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  rule_id INTEGER,
  rule_name VARCHAR(255),
  target_url TEXT,
  payload TEXT,
  response_status INTEGER,
  response_body TEXT,
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_uid ON webhook_logs(uid);

-- Migration: 012_sprint11_crm_completion.sql
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

ALTER TABLE chats ADD COLUMN IF NOT EXISTS assigned_agent_uid VARCHAR(191);
ALTER TABLE chats ADD COLUMN IF NOT EXISTS last_reply_by VARCHAR(50); -- 'user', 'agent', 'bot'
ALTER TABLE chats ADD COLUMN IF NOT EXISTS last_incoming_time BIGINT;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS last_outgoing_time BIGINT;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS sla_expires_at TIMESTAMPTZ;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS sla_violated SMALLINT DEFAULT 0;
