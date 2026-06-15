# API Reference

Last audited: 2026-06-15

This route inventory was derived from `server.js` route mounts and `routes/*.js` route declarations.

## Auth Labels

| Label | Meaning |
| --- | --- |
| Public | No active middleware on the route declaration. |
| Admin | `adminValidator` from `middlewares/admin.js`. |
| User | `validateUser` from `middlewares/user.js`. |
| Agent | `validateAgent` from `middlewares/agent.js`. |
| User+Plan | `validateUser`, then `checkPlan`. |
| User+Plan+Limit | `validateUser`, `checkPlan`, and `checkContactLimit`. |
| Agent+Plan | `validateAgent`, then `checkPlan` using owner plan. |
| API key | Custom token validation in `routes/apiv2.js`. |

Most routes return JSON with `success`, `msg`, and/or `data`, but response shape is not fully standardized. Public widget and payment callback routes may return HTML/text.

## Server-Level Routes

| Method | Path | Auth | Purpose | Request | Response |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/health` | Public | Healthcheck for Docker/app monitoring. | None | `{ success, msg, timestamp, version, environment }` |
| GET | `/api/status` | Public | Runtime status and uptime. | None | `{ success, status, version, uptime, timestamp }` |
| GET | `*` | Public | SPA fallback after API/static routes. | Path | `client/dist/index.html`, `client/public/index.html`, or 404 JSON |

## `/api/admin` - `routes/admin.js`

| Method | Path | Auth | Purpose | Request | Response |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/admin/login` | Public | Admin login. | Body: `email`, `password` | `{ success, token }` or error JSON |
| POST | `/api/admin/add_plan` | Admin | Create plan. | Plan fields: `title`, `short_description`, permissions, limits, price, duration | Status JSON |
| GET | `/api/admin/get_plans` | Public | List plans. | None | `{ success, data }` |
| GET | `/api/admin/get_web_public` | Public | Read public web settings. | None | `{ success, data }` |
| POST | `/api/admin/del_plan` | Admin | Delete plan. | Body: `id` | Status JSON |
| POST | `/api/admin/edit_plan` | Admin | Update plan. | Body: `id` plus plan fields | Status JSON |
| GET | `/api/admin/get_users` | Admin | List tenant users. | None | `{ success, data }` |
| POST | `/api/admin/update_user` | Admin | Update tenant profile/password. | Body: `uid`, `name`, `email`, `mobile_with_country_code`, optional `newPassword` | Status JSON |
| POST | `/api/admin/update_plan` | Admin | Assign plan to user. | Body: `plan`, `uid` | Status JSON |
| GET | `/api/admin/get_payment_gateway_admin` | Admin | Read payment gateway settings. | None | `{ success, data }` |
| POST | `/api/admin/update_pay_gateway` | Admin | Update offline/Stripe/PayPal/Razorpay/Paystack settings. | Body: gateway credential and active fields | Status JSON |
| POST | `/api/admin/add_brand_image` | Admin | Upload partner/brand logo. | Multipart: `file` | Status JSON |
| GET | `/api/admin/get_brands` | Public | List partner logos. | None | `{ success, data }` |
| POST | `/api/admin/del_brand_logo` | Admin | Delete partner logo row. | Body: `id` | Status JSON |
| POST | `/api/admin/add_faq` | Admin | Create FAQ row. | Body: `question`, `answer` | Status JSON |
| GET | `/api/admin/get_faq` | Public | List FAQ rows. | None | `{ success, data }` |
| POST | `/api/admin/del_faq` | Admin | Delete FAQ row. | Body: `id` | Status JSON |
| POST | `/api/admin/add_page` | Admin | Create custom CMS page. | Multipart/body: `title`, `content`, `slug`, `file` | Status JSON |
| GET | `/api/admin/get_pages` | Public | List non-permanent pages. | None | `{ success, data }` |
| POST | `/api/admin/del_page` | Admin | Delete page. | Body: `id` | Status JSON |
| POST | `/api/admin/auto_login` | Admin | Generate tenant user token. | Body: `uid` | `{ success, token }` |
| POST | `/api/admin/add_testimonial` | Admin | Create testimonial. | Body: `title`, `description`, `reviewer_name`, `reviewer_position` | Status JSON |
| GET | `/api/admin/get_testi` | Public | List testimonials. | None | `{ success, data }` |
| POST | `/api/admin/del_testi` | Admin | Delete testimonial. | Body: `id` | Status JSON |
| GET | `/api/admin/get_orders` | Admin | List orders joined to users. | None | `{ success, data }` |
| GET | `/api/admin/get_contact_leads` | Admin | List public contact leads. | None | `{ success, data }` |
| POST | `/api/admin/del_cotact_entry` | Admin | Delete contact lead. | Body: `id` | Status JSON |
| POST | `/api/admin/get_page_slug` | Public | Fetch page by slug. | Body: `slug` | `{ success, page, data }` |
| POST | `/api/admin/update_terms` | Admin | Upsert terms page. | Body: `title`, `content` | Status JSON |
| POST | `/api/admin/update_privacy_policy` | Admin | Upsert privacy page. | Body: `title`, `content` | Status JSON |
| GET | `/api/admin/get_smtp` | Admin | Read SMTP settings. | None | `{ success, data }` |
| POST | `/api/admin/update_smtp` | Admin | Upsert SMTP settings. | Body: `email`, `port`, `password`, `host` | Status JSON |
| POST | `/api/admin/send_test_email` | Admin | Send SMTP test email. | Body: SMTP fields plus `to` | Status JSON |
| GET | `/api/admin/get_dashboard_for_user` | Admin | Admin dashboard metrics. | None | `{ success, data }` |
| GET | `/api/admin/get_admin` | Admin | Read current admin row. | None | `{ success, data }` |
| POST | `/api/admin/update-admin` | Admin | Update admin email/password. | Body: `email`, optional `newpass` | Status JSON |
| POST | `/api/admin/send_resovery` | Public | Send admin password recovery email. | Body: `email` | Status JSON |
| GET | `/api/admin/modify_password` | Admin | Change admin password using token and query password. | Query: `pass` | Status JSON |
| POST | `/api/admin/del_user` | Admin | Delete tenant user by numeric id. | Body: `id` | Status JSON |
| GET | `/api/admin/get_wa_gen` | Admin | List generated WhatsApp link records. | None | `{ success, data }` |
| POST | `/api/admin/de_wa_den_link` | Admin | Delete generated WhatsApp link. | Body: `id` | Status JSON |
| GET | `/api/admin/get_social_login` | Public | Read social login settings. | None | `{ success, data }` |
| POST | `/api/admin/update_social_login` | Admin | Update Google/Facebook login settings. | Body: social login fields | Status JSON |
| POST | `/api/admin/update_rtl` | Admin | Toggle RTL flag. | Body: `rtl` | Status JSON |

