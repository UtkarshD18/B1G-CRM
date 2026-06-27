const router = require('express').Router();
const { query } = require('../database/dbpromise.js');
const { validateUserOrAgent, verifyPermission } = require('../middlewares/auth.js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { getIOInstance } = require('../socket.js');
const { metaChatbotInit } = require('../helper/chatbot/meta');

// GET all website integrations
router.get(
  '/get_all',
  validateUserOrAgent,
  verifyPermission('website_access'),
  async (req, res) => {
    try {
      const data = await query(
        'SELECT id, domain, verification_token, verified, tracking_code, widget_customization, lead_capture_enabled, created_at FROM website_integrations WHERE uid = ? ORDER BY created_at DESC',
        [req.decode.uid],
      );
      res.json({ success: true, data });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to retrieve website integrations' });
    }
  },
);

// POST to add a website integration
router.post('/add', validateUserOrAgent, verifyPermission('website_access'), async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) {
      return res.json({ success: false, msg: 'Domain is required' });
    }

    // Clean domain
    const cleanDomain = domain
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .split('/')[0]
      .toLowerCase();

    // Check duplication
    const duplicate = await query(
      'SELECT * FROM website_integrations WHERE uid = ? AND domain = ?',
      [req.decode.uid, cleanDomain],
    );
    if (duplicate.length > 0) {
      return res.json({ success: false, msg: 'This website domain is already registered' });
    }

    const verificationToken = 'b1gcrm_verify_' + Math.random().toString(36).substring(2, 15);
    const trackingCode = `<script src="${req.protocol}://${req.get('host')}/api/website/widget/script?uid=${req.decode.uid}&domain=${cleanDomain}"></script>`;

    const result = await query(
      `INSERT INTO website_integrations (uid, domain, verification_token, verified, tracking_code, widget_customization, lead_capture_enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      [
        req.decode.uid,
        cleanDomain,
        verificationToken,
        0,
        trackingCode,
        JSON.stringify({
          primaryColor: '#1ea085',
          title: 'Chat with Us',
          greeting: 'Hi! How can we help you today?',
        }),
        1,
      ],
    );

    res.json({ success: true, msg: 'Website integration added successfully.', data: result[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: 'Failed to add website integration' });
  }
});

// POST to verify a website integration
router.post(
  '/verify',
  validateUserOrAgent,
  verifyPermission('website_access'),
  async (req, res) => {
    try {
      const { domain } = req.body;
      if (!domain) {
        return res.json({ success: false, msg: 'Domain is required' });
      }

      const cleanDomain = domain
        .replace(/^(https?:\/\/)?(www\.)?/, '')
        .split('/')[0]
        .toLowerCase();

      const entry = await query('SELECT * FROM website_integrations WHERE uid = ? AND domain = ?', [
        req.decode.uid,
        cleanDomain,
      ]);

      if (entry.length === 0) {
        return res.json({ success: false, msg: 'Integration record not found' });
      }

      const token = entry[0].verification_token;

      // SSRF mitigation check for CodeQL
      if (!/^[a-zA-Z0-9.-]+$/.test(cleanDomain)) {
        return res.json({ success: false, msg: 'Invalid domain format' });
      }

      const url = `https://${cleanDomain}`;
      const httpUrl = `http://${cleanDomain}`;

      console.log(`Verifying domain: ${url} for token: ${token}`);

      const { isSafeUrl } = require('../utils/ssrfFilter');
      if (!(await isSafeUrl(url)) || !(await isSafeUrl(httpUrl))) {
        return res.json({
          success: false,
          msg: 'Domain is invalid or resolves to a private IP space',
        });
      }

      let html = '';
      try {
        const response = await fetch(String(url), { timeout: 10000 });
        html = await response.text();
      } catch (e) {
        // Fallback to HTTP if HTTPS fails
        try {
          const responseHttp = await fetch(String(httpUrl), { timeout: 10000 });
          html = await responseHttp.text();
        } catch (err2) {
          return res.json({
            success: false,
            msg: `Unable to connect to website. Check DNS or server. Error: ${err2.message}`,
          });
        }
      }

      // Check if the html contains the verification token inside a meta tag
      // e.g. <meta name="b1gcrm-verification" content="token" />
      const regex = new RegExp(
        `<meta[^>]*name=["']b1gcrm-verification["'][^>]*content=["']${token}["']`,
        'i',
      );
      const matched = regex.test(html) || html.includes(token);

      if (matched) {
        await query('UPDATE website_integrations SET verified = 1 WHERE uid = ? AND domain = ?', [
          req.decode.uid,
          cleanDomain,
        ]);
        res.json({ success: true, msg: 'Website ownership verified successfully!' });
      } else {
        res.json({
          success: false,
          msg: 'Verification token not found on the homepage. Please place the meta tag containing your verification token.',
        });
      }
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Verification failed due to server error' });
    }
  },
);

