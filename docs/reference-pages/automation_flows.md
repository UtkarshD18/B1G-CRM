# Reference Page Audit — Automation Flows

- **Page Purpose:** Build and save visual chatbot automation diagrams.
- **Page Layout:** Drag-and-drop workspace canvas using React Flow, sidebar menu containing node types (Trigger, Send Message, Set Condition, Call API), and properties editor panel.
- **Navigation Structure:** User portal `/user?page=automation-flows`.
- **Tables & Lists:** Saved automation flows list (Flow Title, Active State, Date Updated, Actions).
- **Filters & Search:** Search saved flows by name.
- **Forms & Inputs:** Flow properties form, Node properties editor (Message template selection, variable mappings, API endpoint, routing keys).
- **Actions:** Add node, connect nodes, delete connection, edit node parameters, save flow JSON, load flow JSON, delete flow.
- **Workflows:** User saves flow → client serializes nodes/edges JSON → backend stores flow config on disk under `/flow-json` and triggers in memory.
- **API Expectations:**
  - `GET /api/chat_flow/get_flows`: List user flows
  - `POST /api/chat_flow/save_flow`: Persist flow nodes and edges
  - `DELETE /api/chat_flow/delete_flow`: Remove flow