## `/api/user` - `routes/user.js`

| Method | Path | Auth | Purpose | Request | Response |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/user/login_with_facebook` | Public | Facebook login/signup. | Body: `token`, `userId`, `email`, `name` | `{ success, token }` or error |
| POST | `/api/user/login_with_google` | Public | Google login/signup by decoded Google token. | Body: `token` | `{ success, token }` or error |
| POST | `/api/user/signup` | Public | Tenant signup. | Body: `email`, `name`, `password`, `mobile_with_country_code`, `acceptPolicy` | Status JSON |
| POST | `/api/user/login` | Public | Tenant login. | Body: `email`, `password` | `{ success, token }` |
| POST | `/api/user/return_media_url` | User | Upload media to `client/public/media`. | Multipart: `file` | `{ success, url }` |
| GET | `/api/user/get_me` | User | Current tenant profile plus contact count/addons. | None | `{ success, data, addon }` |
| POST | `/api/user/save_note` | User+Plan | Save chat note. | Body: `chatId`, `note` | Status JSON |
| POST | `/api/user/push_tag` | User+Plan | Add tag to chat. | Body: `tag`, `chatId` | Status JSON |
| POST | `/api/user/del_tag` | User | Remove tag from chat. | Body: `tag`, `chatId` | Status JSON |
| POST | `/api/user/check_contact` | User | Check contact by mobile in tenant phonebook. | Body: `mobile` | `{ success, phonebook, contact? }` |
| POST | `/api/user/save_contact` | User+Plan+Limit | Create contact. | Body: phonebook/contact fields plus `var1`-`var5` | Status JSON |
| POST | `/api/user/del_contact` | User | Delete contact. | Body: `id` | Status JSON |
| POST | `/api/user/update_meta` | User | Store/update Meta WhatsApp credentials after phone number validation. | Body: `waba_id`, `business_account_id`, `access_token`, `business_phone_number_id`, `app_id` | Status JSON |
| GET | `/api/user/get_meta_keys` | User | Read Meta credentials. | None | `{ success, data }` |
| POST | `/api/user/add_meta_templet` | User+Plan | Create Meta template through Graph API. | Body: Meta template payload | Status JSON |
| GET | `/api/user/get_my_meta_templets` | User | List Meta templates from Graph API. | None | `{ success, data }` |
| POST | `/api/user/del_meta_templet` | User | Delete Meta template by name. | Body: `name` | Status JSON |
| POST | `/api/user/return_media_url_meta` | User | Upload media and create Meta upload/hash mapping. | Multipart/body: `file`, `templet_name` | `{ success, url/hash data }` style JSON |
| POST | `/api/user/get_plan_details` | User | Fetch selected plan details. | Body: plan data/id per route logic | JSON |
| GET | `/api/user/get_payment_details` | User | Read public/private payment settings needed by billing UI. | None | `{ success, data }` style JSON |
| POST | `/api/user/create_stripe_session` | User | Create Stripe checkout session. | Body: `planData` | JSON with checkout/session data |
| POST | `/api/user/pay_with_rz` | User | Capture Razorpay payment and apply plan. | Body: plan/payment fields | Status JSON |
| POST | `/api/user/pay_with_paypal` | User | Verify PayPal order and apply plan. | Body: PayPal order/plan fields | Status JSON |
| GET | `/api/user/stripe_payment` | Public | Stripe payment callback/finalizer. | Query: `order`, `plan` | HTML/text response |
| POST | `/api/user/pay_with_paystack` | User | Verify Paystack transaction and apply plan. | Body: `planData`, `trans_id`, `reference` | Status JSON |
| POST | `/api/user/update_profile` | User | Update tenant profile/password/timezone. | Body: `name`, `mobile_with_country_code`, `email`, `timezone`, optional `newPassword` | Status JSON |
| GET | `/api/user/get_dashboard` | User | Tenant dashboard metrics and charts. | None | `{ success, totals, series }` |
| POST | `/api/user/start_free_trial` | User | Apply one-time free trial plan. | Body: `planId` | Status JSON |
| POST | `/api/user/send_resovery` | Public | Send user password recovery email. | Body: `email` | Status JSON |
| GET | `/api/user/modify_password` | User | Change password using recovery token. | Query: `pass` | Status JSON |
| GET | `/api/user/generate_api_keys` | User | Generate and store tenant API key. | None | `{ success, token }` |
| GET | `/api/user/fetch_profile` | User | Fetch Meta phone profile. | None | Graph API response JSON |
| POST | `/api/user/add_task_for_agent` | User | Assign task to agent. | Body: `title`, `des`, `agent_uid` | Status JSON |
| GET | `/api/user/get_my_agent_tasks` | User | List tenant-created agent tasks. | None | `{ success, data }` |
| POST | `/api/user/del_task_for_agent` | User | Delete agent task. | Body: `id` | Status JSON |
| POST | `/api/user/add_widget` | User | Create chat widget config. | Body/multipart: `title`, `whatsapp_number`, `place`, `selectedIcon`, `logoType`, `size`, optional `file` | Status JSON |
| GET | `/api/user/get_my_widget` | User | List tenant widgets. | None | `{ success, data }` |
| POST | `/api/user/del_widget` | User | Delete widget. | Body: `id` | Status JSON |
| GET | `/api/user/widget` | Public | Render embeddable widget HTML. | Query: `id` | HTML string |
| POST | `/api/user/update_agent_profile` | User | Update owned agent profile/password. | Body: `email`, `name`, `mobile`, `uid`, optional `newPas` | Status JSON |
| POST | `/api/user/auto_agent_login` | User | Generate token for owned agent. | Body: `uid` | `{ success, token }` |

## `/api/agent` - `routes/agent.js`

| Method | Path | Auth | Purpose | Request | Response |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/agent/add_agent` | User+Plan | Create tenant agent. | Body: `name`, `password`, `email`, `mobile`, `comments` | Status JSON |
| GET | `/api/agent/get_my_agents` | User | List tenant agents. | None | `{ success, data }` |
| POST | `/api/agent/change_agent_activeness` | User | Activate/deactivate agent. | Body: `agentUid`, `activeness` | Status JSON |
| POST | `/api/agent/del_agent` | User | Delete owned agent. | Body: `uid` | Status JSON |
| POST | `/api/agent/get_agent_chats_owner` | User | List chats assigned to an agent from owner view. | Body: `uid` | `{ success, data }` |
| POST | `/api/agent/get_assigned_chat_agent` | User | Get agent assigned to a chat. | Body: `chatId` | `{ success, data }` |
| POST | `/api/agent/update_agent_in_chat` | User | Assign/unassign agent to chat. | Body: `assignAgent`, `chatId`, `agentUid` | Status JSON |
| POST | `/api/agent/del_assign_chat_by_owner` | User | Remove assignment. | Body: `uid`, `chat_id` | Status JSON |
| POST | `/api/agent/login` | Public | Agent login. | Body: `email`, `password` | `{ success, token }` |
| GET | `/api/agent/get_me` | Agent | Current agent profile. | None | `{ success, data }` |
| GET | `/api/agent/get_my_assigned_chats` | Agent | List assigned chats merged with contact data. | None | `{ success, data }` |
| POST | `/api/agent/get_convo` | Agent | Load assigned conversation JSON. | Body: `chatId` | `{ success, data }` |
| POST | `/api/agent/send_text` | Agent+Plan | Send text through owner Meta account. | Body: `text`, `toNumber`, `toName`, `chatId` | Send result JSON |
| POST | `/api/agent/send_audio` | Agent+Plan | Send audio. | Body: `url`, `toNumber`, `toName`, `chatId` | Send result JSON |
| POST | `/api/agent/return_media_url` | Agent | Upload media. | Multipart: `file` | `{ success, url }` |
| POST | `/api/agent/send_doc` | Agent+Plan | Send document. | Body: `url`, `toNumber`, `toName`, `chatId`, optional `caption` | Send result JSON |
| POST | `/api/agent/send_video` | Agent+Plan | Send video. | Body: `url`, `toNumber`, `toName`, `chatId`, optional `caption` | Send result JSON |
| POST | `/api/agent/send_image` | Agent+Plan | Send image. | Body: `url`, `toNumber`, `toName`, `chatId`, optional `caption` | Send result JSON |
| GET | `/api/agent/get_my_task` | Agent | List agent tasks. | None | `{ success, data }` |
| POST | `/api/agent/mark_task_complete` | Agent | Mark task completed with comments. | Body: `id`, `comment` | Status JSON |
| POST | `/api/agent/change_chat_ticket_status` | Agent | Update chat status. | Body: `status`, `chatId` | Status JSON |

