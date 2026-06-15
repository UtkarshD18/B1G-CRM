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
