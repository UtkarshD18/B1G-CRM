# B2B SaaS WhatsApp CRM

A scalable, multi-tenant B2B SaaS CRM focusing on WhatsApp Automation, Omnichannel Inbox, Chatbots, and Agent Management.

## Project Documentation
- [PROJECT_PLAN.md](./PROJECT_PLAN.md): Architecture, data flow, and team distribution strategy.
- [FEATURE_TRACKER.md](./FEATURE_TRACKER.md): Live progress tracker of all CRM modules. **(Update this actively)**

## Tech Stack
- **Backend:** Node.js, Express, MySQL, Socket.IO, WhatsApp Web/Cloud API integration.
- **Frontend:** React (Vite SPA) - *In Progress*

## Requirements
- Node.js (v18+)
- MySQL

## Getting Started

1. **Install Backend Dependencies**
   ```bash
   npm install
   ```

2. **Setup Env**
   Create a `.env` file based on your environment configurations.

3. **Start the Express Server**
   ```bash
   npm start
   ```

4. **Start the Frontend (React Vite)**
   ```bash
   cd client
   npm install
   npm run dev
   ```