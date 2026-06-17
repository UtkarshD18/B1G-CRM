# Docker Database Connection Root Cause Analysis

## 1. Component Connection Variables & Values

All database operations (migrations, runtime database connections, and the database query adapter) resolve their database configurations through a single unified entry point: [database/config.js](file:///home/shadow/projects/B1GCRM/database/config.js), which consumes configuration values from [env.js](file:///home/shadow/projects/B1GCRM/env.js).

The environment variables utilized and their current runtime values are:

| Component | Variable Used | Current Value | Source of Value |
| --- | --- | --- | --- |
| **Migrations** (`database/migrate.js`) | `DATABASE_URL` (primary)<br>`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` (fallback) | `DATABASE_URL` = `""` *(evaluates as falsy)*<br>`PGHOST` = `"postgres"`<br>`PGPORT` = `5432`<br>`PGUSER` = `"b1gcrm"`<br>`PGPASSWORD` = `"b1gcrm_local_dev"`<br>`PGDATABASE` = `"b1gcrm"` | `docker-compose.yml` (environment block) overrides `.env` values |
| **Runtime DB Connection** (`server.js`) | `DATABASE_URL` (primary)<br>`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` (fallback) | Same as above | Same as above |
| **Query Adapter** (`database/dbpromise.js`) | `DATABASE_URL` (primary)<br>`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` (fallback) | Same as above | Same as above |

---

## 2. Root Cause Analysis

The error `getaddrinfo EAI_AGAIN postgres` indicates a temporary failure in DNS name resolution inside the application container. The root causes were:

1. **Stale/Orphan Containers and Virtual Network State:**
   Stale container states and orphan runs (`b1gcrm-app-run-*`) were present from previous command runs. When the application container restarted in a loop, it was unable to communicate with Docker's embedded DNS server (`127.0.0.11`) or resolve the service hostname `postgres` because the underlying virtual bridge network `b1gcrm_default` had outdated endpoint mappings.
2. **Docker DNS Cache Desynchronization:**
   During container crash loops, the internal DNS daemon failed to bind or resolve the alias `postgres` correctly to its IP address `172.19.0.2` for the restarting container, resulting in Node's resolver returning `EAI_AGAIN`.

### The Solution:
Running `docker compose down --remove-orphans` forcefully tore down the old virtual bridge network and stopped all stale running containers. Running `docker compose up -d` created a clean bridge network and registered both services correctly with Docker's internal DNS daemon.

---

## 3. Verification Evidence

### Container Status
Both services are running and healthy:
```bash
$ docker compose ps
NAME                IMAGE                COMMAND                  SERVICE    CREATED          STATUS                    PORTS
b1gcrm-app-1        b1gcrm-app           "docker-entrypoint.s..."   app        25 seconds ago   Up 14 seconds (healthy)   0.0.0.0:3010->3010/tcp, [::]:3010->3010/tcp
b1gcrm-postgres-1   postgres:16-alpine   "docker-entrypoint.s..."   postgres   26 seconds ago   Up 25 seconds (healthy)   0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp
```

### Application Logs
The app successfully resolved and connected to the database, verified that all 10 migrations were complete, seeded the credentials, and booted the server:
```
PostgreSQL database has been connected
INFO Database migrations complete { applied: 0, total: 10 }
INFO Dev credentials seeded {
  admin: 'admin@example.com',
  user: 'user@example.com',
  agent: 'agent@example.com'
}
INFO B1G CRM server started { port: 3010, environment: 'production', version: '3.0.1' }
INFO QR handler initialized {}
INFO Campaign loop started {}
```

### API Reachability
```bash
$ curl -s http://127.0.0.1:3010/api/health
{"success":true,"msg":"Server is healthy","timestamp":"2026-06-17T01:14:26.546Z","version":"3.0.1","environment":"production"}
```
