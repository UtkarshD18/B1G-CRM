# B1GCRM Enterprise SaaS CRM Roadmap

This document maps out the 12-Phase Enterprise Roadmap.

---

## Completed Phases

### **Phase 1 — Enterprise Security & RBAC** [COMPLETED]
- Dynamic Tenant-scoped RBAC
- Permission resolver with caching
- Activity logs & Audit logging
- User/agent management middleware

### **Phase 2 — AI Knowledge Platform** [COMPLETED]
- pgvector RAG implementation
- Gemini embedding generation
- Knowledge Base document ingestion
- Background indexing workers
- AI Inspector & execution logs
- Explainable AI & Hybrid retrieval

### **Phase 3 — Flow Platform** [COMPLETED]
- Flow versioning & Immutable versions
- Runtime version pinning
- Drafts & Publishing workflow
- Rollback mechanisms
- Templates & Import/Export functionality

### **Phase 3.5 — Flow Intelligence** [COMPLETED]
- Semantic comparison & diff engine
- Validation engine & loop/variable checking
- Health score calculator
- Publish preview panel
- Release notes generator
- Runtime diagnostics dashboard

---

## Active & Planned Phases

### **Phase 4 — Multi-Channel Platform (Transport Layer)** [IN PROGRESS]
**Purpose:** Build the transport layer only (sending, receiving, credentials, routing).
- **Channels**: WhatsApp Cloud, WhatsApp QR, Instagram, Messenger, Email (SMTP), SMS (Twilio initially), Website Chat.
- **Features**: Generic Channel Registry, Credentials Manager, Connection Health Dashboard, Webhook infrastructure, Mock providers, Channel verification, Credential documentation.
- **Boundary Warning**: This phase must **NOT** modify the Conversation UI, Inbox, AI, Flow Builder, or CRM modules.

### **Phase 5 — Conversation Platform** [PLANNED]
**Purpose:** Central operator workspace consuming the transport layer from Phase 4.
- **Features**: Unified omnichannel timeline, Internal notes & mentions, Agent assignments, Chat tags, SLA timers, Customer profile drawer, Attachments, Conversation search, AI Answer cards with citations, Read receipts, Typing indicators, and collaboration timeline.

### **Phase 6 — CRM Core** [PLANNED]
- **Features**: Contacts, Companies, Organizations, Leads, Deals, Pipelines, Tasks, Notes, Custom fields, and Relationship management.

### **Phase 7 — Campaigns & Broadcasts** [PLANNED]
- **Features**: WhatsApp, Email, and SMS campaigns, Broadcast scheduler, Audience segmentation, Templates, A/B testing, and Drip campaigns.

### **Phase 8 — Analytics & Business Intelligence** [PLANNED]
- **Features**: Dashboards, KPI widgets, Funnel/Conversation analytics, AI analytics, Revenue reports, Agent reports, and Export tools.

### **Phase 9 — Enterprise AI Copilot** [PLANNED]
- **Features**: AI writing assistant, Suggested replies, AI summaries, AI workflow generation, CRM assistant, semantic search, and analytics copilot.

### **Phase 10 — Marketplace & Templates** [PLANNED]
- **Features**: Flow marketplace, Conversation/Campaign templates, AI prompt templates, Import/export packages, and Community sharing.

### **Phase 11 — Security, Compliance & Observability** [PLANNED]
- **Features**: SSO & MFA preparation, API keys, IP restrictions, Audit/Activity center, Secrets manager, Rate limiting, monitoring, error tracking, and backups.

### **Phase 12 — Production Hardening & Scale** [PLANNED]
- **Features**: Performance & queue optimization, Horizontal scaling, caching, Load & stress testing, Disaster recovery, and Zero-downtime deployment.
