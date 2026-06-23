-- Migration: 014_campaign_retries.sql

ALTER TABLE broadcast_log ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;