// POST to update widget settings
router.post(
  '/update_widget',
  validateUserOrAgent,
  verifyPermission('website_access'),
  async (req, res) => {
    try {
      const { domain, widget_customization, lead_capture_enabled } = req.body;
      if (!domain) {
        return res.json({ success: false, msg: 'Domain is required' });
      }

      const cleanDomain = domain
        .replace(/^(https?:\/\/)?(www\.)?/, '')
        .split('/')[0]
        .toLowerCase();

      await query(
        `UPDATE website_integrations 
       SET widget_customization = ?, lead_capture_enabled = ? 
       WHERE uid = ? AND domain = ?`,
        [
          JSON.stringify(widget_customization),
          lead_capture_enabled ? 1 : 0,
          req.decode.uid,
          cleanDomain,
        ],
      );

      res.json({ success: true, msg: 'Widget settings saved successfully.' });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to update widget configurations' });
    }
  },
);

// PUBLIC ENDPOINTS

// GET the widget tracker script
router.get('/widget/script', async (req, res) => {
  const { uid, domain } = req.query;
  if (!uid || !domain) {
    return res.status(400).send('/* Missing uid or domain query parameter */');
  }

  // Find integration config
  const configs = await query('SELECT * FROM website_integrations WHERE uid = ? AND domain = ?', [
    uid,
    domain,
  ]);

  const customization =
    configs.length > 0 && configs[0].widget_customization
      ? JSON.parse(configs[0].widget_customization)
      : {
          primaryColor: '#1ea085',
          title: 'Chat with Us',
          greeting: 'Hi! How can we help you today?',
        };

  const leadCapture = configs.length > 0 ? configs[0].lead_capture_enabled : 1;

  res.setHeader('Content-Type', 'application/javascript');

  // Return widget launcher javascript code
  const scriptContent = `
(function() {
  const primaryColor = "${customization.primaryColor || '#1ea085'}";
  const title = "${customization.title || 'Chat with Us'}";
  const greeting = "${customization.greeting || 'Hi! How can we help you today?'}";
  const leadCaptureEnabled = ${leadCapture === 1};
  const uid = "${uid}";
  const domain = "${domain}";
  const host = "${req.protocol}://${req.get('host')}";

  let sessionId = localStorage.getItem("b1gcrm_widget_session");
  if (!sessionId) {
    sessionId = "sess_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("b1gcrm_widget_session", sessionId);
  }

  // Create style tag
  const style = document.createElement("style");
  style.innerHTML = \`
    .b1g-widget-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: \${primaryColor};
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      cursor: pointer;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }
    .b1g-widget-btn:hover {
      transform: scale(1.08);
    }
    .b1g-widget-btn svg {
      width: 28px;
      height: 28px;
      fill: #fff;
    }
    .b1g-widget-panel {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 360px;
      height: 500px;
      background: #fdfaf6;
      border: 1px solid rgba(0,0,0,0.1);
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      border-radius: 16px;
      z-index: 999999;
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .b1g-widget-header {
      background: \${primaryColor};
      padding: 16px;
      color: #fff;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .b1g-widget-header h3 {
      margin: 0;
      font-size: 16px;
    }
    .b1g-widget-header span {
      cursor: pointer;
      font-size: 20px;
    }
    .b1g-widget-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: #fbf8f3;
    }
    .b1g-msg {
      max-width: 80%;
      padding: 10px 12px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
      word-wrap: break-word;
    }
    .b1g-msg.inbound {
      align-self: flex-end;
      background: \${primaryColor};
      color: #fff;
    }
    .b1g-msg.outbound {
      align-self: flex-start;
      background: #eee;
      color: #333;
    }
    .b1g-widget-form {
      padding: 16px;
      border-top: 1px solid rgba(0,0,0,0.08);
      background: #fcfcfc;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .b1g-widget-form input, .b1g-widget-form textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }
    .b1g-widget-form input:focus, .b1g-widget-form textarea:focus {
      border-color: \${primaryColor};
    }
    .b1g-widget-form button {
      background: \${primaryColor};
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
    }
  \`;
  document.head.appendChild(style);

  // Create widget elements
  const launcher = document.createElement("div");
  launcher.className = "b1g-widget-btn";
  launcher.innerHTML = \`<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>\`;
  document.body.appendChild(launcher);

  const panel = document.createElement("div");
  panel.className = "b1g-widget-panel";
  panel.innerHTML = \`
    <div class="b1g-widget-header">
      <h3>\${title}</h3>
      <span class="close-btn">&times;</span>
    </div>
    <div class="b1g-widget-messages">
      <div class="b1g-msg outbound">\${greeting}</div>
    </div>
    <div class="b1g-widget-form" id="widget-form-container">
      \${leadCaptureEnabled && !localStorage.getItem("b1gcrm_lead_captured") ? \`
        <input type="text" id="lead-name" placeholder="Your Name" required />
        <input type="email" id="lead-email" placeholder="Your Email" required />
      \` : ''}
      <textarea id="widget-msg-text" placeholder="Type your message..." rows="2" required></textarea>
      <button id="widget-send-btn">Send</button>
    </div>
  \`;
  document.body.appendChild(panel);

  const closeBtn = panel.querySelector(".close-btn");
  closeBtn.onclick = () => panel.style.display = "none";

  launcher.onclick = () => {
    panel.style.display = panel.style.display === "flex" ? "none" : "flex";
    loadMessages();
  };

  const sendBtn = panel.querySelector("#widget-send-btn");
  sendBtn.onclick = async () => {
    const textEl = panel.querySelector("#widget-msg-text");
    const nameEl = panel.querySelector("#lead-name");
    const emailEl = panel.querySelector("#lead-email");
    const text = textEl.value.trim();

    if (!text) return;

    let payload = {
      uid,
      domain,
      sessionId,
      message: text
    };

    if (leadCaptureEnabled && !localStorage.getItem("b1gcrm_lead_captured")) {
      if (!nameEl.value.trim() || !emailEl.value.trim()) {
        alert("Name and Email are required.");
        return;
      }
      payload.name = nameEl.value.trim();
      payload.email = emailEl.value.trim();
      localStorage.setItem("b1gcrm_lead_captured", "true");
    }

    textEl.value = "";
    
    // Optimistic append
    appendMessage(text, "inbound");

    try {
      const res = await fetch(\`\${host}/api/website/widget/message\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        if (leadCaptureEnabled) {
          // Re-render form container without lead inputs
          const container = panel.querySelector("#widget-form-container");
          container.innerHTML = \`
            <textarea id="widget-msg-text" placeholder="Type your message..." rows="2" required></textarea>
            <button id="widget-send-btn">Send</button>
          \`;
          // Re-bind click
          panel.querySelector("#widget-send-btn").onclick = sendBtn.onclick;
        }
        loadMessages();
      }
    } catch(e) {
      console.error(e);
    }
  };

  function appendMessage(txt, direction) {
    const list = panel.querySelector(".b1g-widget-messages");
    const bubble = document.createElement("div");
    bubble.className = \`b1g-msg \${direction}\`;
    bubble.innerText = txt;
    list.appendChild(bubble);
    list.scrollTop = list.scrollHeight;
  }

  async function loadMessages() {
    try {
      const res = await fetch(\`\${host}/api/website/widget/history?uid=\${uid}&sessionId=\${sessionId}\`);
      const payload = await res.json();
      if (payload.success && Array.isArray(payload.data)) {
        const list = panel.querySelector(".b1g-widget-messages");
        list.innerHTML = \`<div class="b1g-msg outbound">\${greeting}</div>\`;
        payload.data.forEach(msg => {
          appendMessage(msg.msgContext?.text?.body || msg.msgContext?.body || "", msg.route === "INCOMING" ? "outbound" : "inbound");
        });
      }
    } catch(e) {}
  }
})();
  `;
  res.send(scriptContent);
});

