# B1G CRM Setup Instructions

## Project Overview

B1G CRM is a comprehensive WhatsApp/Omnichannel CRM SaaS with three distinct portals:

- **Admin Portal**: SaaS configuration and management
- **User Portal**: Tenant workspace for CRM operations
- **Agent Portal**: Staff workspace for handling chats

## Prerequisites

- **Node.js** v18+ LTS
- **npm or yarn**
- **MySQL** v8.0+
- **Git**
- **VS Code** (recommended)

## Backend Setup

### 1. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=b1g_crm
DB_PORT=3306

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=7d

# Server
PORT=3001
NODE_ENV=development
```

### 2. Database Setup

```bash
# Create database
mysql -u root -p < database/schema.sql

# Or use MySQL CLI directly:
mysql -u root -p
mysql> source database/schema.sql;
mysql> exit;
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Backend Server

```bash
npm start
# Server runs on http://localhost:3001
# Automatically restarts on file changes (nodemon)
```

The server will:

- ✓ Initialize database connection
- ✓ Start Express API server
- ✓ Initialize Socket.IO for real-time
- ✓ Start campaign loop

## Frontend Setup

### 1. Environment Configuration

```bash
cd client
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=ws://localhost:3002
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
# Frontend runs on http://localhost:5173
```

### 4. Build for Production

```bash
npm run build
# Output in dist/ folder
```

## Testing the Application

### Access Points

- **User Portal**: http://localhost:5173/user
  - Email: `user@example.com`
  - Password: (from database)

- **Agent Portal**: http://localhost:5173/agent
  - Email: `agent@example.com`

- **Admin Portal**: http://localhost:5173/admin
  - Email: `admin@example.com`

### Sample Test Flow

1. Login to User Portal
2. Navigate to Inbox
3. Create a test contact
4. Send a test message
5. Switch to Agent Portal to see assigned chats

## API Documentation

### Health Check

```bash
curl http://localhost:3001/api/health
```

Response:

```json
{
  "success": true,
  "msg": "Server is healthy",
  "timestamp": "2026-06-06T12:00:00.000Z",
  "version": "3.0.1"
}
```

### Authentication

#### User Login

```bash
curl -X POST http://localhost:3001/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

#### Using Token

All subsequent requests:

```bash
curl http://localhost:3001/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Project Structure

```
B1G-CRM/
├── database/
│   ├── schema.sql          # Complete database schema
│   ├── config.js           # MySQL connection pool
│   └── dbpromise.js        # Promise-based query wrapper
│
├── middlewares/
│   ├── auth.js             # Authentication middleware (validateUser, validateAgent, adminValidator)
│   └── errorHandler.js     # Error handling middleware
│
├── utils/
│   ├── auth.js             # Authentication utilities (hash, token, etc.)
│   ├── logger.js           # Logging utility
│   └── api.js              # API client with interceptors
│
├── routes/                 # API route handlers
│   ├── user.js             # User portal routes
│   ├── agent.js            # Agent portal routes
│   ├── admin.js            # Admin portal routes
│   ├── inbox.js            # Inbox/chat routes
│   ├── broadcast.js        # Campaign routes
│   ├── chatFlow.js         # Flowbuilder routes
│   ├── phonebook.js        # Contact management
│   └── ... (other routes)
│
├── env.js                  # Centralized configuration
├── server.js               # Express server setup
├── socket.js               # Socket.IO real-time
├── package.json            # Backend dependencies
│
└── client/                 # React frontend
    ├── src/
    │   ├── store/
    │   │   └── index.js    # Zustand stores (auth, ui, app)
    │   ├── layouts/
    │   │   ├── AppShell.jsx    # Main app layout
    │   │   └── LoginLayout.jsx # Auth layout
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── admin/      # Admin portal pages
    │   │   ├── user/       # User portal pages
    │   │   └── agent/      # Agent portal pages
    │   ├── utils/
    │   │   └── api.js      # Axios interceptors
    │   ├── App.jsx         # Main app with routing
    │   ├── main.jsx        # React entry point
    │   └── index.css       # Tailwind CSS
    ├── public/
    │   └── index.html
    ├── package.json        # Frontend dependencies
    ├── vite.config.js      # Vite configuration
    ├── tailwind.config.js  # Tailwind CSS config
    └── postcss.config.js   # PostCSS config
```

## Common Issues & Solutions

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution**: Ensure MySQL is running and credentials are correct in `.env`