## `/api/inbox` - `routes/inbox.js`

| Method | Path | Auth | Purpose | Request | Response |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/inbox/webhook/:uid` | Public | Meta webhook ingest for tenant. Updates broadcast logs, validates phone number id, processes message. | Meta webhook body; URL param `uid` | Sends 200 early, then async processing |
| GET | `/api/inbox/get_chats` | User | List tenant chats merged with contacts. | None | `{ success, data }` |
| POST | `/api/inbox/get_convo` | User | Load conversation JSON. | Body: `chatId` | `{ success, data }` |
| POST | `/api/inbox/change_chat_ticket_status` | User | Change tenant chat status. | Body: `status` in `open/pending/solved`, `chatId` | Status JSON |
| GET | `/api/inbox/webhook/:uid` | Public | Meta webhook verification. | Query: `hub.mode`, `hub.verify_token`, `hub.challenge` | Challenge text or status JSON |
| GET | `/api/inbox/` | Public/debug | Hard-coded socket test endpoint. | Query: `msg` | Echo JSON |
| POST | `/api/inbox/send_templet` | User+Plan | Send message template object. | Body: `content`, `toName`, `toNumber`, `chatId`, `msgType` | Send result JSON |
| POST | `/api/inbox/send_image` | User+Plan | Send image. | Body: `url`, `toNumber`, `toName`, `chatId`, optional `caption` | Send result JSON |
| POST | `/api/inbox/send_video` | User+Plan | Send video. | Body: `url`, `toNumber`, `toName`, `chatId`, optional `caption` | Send result JSON |
| POST | `/api/inbox/send_doc` | User+Plan | Send document. | Body: `url`, `toNumber`, `toName`, `chatId`, optional `caption` | Send result JSON |
| POST | `/api/inbox/send_audio` | User+Plan | Send audio. | Body: `url`, `toNumber`, `toName`, `chatId` | Send result JSON |
| POST | `/api/inbox/send_text` | User+Plan | Send text. | Body: `text`, `toNumber`, `toName`, `chatId` | Send result JSON |
| POST | `/api/inbox/send_meta_templet` | User+Plan | Send approved Meta template by template object. | Body: `template`, `toNumber`, `toName`, `chatId`, `example` | Status JSON |
| POST | `/api/inbox/del_chat` | User | Delete chat row and conversation file. | Body: `chatId` | Status JSON |
| POST | `/api/inbox/merge_chats` | User | Placeholder/empty implementation. | Body unknown | No success behavior implemented |

## `/api/chat_flow` - `routes/chatFlow.js`

| Method | Path | Auth | Purpose | Request | Response |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/chat_flow/add_new` | User+Plan | Save or update flow metadata plus node/edge JSON files. | Body: `title`, `nodes`, `edges`, `flowId` | Status JSON |
| GET | `/api/chat_flow/get_mine` | User | List tenant flows. | None | `{ success, data }` |
| POST | `/api/chat_flow/del_flow` | User | Delete flow row and JSON files. | Body: `id`, `flowId` | Status JSON |
| POST | `/api/chat_flow/get_by_flow_id` | User | Load saved nodes/edges for tenant flow. | Body: `flowId` | `{ success, nodes, edges }` |
| POST | `/api/chat_flow/get_activity` | User+Plan | Return flow prevent/AI activity lists. | Body: `flowId` | `{ success, prevent, ai }` |
| POST | `/api/chat_flow/remove_number_from_activity` | User | Remove number from AI/prevent activity list. | Body: `type`, `number`, `flowId` | Status JSON |

