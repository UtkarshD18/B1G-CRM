# Dependencies

Last audited: 2026-06-15

## Backend Package

Source: `package.json`

| Package | Role |
| --- | --- |
| `express` | HTTP API server. |
| `cors` | CORS middleware. |
| `express-fileupload` | File uploads for media/logo/imports. |
| `express-rate-limit` | Rate limiting on `/api/`. |
| `pg` | PostgreSQL driver. |
| `dotenv` | Env loading. |
| `jsonwebtoken` | JWT auth/API keys. |
| `bcrypt` | Password hashing and compare. |
| `socket.io` | Realtime server. |
| `@whiskeysockets/baileys` | WhatsApp Web/QR integration dependency, currently stubbed locally. |
| `axios`, `node-fetch` | HTTP clients for Meta/payment/external APIs. |
| `stripe` | Stripe checkout/payment verification. |
| `nodemailer` | SMTP email. |
| `csv-parser` | Contact CSV import. |
| `qrcode`, `qrcode-terminal` | QR utilities. |
| `randomstring`, `uuid` | IDs/tokens. |
| `moment`, `moment-timezone` | Date/timezone handling. |
| `mime-types` | Media MIME detection. |
| `unzipper`, `archiver` | App install/update archive handling. |
| `pino` | Imported by QR helper files; local logger uses custom class. |
| `node-cleanup` | QR cleanup hook. |
| `@adiwajshing/keyed-db` | Baileys-related dependency. |
| `nodemon` | Backend dev server. |

## Backend Scripts

| Script | Command | Notes |
| --- | --- | --- |
| `db:migrate` | `node database/migrate.js` | Applies migrations then closes pool. |
| `test` | `echo "Error: no test specified" && exit 1` | No backend tests configured. |
| `start` | `node server.js` | Production/local start. |
| `dev` | `nodemon server.js` | Development backend. |

## Frontend Package

Source: `client/package.json`

| Package | Role |
| --- | --- |
| `react`, `react-dom` | UI. |
| `react-router-dom` | SPA routing. |
| `zustand` | Optional/global state stores. |
| `axios` | Alternate API helper in `client/src/utils/api.js`. |
| `socket.io-client` | Realtime client dependency. |
| `@xyflow/react` | Automation flow canvas. |
| `react-icons` | Icons. |
| `date-fns` | Date formatting. |

## Frontend Dev Dependencies

| Package | Role |
| --- | --- |
| `vite`, `@vitejs/plugin-react` | Build/dev server. |
| `jest`, `babel-jest`, `jest-environment-jsdom` | Tests. |
| `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` | UI tests. |
| `eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals` | Linting. |
| `tailwindcss`, `@tailwindcss/forms`, `@tailwindcss/postcss`, `@tailwindcss/typography`, `postcss`, `autoprefixer` | Styling toolchain dependencies. |
| `identity-obj-proxy` | CSS module test mapping. |

## Frontend Scripts

| Script | Command |
| --- | --- |
| `start` / `dev` | `vite` |
| `build` | `vite build` |
| `lint` | `eslint .` |
| `preview` | `vite preview` |
| `test` | `jest` |
| `test:watch` | `jest --watch` |
| `test:coverage` | `jest --coverage` |

## Docker Base Images

| Image | Use |
| --- | --- |
| `node:20-bookworm-slim` | Backend deps, frontend build, runtime. |
| `postgres:16-alpine` | Compose database. |

## Dependency Caveats

| Caveat | Impact |
| --- | --- |
| Baileys dependency exists but QR helper is stubbed. | Dependency alone does not mean QR feature is functional. |
| Root backend has no real test dependencies. | Backend testing requires setup work. |
| `node-fetch` v2 style is used in CommonJS backend. | Keep import style compatible. |
| Frontend uses React 19 and Router 7. | Avoid older Router APIs without checking compatibility. |
