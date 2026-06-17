\set ON_ERROR_STOP on

-- Ensure role column exists on user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Ensure plan column exists on user table and is TEXT type
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS plan TEXT;
ALTER TABLE "user" ALTER COLUMN plan TYPE TEXT USING plan::TEXT;

-- Ensure plan_expire column exists on user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS plan_expire BIGINT;

-- Ensure role column exists on admin table
ALTER TABLE admin ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin';

-- Ensure role column exists on agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'agent';