## `/api/chatbot` - `routes/chatbot.js`

| Method | Path | Auth | Purpose | Request | Response |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/chatbot/add_chatbot` | User+Plan | Create chatbot from owned saved flow. | Body: `title`, `flow`, `origin`, `chats`, `for_all` | Status JSON |
| POST | `/api/chatbot/update_chatbot` | User+Plan | Update chatbot. | Body: `id`, `title`, `flow`, `origin`, `chats`, `for_all` | Status JSON |
| GET | `/api/chatbot/get_chatbot` | User | List tenant chatbots. | None | `{ success, data }` |
| GET | `/api/chatbot/get_logs` | User | List recent chatbot diagnostics. | Query: `limit`, optional `chatbot_id`, optional `status` | `{ success, data }` |
| POST | `/api/chatbot/change_bot_status` | User+Plan | Activate/deactivate chatbot. | Body: `id`, `status` | Status JSON |
| POST | `/api/chatbot/del_chatbot` | User | Delete chatbot. | Body: `id` | Status JSON |
| POST | `/api/chatbot/make_request_api` | User+Plan | Test outbound request config. | Body: `url`, `body`, `headers`, `type` | Request result JSON |

## `/api/broadcast` - `routes/broadcast.js`

| Method | Path | Auth | Purpose | Request | Response |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/broadcast/add_new` | User+Plan | Create scheduled campaign and recipient logs. | Body: `title`, `templet`, `phonebook`, `scheduleTimestamp`, `example` | Status JSON |
| GET | `/api/broadcast/dashboard_summary` | User | Campaign dashboard aggregate. | Query: optional `from`, `to` | `{ success, data }` |
| GET | `/api/broadcast/get_broadcast` | User | List campaigns with optional date filters. | Query: optional `from`, `to` | `{ success, data }` |
| POST | `/api/broadcast/get_broadcast_logs` | User | List logs and counts for campaign. | Body: `id` broadcast id | `{ success, data, counts }` |
| POST | `/api/broadcast/change_broadcast_status` | User | Update campaign status. | Body: `status`, `broadcast_id` | Status JSON |
| POST | `/api/broadcast/del_broadcast` | User | Delete campaign and logs. | Body: `broadcast_id` | Status JSON |

