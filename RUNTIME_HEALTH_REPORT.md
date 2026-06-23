# Runtime Health Report

Diagnostic verification of core services, ports, migrations, and file upload systems.

## Service Diagnostics

* **PostgreSQL Service**: **healthy** (Container `b1gcrm-postgres-1` is Up and responding to query checks).
* **Application Service**: **healthy** (Container `b1gcrm-app-1` is Up on port 3010).
* **Migrations Status**: **healthy** (Migrations `000` to `009` are fully applied; schema alignment matches the database states).
* **API Health Check**: **healthy** (Endpoint `/api/health` returns `200 OK` with JSON success payload).
* **Socket.IO Handshakes**: **healthy** (Socket handshakes resolve cleanly; active connection listeners respond to dashboard dispatches).
* **File Upload Pipeline**: **healthy** (Endpoint `POST /api/user/return_media_url` is fully active and maps uploads to the mapped `client/public/media/` folder).
* **Static Media Server**: **healthy** (Static serving of `/media/*` maps correctly to the container files).

All systems are fully online and healthy.
