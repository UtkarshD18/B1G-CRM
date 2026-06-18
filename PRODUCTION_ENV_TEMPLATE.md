# PRODUCTION_ENV_TEMPLATE.md

This document maps all environment variables used by the B1GCRM stack, structured for Local, Staging, and Production.

---

## 1. Environment Templates

### Local Development (`.env`)
```bash
# Server Configuration
PORT=3010
NODE_ENV=development

# Database Configuration (PostgreSQL Local)
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=b1gcrm
PGPASSWORD=password
PGDATABASE=b1gcrm
PGSSL=false

# Authentication Secrets
JWT_SECRET=local_jwt_secret_key_12345
JWT_EXPIRY=7d
REFRESH_TOKEN_SECRET=local_refresh_secret_key_12345

# Application URL Configurations
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3010
CORS_ORIGINS=http://localhost:5173,http://localhost:3010
API_BASE_URL=http://localhost:3010/api

# Service Integrations (Disabled locally by default)
S3_ENABLED=false
REDIS_ENABLED=false
```

### Staging Environment Setup
```bash
# Server Configuration
PORT=3010
NODE_ENV=production

# Database Configuration (RDS PostgreSQL Staging)
PGHOST=staging-db.crm.internal
PGPORT=5432
PGUSER=b1gcrm_stage
PGPASSWORD=your_staging_database_password_here
PGDATABASE=b1gcrm_staging
PGSSL=true

# Authentication Secrets (Generate securely)
JWT_SECRET=staging_jwt_secret_654321_abcdef
JWT_EXPIRY=7d
REFRESH_TOKEN_SECRET=staging_refresh_secret_654321_abcdef

# Application URL Configurations
FRONTEND_URL=https://staging.crm.oneoftheprojects.com
BACKEND_URL=https://staging-api.crm.oneoftheprojects.com
CORS_ORIGINS=https://staging.crm.oneoftheprojects.com
API_BASE_URL=https://staging-api.crm.oneoftheprojects.com/api

# AWS S3 Configurations (Staging bucket)
S3_ENABLED=true
AWS_ACCESS_KEY=your_aws_access_key_id_here
AWS_SECRET_KEY=your_aws_secret_access_key_here
AWS_S3_BUCKET=staging-b1g-crm-media
AWS_REGION=us-east-1

# SMTP Configuration
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=mailtrap_stage_user
SMTP_PASSWORD=your_mailtrap_staging_smtp_password_here
SMTP_FROM_EMAIL=no-reply@staging.crm.oneoftheprojects.com
```

### Production Environment Setup
```bash
# Server Configuration
PORT=3010
NODE_ENV=production

# Database Configuration (Aurora Serverless/RDS Production)
PGHOST=production-db.crm.internal
PGPORT=5432
PGUSER=b1gcrm_prod
PGPASSWORD=your_production_database_password_here
PGDATABASE=b1gcrm_production
PGSSL=true

# Authentication Secrets (Strong 256-bit hash)
JWT_SECRET=8f45a8e99b2c3d12f6c0a87a6b4a2e8c201a04e578c1abcdfe23412356cdeffa
JWT_EXPIRY=7d
REFRESH_TOKEN_SECRET=2b4a8e9c9f2c3d12f6c0a87a6b4a2e8c201a04e578c1abcdfe23412356cdeffa

# Application URL Configurations
FRONTEND_URL=https://crm.oneoftheprojects.com
BACKEND_URL=https://crm.oneoftheprojects.com
CORS_ORIGINS=https://crm.oneoftheprojects.com
API_BASE_URL=https://crm.oneoftheprojects.com/api

# AWS S3 Configurations (Production Assets)
S3_ENABLED=true
AWS_ACCESS_KEY=your_production_aws_access_key_id_here
AWS_SECRET_KEY=your_production_aws_secret_access_key_here
AWS_S3_BUCKET=prod-b1gcrm-media-bucket
AWS_REGION=us-east-1

# Stripe Keys
STRIPE_API_KEY=sk_live_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# SMTP Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_production_api_key_here
SMTP_FROM_EMAIL=alerts@crm.oneoftheprojects.com
```

---

## 2. Environment Variable Schema

| Variable Name | Required | Default / Fallback | Purpose |
| :--- | :---: | :--- | :--- |
| `PORT` | Yes | `3010` | The port the Node backend runs on. |
| `NODE_ENV` | Yes | `development` | Environment mode (`development` vs `production`). |
| `PGHOST` | Yes | `127.0.0.1` | PostgreSQL host domain name/IP. |
| `PGPORT` | Yes | `5432` | PostgreSQL connection port. |
| `PGUSER` | Yes | `b1gcrm` | PostgreSQL username. |
| `PGPASSWORD` | Yes | *None* | PostgreSQL password. |
| `PGDATABASE` | Yes | `b1gcrm` | PostgreSQL database name. |
| `PGSSL` | Yes | `false` | Enable/disable SSL for database queries. |
| `JWT_SECRET` | Yes | *None* | Key used to sign JWT session blocks. |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | Public front-end URL. |
| `BACKEND_URL` | Yes | `http://localhost:3010` | Public server URL. |
| `CORS_ORIGINS` | Yes | `BACKEND_URL` | Allowed Origins list for server CORS middleware. |
