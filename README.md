# B2B SaaS WhatsApp CRM

A scalable, multi-tenant B2B SaaS CRM focusing on WhatsApp Automation, Omnichannel Inbox, Chatbots, and Agent Management.

## Project Documentation
- [PROJECT_PLAN.md](./PROJECT_PLAN.md): Architecture, data flow, and team distribution strategy.
- [FEATURE_TRACKER.md](./FEATURE_TRACKER.md): Live progress tracker of all CRM modules. **(Update this actively)**
- [ENGINEERING_TRACKER.md](./ENGINEERING_TRACKER.md): Engineering setup progress, repo structure, and remaining enablement work.
- [REFERENCE_APP_AUDIT.md](./REFERENCE_APP_AUDIT.md): Live-app sitemap and parity matrix against the local repo.

## Tech Stack
- **Backend:** Node.js, Express, PostgreSQL, Socket.IO, WhatsApp Web/Cloud API integration.
- **Frontend:** React (Vite SPA) - *In Progress*

## Requirements
- Node.js (v20.19+ recommended)
- PostgreSQL 16+

## Getting Started

### Docker Setup

The Docker setup is in the repository root:

- `Dockerfile` builds the production Node/Express app and Vite client.
- `docker-compose.yml` starts both the app and PostgreSQL.
- `.dockerignore` keeps local secrets out of the image build context.

```bash
cp .env.example .env
# Fill PGPASSWORD, JWT_SECRET, and REFRESH_TOKEN_SECRET in .env.
docker compose up --build
```

PostgreSQL is started by the `postgres` service in `docker-compose.yml`. On the first run it loads `database/postgres-local-schema.sql`. The app connects to that database through environment variables read by `env.js` and used by `database/config.js`.

Access points after Docker starts:

- App/API: `http://localhost:3010`
- Health check: `http://localhost:3010/api/health`
- PostgreSQL from host: `localhost:5432` with the `PGUSER`, `PGPASSWORD`, and `PGDATABASE` values from `.env`

### Manual Setup

1. **Install Backend Dependencies**
   ```bash
   npm install
   ```

2. **Setup Env**
   Create a `.env` file based on your environment configurations.

3. **Start the Express Server**
   ```bash
   npm run dev
   ```

4. **Start the Frontend (React Vite)**
   ```bash
   cd client
   npm install
   npm run dev
   ```

5. **Run Frontend Tests**
   ```bash
   cd client
   npm test
   ```

## Repository Structure

```text
.
|-- client/          React + Vite SPA for admin, user, and agent portals
|-- routes/          Express route modules for CRM features
|-- middlewares/     Role validation and request middleware
|-- database/        PostgreSQL schema and connection helpers
|-- functions/       Backend function handlers
|-- helper/          Legacy helper modules
|-- helpers/         Active helper modules for inbox, websockets, and addons
|-- loops/           Campaign and background loop logic
|-- emails/          Email return helpers
|-- languages/       Translation assets
|-- flow-json/       Flow builder node and edge storage
|-- server.js        Express application bootstrap
|-- socket.js        Socket.IO message routing
`-- websocket.js     Websocket integration entrypoint
```