## `/api/phonebook` - `routes/phonebook.js`

| Method | Path | Auth | Purpose | Request | Response |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/phonebook/add` | User+Plan+Limit | Create phonebook. | Body: `name` | Status JSON |
| GET | `/api/phonebook/get_by_uid` | User | List phonebooks with contact counts. | None | `{ success, data }` |
| POST | `/api/phonebook/del_phonebook` | User | Delete phonebook and contacts in it. | Body: `id` | Status JSON |
| POST | `/api/phonebook/import_contacts` | User+Plan+Limit | CSV import contacts. | Multipart: `file`; body: `id`, `phonebook_name` | Status JSON |
| POST | `/api/phonebook/add_single_contact` | User+Plan+Limit | Add single contact. | Body: `id`, `phonebook_name`, `mobile`, `name`, `var1`-`var5` | Status JSON |
| GET | `/api/phonebook/get_uid_contacts` | User | List tenant contacts. | None | `{ success, data }` |
| POST | `/api/phonebook/del_contacts` | User | Bulk delete contacts. | Body: `selected` array | Status JSON |

## `/api/qr` - `routes/qr.js`

| Method | Path | Auth | Purpose | Request | Response |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/qr/create` | Public/debug | Start QR session by id. Current QR implementation is stubbed. | Query: `id` | Status JSON |
| GET | `/api/qr/send` | Public/debug | Hard-coded test send through QR session. Current QR implementation is stubbed. | Query unused | `"DONE"` or error JSON |
| POST | `/api/qr/gen_qr` | User+Plan | Create QR instance row and start session. Current QR implementation is stubbed. | Body: `title`, `uniqueId` | Status JSON |
| GET | `/api/qr/get_all` | User | List QR instances and mark inactive when no session found. | None | `{ success, data }` |
| POST | `/api/qr/del_instance` | User | Logout/delete QR instance. | Body: `uniqueId` | Status JSON |
| POST | `/api/qr/change_instance_status` | User | Send WhatsApp presence update. Current QR implementation is stubbed. | Body: `insId`, `status`, `jid` | Status JSON |

