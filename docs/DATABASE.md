# Database

Last audited: 2026-06-15

## Source Of Truth

Runtime migrations are the reliable source of truth:

| File | Purpose |
| --- | --- |
| `database/migrate.js` | Creates `schema_migrations`, applies sorted `database/migrations/*.sql` once each inside transactions. |
| `database/migrations/000_create_base_schema.sql` | Base auth, tenants, agents, phonebook, contacts, broadcasts, logs, development seed accounts. |
| `database/migrations/001_create_plan.sql` | Plans and plan seed rows. |
| `database/migrations/002_create_core_app_tables.sql` | CMS, payments, inbox, flows, chatbots, QR instances, agent tasks, widgets. |
| `database/migrations/003_cleanup_singleton_config.sql` | Keeps one `web_private` row. |
| `database/migrations/004_add_campaign_dashboard_indexes.sql` | Campaign dashboard indexes. |
| `database/migrations/005_add_phonebook_audience_count_index.sql` | Contact phonebook audience index. |
| `database/migrations/006_create_chatbot_log.sql` | Chatbot diagnostics. |
| `database/migrations/007_create_webhook_rules.sql` | Tenant webhook rule CRUD storage. |

Warning: `database/schema.sql` says it is canonical but does not include all later tables from migration `002` onward. Use migrations for implementation work.

## Database Connection

| File | Behavior |
| --- | --- |
| `database/config.js` | Creates `pg.Pool` from `DATABASE_URL` or `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`; optional `PGSSL`. |
| `database/dbpromise.js` | Exposes `query(sql, values)` with MySQL-style `?` placeholders converted to PostgreSQL parameters. |

## Tables

| Table | Columns | Purpose |
| --- | --- | --- |
| `schema_migrations` | `filename`, `applied_at` | Tracks applied SQL migration files. Created by `migrate.js`. |
| `admin` | `id`, `uid`, `email`, `password`, `role`, `created_at`, `updated_at`, `createdAt`, `updatedAt` | SaaS admin accounts. Mixed timestamp names exist due migrations. |
| `"user"` | `id`, `uid`, `name`, `email`, `password`, `role`, `mobile_with_country_code`, `timezone`, `plan`, `plan_expire`, `trial`, `api_key`, timestamps | Tenant accounts. `plan` is JSON text, `plan_expire` is epoch ms. |
| `agents` | `id`, `owner_uid`, `uid`, `email`, `password`, `role`, `name`, `mobile`, `comments`, `is_active`, timestamps | Staff accounts owned by tenant users. |
| `plan` | `id`, `title`, `short_description`, `allow_tag`, `allow_note`, `allow_chatbot`, `contact_limit`, `allow_api`, `is_trial`, `price`, `price_strike`, `plan_duration_in_days`, timestamps | SaaS pricing/permission plans. |
| `phonebook` | `id`, `uid`, `name`, timestamps | Tenant contact groups. |
| `contact` | `id`, `uid`, `phonebook_id`, `phonebook_name`, `name`, `mobile`, `var1`-`var5`, timestamps | Tenant contact records used by campaigns/templates. |
| `broadcast` | `id`, `broadcast_id`, `uid`, `title`, `templet`, `phonebook`, `status`, `schedule`, `timezone`, timestamps | Scheduled campaign headers. |
| `broadcast_log` | `id`, `uid`, `broadcast_id`, `templet_name`, `sender_mobile`, `send_to`, `delivery_status`, `example`, `contact`, `meta_msg_id`, `delivery_time`, `err`, timestamps | One row per campaign recipient/message. |
| `web_public` | `id`, logo/app/currency/tutorial/social/RTL fields, timestamps | Public site and admin-configurable frontend settings. |
| `web_private` | `id`, offline/Stripe/PayPal/Razorpay/Paystack credential fields, timestamps | Payment gateway settings. |
| `partners` | `id`, `filename`, `createdAt` | Partner logo records. |
| `faq` | `id`, `question`, `answer`, `createdAt` | FAQ CMS. |
| `page` | `id`, `slug`, `title`, `image`, `content`, `permanent`, timestamps | CMS/custom pages plus terms/privacy. |
| `testimonial` | `id`, `title`, `description`, `reviewer_name`, `reviewer_position`, `createdAt` | Testimonials. |
| `orders` | `id`, `uid`, `payment_mode`, `amount`, `data`, `s_token`, `createdAt` | Billing/order history. |
| `contact_form` | `id`, `email`, `name`, `mobile`, `content`, `createdAt` | Public contact leads. |
| `smtp` | `id`, `email`, `host`, `port`, `password`, timestamps | SMTP settings for recovery/test emails. |
| `gen_links` | `id`, `wa_mobile`, `email`, `msg`, `createdAt` | Generated WhatsApp link leads. |
| `meta_api` | `id`, `uid`, `waba_id`, `business_account_id`, `access_token`, `business_phone_number_id`, `app_id`, timestamps | Tenant Meta WhatsApp Cloud API credentials. |
| `meta_templet_media` | `id`, `uid`, `templet_name`, `meta_hash`, `file_name`, `createdAt` | Meta template media upload mapping. |
| `chats` | `id`, `chat_id`, `uid`, `last_message_came`, `sender_name`, `sender_mobile`, `last_message`, `is_opened`, `chat_status`, `chat_note`, `chat_tags`, `origin`, `profile`, `other`, timestamps | Inbox conversation headers. Full history is JSON files. |
| `rooms` | `id`, `uid`, `socket_id`, `createdAt` | Older socket room tracking. Active `socket.js` uses in-memory connection info. |
| `agent_chats` | `id`, `owner_uid`, `uid`, `chat_id`, `createdAt` | Chat assignment from tenant owner to agent. |
| `chat_tags` | `id`, `uid`, `hex`, `title`, `createdAt` | Tenant label definitions. |
| `chatbot` | `id`, `uid`, `title`, `for_all`, `chats`, `flow`, `flow_id`, `active`, `origin`, timestamps | Chatbot definitions pointing at saved flows. |
| `flow` | `id`, `uid`, `flow_id`, `title`, `prevent_list`, `ai_list`, timestamps | Flow metadata. Node/edge bodies live on disk. |
| `flow_data` | `id`, `chatId`, `uid`, `uniqueId`, `inputs`, `other`, `last_node`, `disabled`, timestamps | Per-chat chatbot execution state. |
| `templets` | `id`, `uid`, `content`, `type`, `title`, `createdAt` | Tenant local templates. |
| `instance` | `id`, `uid`, `title`, `uniqueId`, `status`, `other`, timestamps | QR/Baileys session records. |
| `agent_task` | `id`, `owner_uid`, `uid`, `title`, `description`, `status`, `agent_comments`, timestamps | Tasks assigned to agents. |
| `chat_widget` | `id`, `unique_id`, `uid`, `title`, `whatsapp_number`, `logo`, `place`, `size`, timestamps | Embeddable WhatsApp widget config. |
| `chatbot_log` | `id`, `uid`, `chatbot_id`, `chatbot_title`, `flow_id`, `sender_number`, `sender_name`, `incoming_message`, `origin`, `matched`, `status`, `detail`, `created_at` | Runtime chatbot diagnostics. |
| `webhook_rules` | `id`, `uid`, `name`, `source`, `event_type`, `match_field`, `match_operator`, `match_value`, `action_type`, `action_payload`, `active`, timestamps | Tenant webhook automation rule definitions. |

