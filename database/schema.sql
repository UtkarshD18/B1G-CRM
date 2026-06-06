-- B1G CRM Database Schema
-- Version: 1.0
-- Created: 2026-06-06

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS b1g_crm;
USE b1g_crm;

-- =====================================================
-- CORE AUTHENTICATION & ADMIN TABLES
-- =====================================================

-- Admin Users (SaaS Super-Admins)
CREATE TABLE IF NOT EXISTS admin (
  uid VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'moderator', 'support') DEFAULT 'moderator',
  permissions JSON,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_email (email),
  KEY idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SAAS PLANS & BILLING TABLES
-- =====================================================

-- Pricing Plans
CREATE TABLE IF NOT EXISTS plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  billing_cycle ENUM('monthly', 'yearly', 'lifetime') DEFAULT 'monthly',
  features_json JSON,
  max_agents INT DEFAULT 1,
  max_contacts INT DEFAULT 1000,
  max_api_calls INT DEFAULT 10000,
  max_campaigns INT DEFAULT 10,
  max_chat_flows INT DEFAULT 5,
  active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_active (active),
  KEY idx_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- USER & TENANT TABLES
-- =====================================================

-- SaaS Users (Tenants)
CREATE TABLE IF NOT EXISTS user (
  uid VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  company_name VARCHAR(255),
  country VARCHAR(100),
  timezone VARCHAR(50),
  language VARCHAR(10) DEFAULT 'en',
  plan_id INT,
  stripe_customer_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  two_fa_enabled BOOLEAN DEFAULT false,
  two_fa_secret VARCHAR(255),
  last_login TIMESTAMP NULL,
  profile_image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL,
  KEY idx_email (email),
  KEY idx_plan_id (plan_id),
  KEY idx_is_active (is_active),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Settings
CREATE TABLE IF NOT EXISTS user_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid VARCHAR(36) NOT NULL UNIQUE,
  whatsapp_phone_number_id VARCHAR(255),
  whatsapp_business_account_id VARCHAR(255),
  whatsapp_access_token VARCHAR(500),
  instagram_account_id VARCHAR(255),
  instagram_access_token VARCHAR(500),
  telegram_bot_token VARCHAR(500),
  default_response_time INT,
  theme_primary_color VARCHAR(7) DEFAULT '#00A389',
  theme_secondary_color VARCHAR(7) DEFAULT '#1E293B',
  theme_accent_color VARCHAR(7) DEFAULT '#F59E0B',
  notifications_enabled BOOLEAN DEFAULT true,
  auto_reply_message TEXT,
  auto_reply_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uid) REFERENCES user(uid) ON DELETE CASCADE,
  KEY idx_uid (uid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- AGENT & STAFF TABLES
-- =====================================================

-- Agents (Staff Members)
CREATE TABLE IF NOT EXISTS agent (
  uid VARCHAR(36) PRIMARY KEY,
  owner_uid VARCHAR(36) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role ENUM('admin', 'agent', 'manager', 'supervisor') DEFAULT 'agent',
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP NULL,
  profile_image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_uid) REFERENCES user(uid) ON DELETE CASCADE,
  KEY idx_owner_uid (owner_uid),
  KEY idx_email (email),
  KEY idx_is_active (is_active),
  KEY idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CONTACT & CONVERSATION TABLES
-- =====================================================

-- Contacts (CRM Contacts per User)
CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid VARCHAR(36) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  tags JSON,
  metadata JSON,
  source ENUM('whatsapp', 'instagram', 'telegram', 'web_chat', 'form_submission', 'manual') DEFAULT 'manual',
  last_message_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uid) REFERENCES user(uid) ON DELETE CASCADE,
  UNIQUE KEY uniq_uid_phone (uid, phone),
  KEY idx_uid (uid),
  KEY idx_phone (phone),
  KEY idx_email (email),
  KEY idx_last_message_at (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversations (Chat Threads)
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(36) PRIMARY KEY,
  uid VARCHAR(36) NOT NULL,
  contact_id INT NOT NULL,
  platform ENUM('whatsapp', 'instagram', 'telegram', 'web_chat', 'sms') DEFAULT 'whatsapp',
  latest_message TEXT,
  unread_count INT DEFAULT 0,
  assigned_agent_uid VARCHAR(36),
  status ENUM('open', 'archived', 'closed') DEFAULT 'open',
  meta_conversation_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uid) REFERENCES user(uid) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_agent_uid) REFERENCES agent(uid) ON DELETE SET NULL,
  KEY idx_uid (uid),
  KEY idx_contact_id (contact_id),
  KEY idx_assigned_agent_uid (assigned_agent_uid),
  KEY idx_platform (platform),
  KEY idx_status (status),
  KEY idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) PRIMARY KEY,
  conversation_id VARCHAR(36) NOT NULL,
  sender_type ENUM('user', 'agent', 'contact', 'system') DEFAULT 'contact',
  sender_uid VARCHAR(36),
  sender_name VARCHAR(255),
  type ENUM('text', 'image', 'file', 'video', 'audio', 'location', 'emoji') DEFAULT 'text',
  content TEXT,
  media_url VARCHAR(500),
  caption TEXT,
  meta_message_id VARCHAR(255),
  status ENUM('sent', 'delivered', 'read', 'failed') DEFAULT 'sent',
  reaction VARCHAR(10),
  star BOOLEAN DEFAULT false,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  KEY idx_conversation_id (conversation_id),
  KEY idx_timestamp (timestamp),
  KEY idx_sender_type (sender_type),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agent Chat Assignments
