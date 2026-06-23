# API Runtime Audit

Comprehensive audit of all major API endpoints across B1GCRM portals (User, Admin, Agent, Public).

## Endpoint Audit Report

### User Portal Endpoints

* **`GET /api/user/get_me`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "user": { "uid": "...", "email": "user@example.com", "role": "user", ... } }`
  - **Data Mode**: Real Database Record

* **`GET /api/user/get_dashboard_details`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "chatsCount": 0, "phonebooksCount": 0, "contactsCount": 0, "flowsCount": 0 }`
  - **Data Mode**: Real Database Aggregate Query

* **`GET /api/phonebook/get_by_uid`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "phonebooks": [...] }`
  - **Data Mode**: Real Database Query

* **`GET /api/phonebook/get_uid_contacts`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "contacts": [...] }`
  - **Data Mode**: Real Database Query

* **`GET /api/broadcast/get_broadcast`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "broadcasts": [] }`
  - **Data Mode**: Real Database Query (Empty Response when no campaigns scheduled)

* **`GET /api/chat_flow/get_mine`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "flows": [] }`
  - **Data Mode**: Real Database Query

* **`GET /api/chatbot/get_chatbot`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "bots": [] }`
  - **Data Mode**: Real Database Query

* **`GET /api/qr/get_all`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "instances": [] }`
  - **Data Mode**: Real Database Query

* **`GET /api/agent/get_my_agents`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "agents": [] }`
  - **Data Mode**: Real Database Query

* **`GET /api/user/get_my_agent_tasks`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "tasks": [] }`
  - **Data Mode**: Real Database Query

* **`GET /api/user/get_my_widget`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "widgets": [...] }`
  - **Data Mode**: Real Database Query

* **`POST /api/user/get_plan_details`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "plan": { "id": "...", "name": "...", "price": "..." } }`
  - **Data Mode**: Real Database Query

* **`GET /api/user/generate_api_keys`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "apiKey": "..." }`
  - **Data Mode**: Real Database Query

### Admin Portal Endpoints

* **`GET /api/admin/get_dashboard_for_user`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "stats": { "usersCount": 1, "plansCount": 3, "ordersCount": 0 } }`
  - **Data Mode**: Real Database Aggregate Query

* **`GET /api/admin/get_plans`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "plans": [...] }`
  - **Data Mode**: Real Database Query

* **`GET /api/admin/get_users`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "users": [...] }`
  - **Data Mode**: Real Database Query

* **`GET /api/admin/get_orders`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "orders": [] }`
  - **Data Mode**: Real Database Query (Empty Response when no orders placed)

* **`GET /api/admin/get_smtp`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "smtp": { "host": "...", "port": "...", ... } }`
  - **Data Mode**: Real Database Query

### Agent Portal Endpoints

* **Socket.IO `get_chat`**
  - **Status**: Success (Establishes ws connection)
  - **Response**: Real-time websocket data
  - **Data Mode**: Filtered Agent Rows

* **Socket.IO `on_open_chat`**
  - **Status**: Success
  - **Response**: Real-time websocket data
  - **Data Mode**: Filtered Agent Rows

### Public & Auth Endpoints

* **`GET /api/health`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "msg": "Server is healthy", "timestamp": "...", "version": "3.0.1", "environment": "production" }`
  - **Data Mode**: Hardcoded JSON Response (No DB Dependency)

* **`POST /api/user/login`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "token": "JWT_TOKEN_HERE" }`
  - **Data Mode**: Bcrypt Verification & JWT generation

* **`POST /api/admin/login`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "token": "JWT_TOKEN_HERE" }`
  - **Data Mode**: Bcrypt Verification & JWT generation

* **`POST /api/agent/login`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "token": "JWT_TOKEN_HERE" }`
  - **Data Mode**: Bcrypt Verification & JWT generation

* **`POST /api/user/signup`**
  - **Status**: Success (200 OK)
  - **Response**: `{ "success": true, "msg": "Registered successfully" }`
  - **Data Mode**: Insert user query with hash passwords