### Port Already in Use

```
Error: listen EADDRINUSE :::3001
```

**Solution**: Change PORT in `.env` or kill process: `lsof -i :3001` → `kill -9 <PID>`

### Module Not Found

```
Cannot find module 'package-name'
```

**Solution**: Run `npm install` again or check package.json

### CORS Error

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**: Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL

## Database Schema Highlights

### Core Tables

- `user` - SaaS tenants
- `agent` - Support staff
- `admin` - SaaS administrators
- `plans` - Pricing tiers
- `contacts` - CRM contacts
- `conversations` - Chat threads
- `messages` - Individual messages
- `broadcast_campaign` - Mass campaigns
- `chat_flow` - Chatbot templates
- `payment_order` - Billing records

### Key Relationships

- User has many Agents (1:N via owner_uid)
- User has many Contacts (1:N)
- Contact has many Conversations (1:N)
- Conversation has many Messages (1:N)
- Agent is assigned to Conversations (N:M via agent_chats)

## Authentication Flow

### JWT Tokens

- **Access Token**: Expires in 7 days (configurable)
- **Refresh Token**: Expires in 30 days
- Stored in localStorage

### Middleware Protection

All routes use `validateUser`, `validateAgent`, or `adminValidator` middleware:

```javascript
app.post("/api/user/profile", validateUser, (req, res) => {
  // req.user, req.decode available
});
```

## Socket.IO Events (Real-time)

### Message Events

```javascript
socket.on("message:new", (data) => {
  // New message received
});

socket.on("message:read", (data) => {
  // Message marked as read
});
```

### Presence Events

```javascript
socket.on("user:online", (uid) => {
  // User came online
});

socket.on("user:offline", (uid) => {
  // User went offline
});
```

## Frontend State Management (Zustand)

### useAuthStore

```javascript
const { user, login, logout, isAuthenticated } = useAuthStore();
```

### useUIStore

```javascript
const { sidebarOpen, toggleSidebar, darkMode, toggleTheme } = useUIStore();
```

### useAppStore

```javascript
const { conversations, setConversations } = useAppStore();
```

## File Uploads

Supported file types:

- Images: jpg, jpeg, png, gif, webp
- Files: pdf, doc, docx, xls, xlsx, zip
- Max size: 50MB (configurable)

Upload directory: `client/public/media/`

## Performance Optimization

### Frontend

- React.lazy() for code splitting
- useCallback for expensive functions
- Memoization with React.memo

### Backend

- Database connection pooling (100 connections)
- Query optimization with indexes
- Rate limiting on all `/api/` routes

### Caching

- Browser cache for static assets
- Redis for session caching (optional)

## Deployment

### Docker

```bash
docker-compose up --build
```

### Manual Deployment

```bash
# Build frontend
cd client && npm run build

# Copy build to static folder
cp -r dist/* ../server/public/

# Start production server
NODE_ENV=production PORT=3001 npm start
```

### Environment Variables (Production)

```env
NODE_ENV=production
JWT_SECRET=use-strong-random-key
DB_HOST=your-db-host
STRIPE_API_KEY=sk_live_xxx
WHATSAPP_API_TOKEN=xxx
```

## Monitoring & Logging

### Logs Location

- `/logs/error.log` - Error logs
- `/logs/info.log` - Info logs
- Console output - Development

### Health Check

```bash
curl http://localhost:3001/api/health
```

## Next Steps

### Phase 1 - Frontend Pages

1. [ ] Create all placeholder pages (user, admin, agent)
2. [ ] Implement page layouts
3. [ ] Add navigation

### Phase 2 - API Integration

1. [ ] Complete all route handlers
2. [ ] Add validation
3. [ ] Error handling

### Phase 3 - Real-time Features

1. [ ] Socket.IO integration
2. [ ] Message delivery
3. [ ] Presence tracking

### Phase 4 - Integrations

1. [ ] WhatsApp Meta API
2. [ ] Payment gateways
3. [ ] Email service

## Support & Resources

- **Documentation**: See PROJECT_PLAN.md
- **Database Schema**: See database/schema.sql
- **API Reference**: See routes/ directory
- **Frontend Guide**: See client/README.md

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/feature-name

# Merge after review
git checkout main
git merge feature/feature-name
```

---

**Last Updated**: June 6, 2026
**Version**: 1.0.0
**Team**: B1G CRM Development Team
