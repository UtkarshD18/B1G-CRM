# Environment

Last audited: 2026-06-15

## Server Environment

Source: `env.js` and `.env.example`

| Variable | Default/fallback | Purpose |
| --- | --- | --- |
| `PORT` | `3010` | Express port. |
| `SOCKET_PORT` | `3002` | Declared but active sockets attach to same HTTP server. |
| `NODE_ENV` | `development` | Production toggles required secrets and logging behavior. |
| `DATABASE_URL`, `POSTGRES_URL` | Empty | Full PostgreSQL connection string. |
| `PGHOST`, `DBHOST` | `127.0.0.1` | PostgreSQL host. |
| `PGPORT`, `DBPORT` | `5432` | PostgreSQL port. |
| `PGUSER`, `DBUSER` | `b1gcrm` | PostgreSQL user. |
| `PGPASSWORD`, `DBPASS` | Empty | PostgreSQL password. Required by compose. |
| `PGDATABASE`, `DBNAME` | `b1gcrm` | PostgreSQL database. |
| `PGSSL` | `false` | Enables SSL with `rejectUnauthorized: false`. |
| `JWT_SECRET`, `JWTKEY` | Ephemeral dev secret | JWT signing. Required in production. |
| `JWT_EXPIRY` | `7d` | Used by utility token helpers, not active login routes. |
| `REFRESH_TOKEN_SECRET`, `JWT_REFRESH_SECRET`, `JWTKEY` | Ephemeral dev secret | Refresh token helper secret. Required in production. |
| `STRIPE_API_KEY` | Empty | Stripe API key. |
| `STRIPE_WEBHOOK_SECRET` | Empty | Stripe webhook secret. |
| `RAZORPAY_KEY_ID` | Empty | Razorpay key id. |
| `RAZORPAY_KEY_SECRET` | Empty | Razorpay secret. |
| `SMTP_HOST` | Empty | SMTP host. |
| `SMTP_PORT` | `587` | SMTP port. |
| `SMTP_USER` | Empty | SMTP user. |
| `SMTP_PASSWORD` | Empty | SMTP password. |
| `SMTP_FROM_EMAIL` | Empty | SMTP sender email. |
| `META_VERIFY_TOKEN` | Empty | Meta webhook verification token, though inbox verification currently uses tenant `uid`. |
| `META_WEBHOOK_TOKEN` | Empty | Meta webhook token. |
| `WHATSAPP_API_TOKEN` | Empty | WhatsApp token. |
| `META_APP_ID` | Empty | Meta app id. |
| `META_APP_SECRET` | Empty | Meta app secret. |
| `REDIS_URL` | `redis://localhost:6379` | Optional Redis URL. |
| `REDIS_ENABLED` | `false` | Feature flag; no active Redis usage found. |
| `AWS_ACCESS_KEY` | Empty | S3 key. |
| `AWS_SECRET_KEY` | Empty | S3 secret. |
| `AWS_S3_BUCKET` | `b1g-crm-media` | S3 bucket. |
| `AWS_REGION` | `us-east-1` | S3 region. |
| `S3_ENABLED` | `false` | Feature flag; no active S3 write path confirmed. |
| `FRONTEND_URL`, `FRONTENDURI` | `http://localhost:5173` | Public frontend URL used in media links/recovery links. |
| `BACKEND_URL`, `BACKURI` | `http://localhost:<PORT>` | Backend URL. |
| `CORS_ORIGINS` | `FRONTEND_URL` | Comma-separated CORS origins. |
| `API_BASE_URL` | `http://localhost:<PORT>/api` | API base URL. |
| `STRIPE_LANG` | `en` | Stripe language setting. |
| `MAX_FILE_SIZE` | `10485760` in `env.js`; `.env.example` shows `52428800` | Express JSON/upload size limit. |
| `UPLOAD_DIR` | `./client/public/media` | Upload directory setting. |
| `TWILIO_ACCOUNT_SID` | Empty | Optional Twilio config. |
| `TWILIO_AUTH_TOKEN` | Empty | Optional Twilio config. |
| `TWILIO_PHONE_NUMBER` | Empty | Optional Twilio config. |
| `RATE_LIMIT_WINDOW_MS` | `900000` | API rate limit window. |
| `RATE_LIMIT_MAX_REQUESTS` | `1000` in `env.js`; `.env.example` shows `100` | Max requests per window. |
| `LOG_LEVEL` | `info` | Custom logger level. |

## Server Feature Flags

| Variable | Default behavior |
| --- | --- |
| `ENABLE_WHATSAPP` | Enabled unless set to `false`. |
| `ENABLE_INSTAGRAM` | Enabled unless set to `false`; no complete Instagram implementation found. |
| `ENABLE_TELEGRAM` | Enabled unless set to `false`; no complete Telegram implementation found. |
| `ENABLE_PAYMENTS` | Enabled unless set to `false`. |
| `ENABLE_BROADCAST` | Enabled unless set to `false`. |
| `ENABLE_CHATBOT` | Enabled unless set to `false`. |
| `ENABLE_API_KEYS` | Enabled unless set to `false`. |

## Frontend Environment

Source: `client/.env.local.example`

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base for axios helper. Example: `http://localhost:3010/api`. Current `shared/api.js` also supports `window.__B1GCRM_API_URL__`. |
| `VITE_SOCKET_URL` | Socket server URL. |
| `VITE_ENV` | Frontend environment marker. |
| `VITE_ENABLE_WHATSAPP` | Frontend feature flag. |
| `VITE_ENABLE_INSTAGRAM` | Frontend feature flag. |
| `VITE_ENABLE_TELEGRAM` | Frontend feature flag. |
| `VITE_ENABLE_PAYMENTS` | Frontend feature flag. |
| `VITE_ENABLE_ANALYTICS` | Frontend feature flag. |
| `VITE_ENABLE_REACT_PROFILER` | Mentioned in project docs for optional profiler behavior. |

## Docker Overrides

In `docker-compose.yml`, the app service overrides:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Empty string |
| `PGHOST` | `postgres` |
| `PGPORT` | `5432` |
| `FRONTEND_URL` | Defaults to `http://localhost:3010` |
| `BACKEND_URL` | Defaults to `http://localhost:3010` |
| `CORS_ORIGINS` | Defaults to `http://localhost:3010,http://localhost:5173` |

## Required For Production

| Variable | Why |
| --- | --- |
| `PGPASSWORD` or `DATABASE_URL` | Database access. |
| `JWT_SECRET` | Required by `env.js` in production. |
| `REFRESH_TOKEN_SECRET` | Required by `env.js` in production. |
| Provider secrets as used | Meta, SMTP, payment gateways. |

## Secret Hygiene

| Rule | Reason |
| --- | --- |
| Keep sample secret values empty in `.env.example`. | Secret scanners flag realistic placeholder credentials. |
| Keep real secrets only in local `.env` or deployment secret stores. | `.env` is ignored and must not be committed. |
| Avoid password-like required-variable messages in source-controlled compose files. | Some scanners report false positives on `${VAR:?message}` patterns around password fields. |