## Relationships

No explicit foreign keys are declared in migrations. Logical relationships:

| From | To | Key |
| --- | --- | --- |
| `agents.owner_uid` | `"user".uid` | Tenant owns agents. |
| `agent_chats.owner_uid` | `"user".uid` | Tenant owns chat assignment. |
| `agent_chats.uid` | `agents.uid` | Assigned agent. |
| `agent_chats.chat_id` | `chats.chat_id` | Assigned chat. |
| `phonebook.uid`, `contact.uid` | `"user".uid` | Tenant data. |
| `contact.phonebook_id` | `phonebook.id` | Contact group. |
| `broadcast.uid`, `broadcast_log.uid` | `"user".uid` | Tenant campaigns. |
| `broadcast_log.broadcast_id` | `broadcast.broadcast_id` | Campaign recipients. |
| `chats.uid` | `"user".uid` | Tenant inbox. |
| `chatbot.flow_id` | `flow.flow_id` | Chatbot flow selection. |
| `flow_data.uid` | `"user".uid` | Runtime state owner. |
| `meta_api.uid` | `"user".uid` | Tenant Meta credentials. |
| `orders.uid` | `"user".uid` | Tenant billing history. |
| `webhook_rules.uid` | `"user".uid` | Tenant webhook rules. |

## Indexes