// GET conversation history for a guest session
router.get('/widget/history', async (req, res) => {
  try {
    const { uid, sessionId } = req.query;
    if (!uid || !sessionId) {
      return res.json({ success: false, msg: 'Missing query params' });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(uid) || !/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
      return res.status(400).json({ success: false, msg: 'Invalid parameters' });
    }

    const chatId = `widget_${sessionId}`;
    const { validatePath } = require('../utils/pathSafe');
    const rootInboxDir = path.resolve(__dirname, '../conversations/inbox');
    const filePath = validatePath(rootInboxDir, `${uid}/${chatId}.json`);
    if (!filePath) {
      return res.status(400).json({ success: false, msg: 'Invalid parameters' });
    }

    if (!fs.existsSync(filePath)) {
      return res.json({ success: true, data: [] });
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, msg: err.message });
  }
});

// POST an incoming message from the widget
router.post('/widget/message', async (req, res) => {
  try {
    const { uid, domain, sessionId, message, name, email } = req.body;
    if (!uid || !sessionId || !message) {
      return res.json({ success: false, msg: 'Missing required fields' });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(uid) || !/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
      return res.status(400).json({ success: false, msg: 'Invalid parameters' });
    }

    const chatId = `widget_${sessionId}`;
    const senderName = name || email || 'Website Visitor';
    const senderMobile = `widget_${sessionId}`;

    // 1. Check if chat exists, otherwise create
    const checkChat = await query('SELECT * FROM chats WHERE chat_id = ? AND uid = ?', [
      chatId,
      uid,
    ]);

    const msgObj = {
      type: 'text',
      metaChatId: 'widget_msg_' + Date.now(),
      msgContext: { type: 'text', text: { body: message } },
      timestamp: Math.floor(Date.now() / 1000),
      senderName,
      senderMobile,
      status: 'received',
      star: false,
      route: 'INCOMING',
      origin: 'website',
    };

    if (checkChat.length === 0) {
      await query(
        `INSERT INTO chats (chat_id, uid, last_message_came, sender_name, sender_mobile, last_message, is_opened, chat_status, origin, other)
         VALUES (?, ?, ?, ?, ?, ?, 0, 'open', 'website', ?)`,
        [
          chatId,
          uid,
          Date.now(),
          senderName,
          senderMobile,
          JSON.stringify(msgObj),
          JSON.stringify({ email, domain }),
        ],
      );

      // Save lead to CRM Lead Pipeline automatically as "Lead" stage
      await query(
        `INSERT INTO crm_leads (uid, name, mobile, stage, notes, value) 
         VALUES (?, ?, ?, 'Lead', ?, 0.0)`,
        [
          uid,
          senderName,
          senderMobile,
          `Acquired from website widget on ${domain}. Email: ${email || 'N/A'}`,
        ],
      );

      // Get or create website widget phonebook
      const pbName = 'Website Widget Leads';
      let pbId;
      const existingPb = await query(`SELECT * FROM phonebook WHERE uid = ? AND name = ?`, [
        uid,
        pbName,
      ]);
      if (existingPb.length > 0) {
        pbId = existingPb[0].id;
      } else {
        const insertPb = await query(
          `INSERT INTO phonebook (uid, name) VALUES (?, ?) RETURNING id`,
          [uid, pbName],
        );
        if (insertPb && insertPb.length > 0) {
          pbId = insertPb[0].id;
        } else {
          const getPb = await query(`SELECT id FROM phonebook WHERE uid = ? AND name = ?`, [
            uid,
            pbName,
          ]);
          pbId = getPb[0]?.id;
        }
      }

      // Check if contact already exists
      const checkContact = await query(`SELECT * FROM contact WHERE uid = ? AND mobile = ?`, [
        uid,
        senderMobile,
      ]);
      if (checkContact.length === 0) {
        await query(
          `INSERT INTO contact (uid, phonebook_id, phonebook_name, name, mobile, var1) VALUES (?, ?, ?, ?, ?, ?)`,
          [uid, pbId, pbName, senderName, senderMobile, email || 'Website Widget'],
        );
      }
    } else {
      await query(
        `UPDATE chats 
         SET last_message_came = ?, last_message = ?, is_opened = 0, chat_status = 'open' 
         WHERE chat_id = ? AND uid = ?`,
        [Date.now(), JSON.stringify(msgObj), chatId, uid],
      );
    }

    // Save message file
    const { validatePath } = require('../utils/pathSafe');
    const rootInboxDir = path.resolve(__dirname, '../conversations/inbox');
    const dir = validatePath(rootInboxDir, uid);
    if (!dir) {
      return;
    }
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = validatePath(rootInboxDir, `${uid}/${chatId}.json`);
    if (!filePath) {
      return;
    }
    let convo = [];
    if (fs.existsSync(filePath)) {
      convo = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    convo.push(msgObj);
    fs.writeFileSync(filePath, JSON.stringify(convo, null, 2));

    // Notify user operator inbox via Socket.io
    const io = getIOInstance();
    const sock = await query('SELECT * FROM rooms WHERE uid = ?', [uid]);
    if (sock.length > 0) {
      // Reload lists
      const chatData = await query('SELECT * FROM chats WHERE uid = ?', [uid]);
      io.to(sock[0].socket_id).emit('update_chat_list', chatData);

      // Emit connection updates
      io.to(sock[0].socket_id).emit('on_open_chat', {
        chatinfo: {
          chat_id: chatId,
          sender_name: senderName,
          sender_mobile: senderMobile,
          origin: 'website',
        },
        conversation: convo,
      });
    }

    // Trigger AI Chatbot Autopilot if applicable
    const latestConversation = {
      newMessage: { senderMobile, senderName, msgContext: { text: { body: message } } },
    };
    await metaChatbotInit({ latestConversation, uid, origin: 'website' });

    res.json({ success: true, msg: 'Message processed' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: err.message });
  }
});

module.exports = router;
