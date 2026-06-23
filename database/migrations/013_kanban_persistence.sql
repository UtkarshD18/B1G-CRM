-- Migration: 013_kanban_persistence.sql

ALTER TABLE chats ADD COLUMN IF NOT EXISTS kanban_order INT DEFAULT 0;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS pipeline_order INT DEFAULT 0;