| Index | Table | Columns |
| --- | --- | --- |
| `idx_agents_owner_uid` | `agents` | `owner_uid` |
| `idx_plan_is_trial` | `plan` | `is_trial` |
| `idx_phonebook_uid` | `phonebook` | `uid` |
| `idx_contact_uid` | `contact` | `uid` |
| `idx_contact_phonebook_id` | `contact` | `phonebook_id` |
| `idx_contact_mobile` | `contact` | `mobile` |
| `idx_contact_uid_phonebook_id` | `contact` | `uid`, `phonebook_id` |
| `idx_broadcast_status` | `broadcast` | `status` |
| `idx_broadcast_uid` | `broadcast` | `uid` |
| `idx_broadcast_id` | `broadcast` | `broadcast_id` |
| `idx_broadcast_uid_schedule` | `broadcast` | `uid`, `schedule` |
| `idx_broadcast_uid_created_at` | `broadcast` | `uid`, `created_at` |
| `idx_broadcast_log_bid_status` | `broadcast_log` | `broadcast_id`, `delivery_status` |
| `idx_broadcast_log_uid_bid` | `broadcast_log` | `uid`, `broadcast_id` |
| `idx_broadcast_log_meta_msg_id` | `broadcast_log` | `meta_msg_id` |
| `idx_broadcast_log_uid_created_at` | `broadcast_log` | `uid`, `created_at` |
| `idx_broadcast_log_uid_updated_at` | `broadcast_log` | `uid`, `updated_at` |
| `idx_orders_uid` | `orders` | `uid` |
| `idx_meta_templet_media_name` | `meta_templet_media` | `templet_name` |
| `idx_chats_uid` | `chats` | `uid` |
| `idx_chats_status` | `chats` | `uid`, `chat_status` |
| `idx_chats_last_message_came` | `chats` | `last_message_came` |
| `idx_rooms_uid` | `rooms` | `uid` |
| `idx_agent_chats_owner` | `agent_chats` | `owner_uid` |
| `idx_agent_chats_uid` | `agent_chats` | `uid` |
| `idx_agent_chats_chat` | `agent_chats` | `chat_id` |
| `idx_chat_tags_uid` | `chat_tags` | `uid` |
| `idx_chatbot_uid` | `chatbot` | `uid` |
| `idx_chatbot_active` | `chatbot` | `uid`, `active` |
| `idx_flow_uid` | `flow` | `uid` |
| `idx_flow_data_uid` | `flow_data` | `uid` |
| `idx_templets_uid` | `templets` | `uid` |
| `idx_instance_uid` | `instance` | `uid` |
| `idx_agent_task_owner` | `agent_task` | `owner_uid` |
| `idx_agent_task_uid` | `agent_task` | `uid` |
| `idx_chat_widget_uid` | `chat_widget` | `uid` |
| `idx_chatbot_log_uid_created_at` | `chatbot_log` | `uid`, `created_at DESC` |
| `idx_chatbot_log_uid_chatbot` | `chatbot_log` | `uid`, `chatbot_id` |
| `idx_chatbot_log_uid_status` | `chatbot_log` | `uid`, `status` |
| `idx_webhook_rules_uid` | `webhook_rules` | `uid` |
| `idx_webhook_rules_active` | `webhook_rules` | `uid`, `active` |

## Seed Data

| Data | Values |
| --- | --- |
| Plans | `Trial`, `Premium`, `Platinum`. |
| Local admin | `admin@example.com`, uid `local-admin-uid`, bcrypt password hash seeded by migration. |
| Local user | `user@example.com`, uid `local-user-uid`, seeded active plan until `4102444800000`. |
| Local agent | `agent@example.com`, uid `local-agent-uid`, owner `local-user-uid`. |
| CMS defaults | One `web_public`, one `web_private`, terms/privacy page rows. |

The seed password is stored as a bcrypt hash in migrations. Do not document or infer the plaintext password unless explicitly confirmed elsewhere.

## Non-Table Persistence

| Path | Data |
| --- | --- |
| `conversations/inbox/<uid>/<chatId>.json` | Full ordered message history for inbox conversations. |
| `flow-json/nodes/<uid>/<flowId>.json` | React Flow node definitions. |
| `flow-json/edges/<uid>/<flowId>.json` | React Flow edge definitions. |
| `client/public/media` | Uploaded user/admin media and widget logos. |
| `client/public/meta-media` | Downloaded inbound Meta/QR media when present. |
| `languages/*.json` | Translation files edited by web/admin routes. |
| `routes/theme.json` | Theme JSON edited by web routes. |

## Schema Caveats

| Caveat | Impact |
| --- | --- |
| No foreign keys | Route code must enforce tenant and relationship safety. |
| Mixed `created_at` and `createdAt` | Query code must use the actual column name for each table. |
| `flow.flow_id` is globally unique | Two tenants cannot currently share the same `flow_id` value. |
| `user.plan` is JSON text | Plan changes copy a snapshot to each user rather than referencing live plan rows. |
| `chats.last_message` is JSON text | Consumers must parse when needed. |
| Runtime JSON files are part of state | DB backups alone do not preserve conversation/flow content. |
