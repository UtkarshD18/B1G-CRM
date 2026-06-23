# AGENT_PERMISSION_AUDIT.md

This audit verifies backend, WebSocket, and frontend-level enforcement of the new B1GCRM Agent Permission System.

---

## 1. Verification Matrix

| Scope / Vector | Target Endpoint / Event | Method / Payload | Enforcement Status | Behavior on Deny |
|---|---|---|---|---|
| **Direct Route Bypass** | `/agent/contacts` | HTTP GET / Route | **VERIFIED** | Dynamically hidden from Sidebar; API rejects fetches. |
| **API Permission Check** | `/api/phonebook/get_by_uid` | HTTP GET | **VERIFIED** | Rejects with `403 Forbidden` (`Permission denied. Required: contacts_access`). |
| **Socket Connection** | `get_chat` | Socket.io Emit | **VERIFIED** | Rejects payload with permission error. |
| **Unauthorized Socket Event** | `delete_chat` | Socket.io Emit | **VERIFIED** | Blocked explicitly with error payload (`Agents cannot delete chats`). |
| **Tamper Chat Note** | `save_chat_note` | Socket.io Emit | **VERIFIED** | Blocked with warning to use REST endpoint. |
| **Tamper Chat Note (REST)** | `/api/agent/save_note` | HTTP POST | **VERIFIED** | Scoped to assigned chats; rejects unassigned chats. |
| **Complete Task Hijack** | `/api/agent/mark_task_complete` | HTTP POST | **VERIFIED** | Restricted to task ID owned by agent; rejects other agents' tasks. |
| **Ticket Status Change** | `/api/agent/change_chat_ticket_status`| HTTP POST | **VERIFIED** | Restricted to assigned chat ID; rejects unassigned chats. |

---

## 2. Test Execution Details

1.  **Backend Auth & Transaction Safety Verification**:
    *   Result: **PASSED** (Ran via `verify-backend-auth.js` verifying unauthenticated blocks, malformed tokens, role mismatches, and rollback safety).
2.  **API Authorization**:
    *   Verified that agent tokens without permission properties block access on contacts, flows, chatbot, websites, and settings routes.
3.  **Socket.io Security Hardening**:
    *   Verified that `delete_chat`, `add_label`, `on_label_delete`, and `set_chat_label` events reject connection payloads where `agent = true`.
