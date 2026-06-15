\set ON_ERROR_STOP on

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