## `/api/templet` - `routes/templet.js`

| Method | Path | Auth | Purpose | Request | Response |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/templet/add_new` | User+Plan | Create local template row. | Body: `title`, `type`, `content` | Status JSON |
| GET | `/api/templet/get_templets` | User | List tenant local templates. | None | `{ success, data }` |
| POST | `/api/templet/del_templets` | User | Bulk delete local templates. | Body: `selected` array | Status JSON |

## `/api/v1` - `routes/apiv2.js`

| Method | Path | Auth | Purpose | Request | Response |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/send-message` | API key | Send arbitrary WhatsApp Cloud API message object. | Query: `token`; body: `messageObject` | Meta send response JSON |
| POST | `/api/v1/send_templet` | API key | Send approved template by name. | Body: `token`, `sendTo`, `templetName`, `exampleArr`, optional `mediaUri` | `{ success, metaResponse }` |

## `/api/webhooks` - `routes/webhooks.js`

| Method | Path | Auth | Purpose | Request | Response |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/webhooks/rules` | User | List tenant webhook rules. | None | `{ success, data }` |
| POST | `/api/webhooks/rules` | User | Create webhook rule. | Body: `name`, `source`, `event_type`, `match_field`, `match_operator`, `match_value`, `action_type`, `action_payload`, `active` | `{ success, data }` |
| POST | `/api/webhooks/rules/update` | User | Update webhook rule. | Body: `id` plus rule fields | `{ success, data }` |
| POST | `/api/webhooks/rules/delete` | User | Delete webhook rule. | Body: `id` | Status JSON |

Allowed `match_operator`: `contains`, `equals`, `starts_with`, `exists`.

Allowed `action_type`: `tag_chat`, `set_status`, `assign_agent`, `start_flow`, `send_webhook`.

## `/api/web` - `routes/web.js`

| Method | Path | Auth | Purpose | Request | Response |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/web/` | Public/debug | Return connections for hard-coded uid. | None | JSON |
| GET | `/api/web/return_module` | Public | Return enabled add-ons, plus QR when `checkQr()` true. | None | `{ success, data }` |
| GET | `/api/web/get-one-translation` | Public | Read translation JSON file. | Query: `code` | `{ success, data }` or `{ notfound }` |
| GET | `/api/web/get-all-translation-name` | Public | List language files. | None | `{ success, data }` |
| POST | `/api/web/update-one-translation` | Admin | Write translation JSON. | Body: `code`, `updatedjson` | Status JSON |
| POST | `/api/web/submit_contact_form` | Public | Save public contact form lead. | Body: `name`, `mobile`, `email`, `content` | Status JSON |
| POST | `/api/web/update_web_config` | Admin | Update public web config/logo. | Body/multipart: config fields and optional `file` | Status JSON |
| POST | `/api/web/add-new-translation` | Admin | Duplicate language JSON for new code. | Body: `newcode` | Status JSON |
| GET | `/api/web/get-all-translation-name` | Public | Duplicate route declaration for language list. | None | `{ success, data }` |
| POST | `/api/web/del-one-translation` | Admin | Delete language file unless it is the last one. | Body: `code` | Status JSON |
| GET | `/api/web/check_install` | Public | Check whether `client/public/static` exists. | None | `{ success }` |
| GET | `/api/web/get_app_version` | Public | Return app version from `env.js`. | None | `{ success, version }` |
| POST | `/api/web/install_app` | Public | Upload and extract app package into `client/public`. | Multipart: `file` | Status JSON |
| POST | `/api/web/update_app` | Public with admin password in body | Run provided SQL and extract update package. | Body: `password`, optional `queries`, `newQueries`; multipart `file` | Status JSON |
| GET | `/api/web/update_to_be_shown` | Public | Always indicates update should be shown. | None | `{ success, show: true }` |
| GET | `/api/web/get_web_public` | Public | Read public web settings. | None | `{ success, data }` |
| GET | `/api/web/get_theme` | Public | Read `routes/theme.json`. | None | `{ success, data }` |
| POST | `/api/web/save_theme` | Admin | Write `routes/theme.json`. | Body: `updatedJson` | Status JSON |
| POST | `/api/web/gen_wa_link` | Public | Save generated WhatsApp link lead and return `wa.me` URL. | Body: `mobile`, `email`, `msg` | `{ success, data }` |

