# Next Implementation Priority

Prioritized roadmap of the next 10 engineering tasks to achieve feature parity with the reference CRM.

## Top 10 Ranked Implementation Tasks

### 1. Fix WhatsApp QR Syncing
* **Rationale**: Critical core feature that is currently broken due to stubbed Baileys libraries.
* **Effort**: Medium (Requires configuring a persistent WhatsApp instance session manager in `routes/qr.js`).
* **Value**: High. Unlocks full messaging loops.
* **Target files**: `routes/qr.js`, `helper/addon/qr.js`.

### 2. Inbox Quick Reply Selector
* **Rationale**: Standard feature in reference inbox.
* **Effort**: Low (Add template dropdown in composer and pull via `GET /api/user/get_my_meta_templets`).
* **Value**: High. Streamlines agent workflow.
* **Target files**: `client/src/pages/user/Inbox.jsx`.

### 3. Contact List Search Input
* **Rationale**: Vital usability fix.
* **Effort**: Low (Simple text filter on frontend array or quick query modifier).
* **Value**: High. Necessary for workspaces with hundreds of contacts.
* **Target files**: `client/src/pages/user/Contacts.jsx`.

### 4. Emoji Picker Integration
* **Rationale**: Required for messaging client parity.
* **Effort**: Low (Integrate standard lightweight emoji popover in composer).
* **Value**: Medium.
* **Target files**: `client/src/pages/user/Inbox.jsx`.

### 5. Inbox Media Thumbnails
* **Rationale**: Current UI only renders raw links for images and videos.
* **Effort**: Medium (Inspect file extensions in bubble rendering and output dynamic image/video nodes).
* **Value**: High. Critical for premium chat feel.
* **Target files**: `client/src/pages/user/Inbox.jsx`.

### 6. Stripe Webhook Signature Verification
* **Rationale**: Secure payment processing.
* **Effort**: Low (Add standard Stripe SDK constructor checks to the API route).
* **Value**: High. Prevents spoofed payment requests.
* **Target files**: `routes/user.js`.

### 7. Inbox Chat Tag Management
* **Rationale**: Agents need to classify tickets on the fly.
* **Effort**: Low (Add tag assignment buttons inside right-hand context drawer).
* **Value**: High.
* **Target files**: `client/src/pages/user/Inbox.jsx`, `routes/inbox.js`.

### 8. Contact Detail Drawer
* **Rationale**: Clicking a contact should display detail records.
* **Effort**: Medium (Slide-out drawer displaying contact variables, tag associations, and historical interaction logs).
* **Value**: Medium.
* **Target files**: `client/src/pages/user/Contacts.jsx`.

### 9. Kanban Drag-and-Drop Columns
* **Rationale**: Core interactive parity requirement.
* **Effort**: Medium (Refactor columns using drag-and-drop libs to post API state updates).
* **Value**: Medium.
* **Target files**: `client/src/pages/user/Kanban.jsx`.

### 10. Webhook Delivery Logs
* **Rationale**: Crucial for developers integrating API features.
* **Effort**: Medium (Create a SQL logging migration, insert rows on webhook triggers, and expose in developer console).
* **Value**: Medium.
* **Target files**: `routes/webhooks.js`, `client/src/pages/user/DeveloperApi.jsx`.
