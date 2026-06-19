\set ON_ERROR_STOP on

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
