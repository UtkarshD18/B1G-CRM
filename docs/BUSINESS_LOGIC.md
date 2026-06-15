# Business Logic

Last audited: 2026-06-15

## SaaS Tenancy

| Concept | Implementation |
| --- | --- |
| Tenant user | Row in `"user"` with unique `uid`. |
| Tenant data | Most tables include `uid` and route code filters by `req.decode.uid`. |
| Plan | Full plan row is copied as JSON string into `user.plan`; expiry stored in `user.plan_expire`. |
| Trial | `user.trial` prevents multiple trial activations. |
| API key | JWT stored in `user.api_key`; `/api/v1` requires exact token match. |

## Plans And Limits

| Rule | File |
| --- | --- |
| User must have non-expired plan for protected actions. | `middlewares/plan.js` |
| Contact creation/import respects `contact_limit`. | `checkContactLimit` |
| Notes require `allow_note`. | `checkNote` |
| Tags require `allow_tag`. | `checkTags` |
| Chatbot requires `allow_chatbot`. | `routes/chatbot.js`, `functions/chatbot.js` |
| API routes require `allow_api`. | `routes/apiv2.js` |

## Inbox

| Data | Storage |
| --- | --- |
| Chat header | `chats` table. |
| Full conversation | `conversations/inbox/<uid>/<chatId>.json`. |
| Contact enrichment | `contact` rows merged by mobile number. |
| Labels | `chat_tags` table and/or `chats.chat_tags` JSON text. |
| Assignments | `agent_chats`. |

Meta webhook processing:

1. `POST /api/inbox/webhook/:uid` receives Meta webhook.
2. Broadcast status updates are applied to `broadcast_log` when statuses arrive.
3. Phone number id is checked against tenant `meta_api` when present.
4. `helper/inbox/inbox.js` normalizes and persists messages.
5. `socket.js` emits chat list/conversation/ring updates.
6. Chatbot runtime may execute for new incoming messages.

## Agents

| Rule | Implementation |
| --- | --- |
| Agents belong to tenants | `agents.owner_uid`. |
| Agents can be inactive | `agents.is_active`; checked in `middlewares/agent.js`. |
| Agents see assigned chats only | `agent_chats` joined with `chats`. |
| User can auto-login agent | `POST /api/user/auto_agent_login` signs agent token. |
| Agents use owner plan for sending | `checkPlan` sets `req.decode.uid = req.owner.uid` when `req.owner` exists. |

## Flow Builder And Chatbot

| Item | Implementation |
| --- | --- |
| Flow metadata | `flow` table. |
| Flow node/edge definitions | `flow-json/nodes/<uid>/<flowId>.json`, `flow-json/edges/<uid>/<flowId>.json`. |
| Chatbot definitions | `chatbot` table, linked to flow by `flow_id`. |
| Runtime state | `flow_data` table. |
| Diagnostics | `chatbot_log` table. |

Chatbot route validation ensures:

- Title exists.
- Selected flow belongs to tenant.
- Selected chat targets belong to tenant unless `for_all`.
- QR origins reject unsupported button/list flows in `routes/chatbot.js`.

## Campaigns

| Step | Implementation |
| --- | --- |
| Create | `POST /api/broadcast/add_new` validates template, phonebook, Meta API, schedule. |
| Recipient logs | Inserts one `broadcast_log` row per contact. |
| Queue | `broadcast.status = QUEUE`. |
| Scheduler | `loops/campaignLoop.js` recursively checks queued campaigns. |
| Send | `loops/loopFunctions.js` sends template through Meta API. |
| Delivery updates | Meta webhook updates `broadcast_log.delivery_status` by `meta_msg_id`. |
| Dashboard | `GET /api/broadcast/dashboard_summary` aggregates campaign/log data. |

## Billing

Successful payment/free trial calls `updateUserPlan(plan, uid)`:

1. Reads plan duration.
2. Calculates expiry timestamp.
3. Writes `user.plan` as JSON and `user.plan_expire`.
4. Inserts an `orders` row in provider flows.

Providers present in route code: Stripe, Razorpay, PayPal, Paystack, offline/free trial.

## CMS/Public Site

| Feature | Storage |
| --- | --- |
| Public config | `web_public`. |
| Payment credentials | `web_private`. |
| Pages | `page`. |
| FAQ | `faq`. |
| Testimonials | `testimonial`. |
| Partners | `partners`. |
| Contact leads | `contact_form`. |
| Translations | `languages/*.json`. |
| Theme | `routes/theme.json`. |

## Developer API And Webhooks

| Feature | Implementation |
| --- | --- |
| API key generation | `GET /api/user/generate_api_keys`. |
| Send arbitrary message | `POST /api/v1/send-message?token=...`. |
| Send template by name | `POST /api/v1/send_templet`. |
| Webhook rules | CRUD in `routes/webhooks.js`, table `webhook_rules`. |
| Webhook execution | Not found as a completed runtime engine. |

## QR WhatsApp

The code contains QR routes and helper files, but current `helper/addon/qr/index.js` exports no-op functions. Treat QR as not production-ready until this changes.