## Frontend API Callers

| Page | Main APIs |
| --- | --- |
| `client/src/pages/admin/Dashboard.jsx` | `/api/admin/get_dashboard_for_user` |
| `client/src/pages/admin/Plans.jsx` | `/api/admin/get_plans`, `/api/admin/add_plan`, `/api/admin/edit_plan`, `/api/admin/del_plan` |
| `client/src/pages/admin/Users.jsx` | `/api/admin/get_users`, `/api/admin/get_plans`, `/api/admin/update_user`, `/api/admin/update_plan`, `/api/admin/del_user`, `/api/admin/auto_login` |
| `client/src/pages/admin/Orders.jsx` | `/api/admin/get_orders` |
| `client/src/pages/admin/Settings.jsx` | Admin CMS/settings APIs |
| `client/src/pages/user/Dashboard.jsx` | `/api/user/get_dashboard` |
| `client/src/pages/user/Inbox.jsx` | `/api/user/save_note`, `/api/user/return_media_url`; socket workflow for chat operations |
| `client/src/pages/user/Kanban.jsx` | `/api/inbox/get_chats`, `/api/inbox/change_chat_ticket_status` |
| `client/src/pages/user/Contacts.jsx` | `/api/phonebook/*` |
| `client/src/pages/user/Campaigns.jsx` | `/api/broadcast/*`, `/api/phonebook/get_by_uid`, `/api/user/get_my_meta_templets` |
| `client/src/pages/user/AutomationFlows.jsx` | `/api/chat_flow/*` |
| `client/src/pages/user/ChatBot.jsx` | `/api/chatbot/*`, `/api/chat_flow/get_mine`, `/api/inbox/get_chats` |
| `client/src/pages/user/Integrations.jsx` | `/api/user/get_meta_keys`, `/api/user/update_meta`, `/api/user/generate_api_keys`, `/api/qr/*` |
| `client/src/pages/user/DeveloperApi.jsx` | `/api/user/get_me`, `/api/user/generate_api_keys`, `/api/webhooks/rules*` |
| `client/src/pages/user/Billing.jsx` | `/api/user/get_me`, `/api/admin/get_plans`, `/api/user/get_payment_details`, `/api/user/start_free_trial`, `/api/user/create_stripe_session` |
| `client/src/pages/user/AgentLogin.jsx` | `/api/agent/get_my_agents`, `/api/agent/add_agent`, `/api/user/auto_agent_login` |
| `client/src/pages/user/AgentTask.jsx` | `/api/user/get_my_agent_tasks`, `/api/agent/get_my_agents`, `/api/user/add_task_for_agent`, `/api/user/del_task_for_agent` |
| `client/src/pages/user/ChatWidget.jsx` | `/api/user/get_my_widget`, `/api/user/add_widget`, `/api/user/del_widget` |
| `client/src/pages/user/MetaTemplates.jsx` | `/api/user/get_my_meta_templets`, `/api/user/add_meta_templet`, `/api/user/return_media_url_meta`, `/api/user/del_meta_templet` |
| `client/src/pages/agent/Dashboard.jsx` | `/api/agent/get_me`, `/api/agent/get_my_assigned_chats`, `/api/agent/get_my_task`, `/api/agent/mark_task_complete`, `/api/agent/change_chat_ticket_status` |

## API Caveats

| Caveat | Impact |
| --- | --- |
| Many routes return HTTP 200 with `{ success: false }` | Client code must inspect body, not just status. |
| Some public routes mutate files/db | `/api/web/install_app`, `/api/web/update_app`, and debug QR routes need hardening before production exposure. |
| `/api/inbox/merge_chats` has no implementation | Do not depend on it. |
| `/api/web/get-all-translation-name` is declared twice | Express will match the first declaration. |
| QR routes are limited by stubbed QR helper | API surface exists but does not create real sessions with current `helper/addon/qr/index.js`. |
| Active login tokens omit explicit expiration | Consider this when designing client/session UX. |
