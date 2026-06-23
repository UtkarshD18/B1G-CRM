-- Migration: 017_agent_permissions.sql
-- Add permissions column to agents table containing JSON string or array of permissions.
-- Default value: empty array string '[]'.

ALTER TABLE agents ADD COLUMN IF NOT EXISTS permissions TEXT DEFAULT '[]';