CREATE TABLE IF NOT EXISTS agent_chats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agent_uid VARCHAR(36) NOT NULL,
  conversation_id VARCHAR(36) NOT NULL,
  is_primary_assignee BOOLEAN DEFAULT true,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_uid) REFERENCES agent(uid) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_agent_conversation (agent_uid, conversation_id),
  KEY idx_agent_uid (agent_uid),
  KEY idx_conversation_id (conversation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CHATBOT & FLOWBUILDER TABLES
-- =====================================================

-- Chat Flow (Flowbuilder/Chatbot)
CREATE TABLE IF NOT EXISTS chat_flow (
  id VARCHAR(36) PRIMARY KEY,
  uid VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_keywords JSON,
  nodes_json LONGTEXT,
  edges_json LONGTEXT,
  variables JSON,
  active BOOLEAN DEFAULT false,
  version INT DEFAULT 1,
  template_type ENUM('chatbot', 'form', 'survey', 'lead_capture') DEFAULT 'chatbot',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uid) REFERENCES user(uid) ON DELETE CASCADE,
  KEY idx_uid (uid),
  KEY idx_active (active),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CAMPAIGN & BROADCAST TABLES
-- =====================================================

-- Broadcast Campaigns
CREATE TABLE IF NOT EXISTS broadcast_campaign (
  id VARCHAR(36) PRIMARY KEY,
  uid VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  template VARCHAR(500),
  message_content TEXT,
  target_contacts_count INT DEFAULT 0,
  scheduled_at TIMESTAMP NULL,
  sent_at TIMESTAMP NULL,
  status ENUM('draft', 'scheduled', 'sending', 'completed', 'failed', 'paused') DEFAULT 'draft',
  delivery_stats JSON,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uid) REFERENCES user(uid) ON DELETE CASCADE,
  KEY idx_uid (uid),
  KEY idx_status (status),
  KEY idx_scheduled_at (scheduled_at),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Meta Templates (WhatsApp/Instagram Approved Templates)
CREATE TABLE IF NOT EXISTS meta_template (
  id VARCHAR(36) PRIMARY KEY,
  uid VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  template_content LONGTEXT,
  variables JSON,
  languages JSON,
  approval_status ENUM('approved', 'pending', 'rejected', 'paused') DEFAULT 'pending',
  meta_template_id VARCHAR(255),
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uid) REFERENCES user(uid) ON DELETE CASCADE,
  KEY idx_uid (uid),
  KEY idx_approval_status (approval_status),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PAYMENT & BILLING TABLES
-- =====================================================

-- Payment Orders
CREATE TABLE IF NOT EXISTS payment_order (
  id VARCHAR(36) PRIMARY KEY,
  uid VARCHAR(36) NOT NULL,
  plan_id INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  billing_cycle ENUM('monthly', 'yearly', 'lifetime') DEFAULT 'monthly',
  status ENUM('pending', 'success', 'failed', 'refunded', 'expired') DEFAULT 'pending',
  stripe_payment_id VARCHAR(255),
  razorpay_order_id VARCHAR(255),
  payment_method VARCHAR(50),
  receipt_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  next_billing_date TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uid) REFERENCES user(uid) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT,
  KEY idx_uid (uid),
  KEY idx_status (status),
  KEY idx_created_at (created_at),
  KEY idx_next_billing_date (next_billing_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscription Records
CREATE TABLE IF NOT EXISTS subscription (
  id VARCHAR(36) PRIMARY KEY,
  uid VARCHAR(36) NOT NULL,
  plan_id INT NOT NULL,
  status ENUM('active', 'paused', 'cancelled', 'expired') DEFAULT 'active',
  stripe_subscription_id VARCHAR(255),
  razorpay_subscription_id VARCHAR(255),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uid) REFERENCES user(uid) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT,
  KEY idx_uid (uid),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- API & INTEGRATION TABLES
-- =====================================================

-- API Keys
CREATE TABLE IF NOT EXISTS api_key (
  id VARCHAR(36) PRIMARY KEY,
  uid VARCHAR(36) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  permissions JSON,
  rate_limit INT DEFAULT 1000,
  last_used_at TIMESTAMP NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  rotated_at TIMESTAMP NULL,
  FOREIGN KEY (uid) REFERENCES user(uid) ON DELETE CASCADE,
  KEY idx_uid (uid),
  KEY idx_active (active),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Webhook Subscriptions
CREATE TABLE IF NOT EXISTS webhook_subscription (
  id VARCHAR(36) PRIMARY KEY,
  uid VARCHAR(36) NOT NULL,
  url VARCHAR(500) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT true,
  retry_count INT DEFAULT 0,
  last_triggered_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uid) REFERENCES user(uid) ON DELETE CASCADE,
  KEY idx_uid (uid),
  KEY idx_event_type (event_type),
  KEY idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CMS & CONFIGURATION TABLES
-- =====================================================

-- Pages (CMS)
CREATE TABLE IF NOT EXISTS page (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT,
  image_url VARCHAR(500),
  permanent BOOLEAN DEFAULT false,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_slug (slug),
  KEY idx_permanent (permanent)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FAQs
CREATE TABLE IF NOT EXISTS faq (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question VARCHAR(500) NOT NULL,
  answer LONGTEXT NOT NULL,
  category VARCHAR(100),
  order_index INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_active (active),
  KEY idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Partners/Brands
CREATE TABLE IF NOT EXISTS partners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(500) NOT NULL,
  uploaded_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- LANGUAGE & LOCALIZATION
-- =====================================================

-- Language Translations
CREATE TABLE IF NOT EXISTS language_translation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  language_code VARCHAR(10) NOT NULL,
  translation_key VARCHAR(255) NOT NULL,
  translation_value TEXT NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_lang_key (language_code, translation_key),
  KEY idx_language_code (language_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TASK & ASSIGNMENT TABLES
-- =====================================================

-- Tasks
CREATE TABLE IF NOT EXISTS task (
  id VARCHAR(36) PRIMARY KEY,
  uid VARCHAR(36) NOT NULL,
  agent_uid VARCHAR(36),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('open', 'in_progress', 'completed', 'cancelled') DEFAULT 'open',
  contact_id INT,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uid) REFERENCES user(uid) ON DELETE CASCADE,
  FOREIGN KEY (agent_uid) REFERENCES agent(uid) ON DELETE SET NULL,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  KEY idx_uid (uid),
  KEY idx_agent_uid (agent_uid),
  KEY idx_status (status),
  KEY idx_due_date (due_date),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- AUDIT & LOGGING TABLES
-- =====================================================

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid VARCHAR(36),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(36),
  changes JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_uid (uid),
  KEY idx_action (action),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Error Logs
CREATE TABLE IF NOT EXISTS error_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  error_type VARCHAR(100),
  error_message TEXT,
  stack_trace LONGTEXT,
  uid VARCHAR(36),
  endpoint VARCHAR(255),
  http_method VARCHAR(10),
  status_code INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_created_at (created_at),
  KEY idx_error_type (error_type),
  KEY idx_uid (uid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SESSION & TOKENS
-- =====================================================

-- Sessions
CREATE TABLE IF NOT EXISTS session (
  id VARCHAR(255) PRIMARY KEY,
  uid VARCHAR(36) NOT NULL,
  user_type ENUM('user', 'agent', 'admin') DEFAULT 'user',
  access_token VARCHAR(500),
  refresh_token VARCHAR(500),
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_uid (uid),
  KEY idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CREATE INDEXES FOR OPTIMIZATION
-- =====================================================

-- Additional performance indexes
ALTER TABLE user ADD INDEX idx_email_plan (email, plan_id);
ALTER TABLE agent ADD INDEX idx_owner_uid_active (owner_uid, is_active);
ALTER TABLE contacts ADD INDEX idx_uid_created_at (uid, created_at);
ALTER TABLE conversations ADD INDEX idx_uid_status (uid, status);
ALTER TABLE messages ADD INDEX idx_conversation_id_timestamp (conversation_id, timestamp);
ALTER TABLE broadcast_campaign ADD INDEX idx_uid_status (uid, status);

-- =====================================================
-- Insert Sample Data
-- =====================================================

-- Insert default plans
INSERT IGNORE INTO plans (id, name, description, price, billing_cycle, max_agents, max_contacts, max_api_calls, features_json) VALUES
(1, 'Starter', 'Perfect for small businesses', 9.99, 'monthly', 1, 1000, 10000, '["whatsapp", "instagram", "basic_chat", "contacts"]'),
(2, 'Professional', 'For growing teams', 29.99, 'monthly', 5, 10000, 100000, '["whatsapp", "instagram", "telegram", "chatbot", "broadcast", "api", "analytics"]'),
(3, 'Enterprise', 'For large organizations', 99.99, 'monthly', 50, 100000, 1000000, '["whatsapp", "instagram", "telegram", "chatbot", "broadcast", "api", "webhooks", "custom", "support", "analytics"]');

-- Create upload directory if doesn't exist (via application)
-- COMMIT;

-- Display successful creation message
SELECT '✓ B1G CRM Database Schema Created Successfully' AS Status;
