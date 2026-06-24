-- Migration: Add auto_reply_disabled_until to contact table
ALTER TABLE contact ADD COLUMN IF NOT EXISTS auto_reply_disabled_until TIMESTAMPTZ;
