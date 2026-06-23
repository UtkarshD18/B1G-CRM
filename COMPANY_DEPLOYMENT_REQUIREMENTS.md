# COMPANY_DEPLOYMENT_REQUIREMENTS.md

This document lists the specific credentials, configuration keys, and server infrastructure required from the client for production deployment.

---

## 1. Meta (WhatsApp Business Cloud API)

To configure the live WhatsApp Business Cloud API integration, the client must provide:
*   **Meta Developer App ID**: The App ID of the Meta App configured for WhatsApp.
*   **Meta Developer App Secret**: App secret for request signatures validation.
*   **WhatsApp Business Account (WABA) ID**: Scoped ID from Meta Business Manager.
*   **Business Account ID**: The Meta Business Account ID owning the app.
*   **Phone Number ID**: Unique ID of the verified phone number inside the WhatsApp Cloud API console.
*   **Permanent Access Token**: A non-expiring System User Access Token generated via Meta Business Suite with `whatsapp_business_messaging` and `whatsapp_business_management` permissions.

---

## 2. Instagram Graph API (Direct Message Bot)

To connect the Instagram DM Bot:
*   **Instagram Business Account ID**: Scoped account ID connected to the Meta Facebook Page.
*   **App Credentials**: App ID and App Secret (shared with the Meta application) configured for Instagram Graph API.

---

## 3. Domain & DNS

For routing and secure socket communication:
*   **DNS Control Panel Access**: To map the domain or subdomains (e.g. `crm.clientdomain.com`).
*   **SSL Certificate**: SSL credentials or permission to generate Let's Encrypt certificates.

---

## 4. SMTP (Email Delivery Service)

For system alerts, password recovery, and email notifications:
*   **SMTP Host**: (e.g., `smtp.mailgun.org`, `smtp.gmail.com`).
*   **SMTP Port**: (e.g., `587` or `465`).
*   **SMTP Username**: Authenticated email or username.
*   **SMTP Password**: SMTP password or app password.

---

## 5. Artificial Intelligence (AI Copilot Engine)

For the Chatbot Matcher and AI Reply generators:
*   **AI Provider**: Preferred provider (OpenAI, Gemini, Anthropic Claude, OpenRouter, or Ollama).
*   **API Keys**: Authorized API keys for the chosen provider.

---

## 6. Hosting Infrastructure

For deployment hosting:
*   **Server Specifications**: Recommended Ubuntu 22.04 LTS VPS with 2+ vCPUs, 4GB+ RAM, and Docker installed.
*   **PostgreSQL Credentials**: Production database hostname, port, database name, username, and password.
