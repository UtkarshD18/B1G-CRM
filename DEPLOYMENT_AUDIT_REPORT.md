# Frontend & Backend Deployment Audit Report

Evaluation of deployment adaptability across Local, Staging, and Production environments without modifying source code.

## 1. Frontend Environment Adaptability

* **Vite Config**: Configured with a development proxy for `/api` and `/socket.io`. When built for production, Vite compiles static assets using the default base. The built bundle runs without proxy requirements if served from the same domain as the API (e.g. via Nginx).
* **Axios / Fetch Config**:
  - `client/src/shared/api.js` (Fetch helper) uses the `API_BASE` variable which falls back to `window.__B1GCRM_API_URL__` or relative path (`''`).
  - `client/src/utils/api.js` (Axios helper) uses `import.meta.env.VITE_API_URL` falling back to `window.__B1GCRM_API_URL__`.
  - **Verdict**: Fully adaptable without code rebuilds if `window.__B1GCRM_API_URL__` is injected dynamically at run time (e.g., in index.html during container startup), or if served from the same origin.
* **Socket.IO Config**: Falls back to `window.location.origin` if no base URL is defined. Works seamlessly in production under a single domain.
* **Upload & Media URLs**: Set relative to public folders (`/media/...`). Resolves perfectly across local and production paths.

## 2. Backend Environment Adaptability

* **CORS Configuration**: Loaded dynamically from `CORS_ORIGINS` environment variable in `env.js` and parsed into an array. Fully adaptable.
* **Email & Password Reset URLs**: Formatted using `FRONTEND_URL` from the environment. Correctly dynamically configured.
* **Webhook Callbacks & API Base**: Handled using `BACKEND_URL` and `API_BASE_URL` env inputs.
* **OAuth Redirects**: Google/Facebook OAuth setups leverage dynamic callback URIs constructed from the runtime env variables.

## 3. Environment Compatibility Analysis

| Environment | Config Strategy | Source Code Changes Required? | Notes |
| --- | --- | --- | --- |
| **Local** | `.env` file or default variables | **No** | Default fallback config is tailored for local running servers. |
| **Staging** | Environment Variables | **No** | Needs setting `FRONTEND_URL`, `BACKEND_URL`, and database parameters. |
| **Production**| Environment Variables | **No** | Needs setting secure secrets, production DB bounds, and SSL domain hosts. |

## 4. Key Deployment Issues / Warnings

1. **Vite Re-build Requirement**: If staging and production use different domain origins for frontend and backend (e.g., frontend on Netlify/Vercel and backend on AWS EC2), the frontend bundle must be built with the correct `VITE_API_URL` injected at build-time. Alternatively, the container runtime must inject `window.__B1GCRM_API_URL__` to avoid rebuilds.
2. **Same-Origin Service Layout (Recommended)**: The cleanest deployment approach is serving both frontend and backend from the same domain (e.g., `https://crm.yourcompany.com`) and routing `/api` and `/socket.io` to the backend node using Nginx or an application gateway. Under this layout, no environment configuration is needed for the frontend bundle.
