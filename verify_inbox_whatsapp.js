const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Client } = require('pg');

const SCREENSHOT_DIR = 'docs/reference-pages/local-reality';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// Helper to query the PostgreSQL database
const queryDb = async (sql, params = []) => {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'b1gcrm',
    password: 'b1gcrm_local_dev',
    database: 'b1gcrm'
  });
  await client.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows;
  } finally {
    await client.end();
  }
};

const fillReactInput = async (page, selector, value) => {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (el) {
      const prototype = el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(prototype, "value").set;
      nativeInputValueSetter.call(el, val);
      const ev = new Event('input', { bubbles: true });
      el.dispatchEvent(ev);
    }
  }, selector, value);
};

(async () => {
  const report = {
    steps: {},
    database: {},
    errors: []
  };

  let browser;
  try {
    // 0. Create dummy media files
    console.log('0. Creating dummy media files...');
    const testImage = path.join(__dirname, 'test-image.png');
    const testDoc = path.join(__dirname, 'test-doc.pdf');
    
    // 1x1 PNG transparent pixel
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    fs.writeFileSync(testImage, Buffer.from(pngBase64, 'base64'));
    fs.writeFileSync(testDoc, '%PDF-1.4\n%EOF');
    console.log('Dummy media files created.');

    // Launch browser
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // 1. User login
    console.log('1. User login...');
    await page.goto('http://localhost:3010/user/login', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'whatsapp_00_login_page.png') });

    await fillReactInput(page, 'input[type="email"]', 'user@example.com');
    await fillReactInput(page, 'input[type="password"]', '<PASSWORD>');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'whatsapp_01_user_login_entered.png') });

    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]') || document.querySelector('button');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 3000));
    console.log('User dashboard loaded. Redirected to:', page.url());

    // 2. Open Inbox
    console.log('2. Opening User Inbox...');
    await page.goto('http://localhost:3010/user/inbox', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'whatsapp_02_inbox_loaded.png') });

    // Verify there is a chat row
    const chatRowExists = await page.evaluate(() => {
      const row = document.querySelector('.wa-chat-row');
      return !!row;
    });

    if (!chatRowExists) {
      throw new Error('No chats found in user inbox. Make sure John Doe (1234567890) is present in DB.');
    }

    // Click on the John Doe chat
    console.log('3. Selecting John Doe chat...');
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.wa-chat-row'));
      const johnDoeRow = rows.find(r => r.textContent.includes('John Doe') || r.textContent.includes('1234567890'));
      if (johnDoeRow) {
        johnDoeRow.click();
      } else if (rows[0]) {
        rows[0].click();
      }
    });

    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'whatsapp_03_chat_selected.png') });

    // 4. Send text message
    console.log('4. Sending text message...');
    await fillReactInput(page, '.wa-composer textarea', 'Test message from automated Puppeteer user script');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'whatsapp_04_text_entered.png') });

    await page.evaluate(() => {
      const form = document.querySelector('.wa-composer');
      if (form) {
        const btn = form.querySelector('button[type="submit"]') || form.querySelector('button');
        if (btn) btn.click();
      }
    });

    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'whatsapp_05_text_sent.png') });
    console.log('Text message sent.');

    // 5. Refresh page to verify persistence
    console.log('5. Refreshing page to verify text persistence...');
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));
    
    // Select chat again
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.wa-chat-row'));
      const johnDoeRow = rows.find(r => r.textContent.includes('John Doe') || r.textContent.includes('1234567890'));
      if (johnDoeRow) {
        johnDoeRow.click();
      } else if (rows[0]) {
        rows[0].click();
      }
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'whatsapp_06_text_persisted.png') });

    // Verify text exists in thread DOM
    const textFound = await page.evaluate(() => {
      const bubbles = Array.from(document.querySelectorAll('.message-bubble'));
      return bubbles.some(b => b.textContent.includes('Test message from automated Puppeteer user script'));
    });
    console.log('Text message persisted in DOM:', textFound);
    report.steps.textMessagePersisted = textFound;

    // 6. Assign agent to chat
    console.log('6. Assigning Local Agent...');
    await page.evaluate(() => {
      const select = document.querySelector('.inbox-context-panel select');
      if (select) {
        // Find option with local-agent-uid or agent@example.com
        const option = Array.from(select.options).find(o => o.value === 'local-agent-uid' || o.text.includes('agent@example.com'));
        if (option) {
          select.value = option.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'whatsapp_07_agent_selected.png') });

    await page.evaluate(() => {
      // Find button in context panel under assignment section
      const buttons = Array.from(document.querySelectorAll('.inbox-context-panel button'));
      const saveBtn = buttons.find(b => b.textContent.toLowerCase().includes('save assignment'));
      if (saveBtn) saveBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'whatsapp_08_agent_assigned.png') });

    // Check DB assignment
    const dbAssignments = await queryDb("SELECT * FROM agent_chats WHERE chat_id = 'jIuIUSDBji' AND uid = 'local-agent-uid'");
    console.log('DB assignment row:', dbAssignments);
    report.steps.agentAssignedInDb = dbAssignments.length > 0;

    // 7. Upload Image
    console.log('7. Uploading media image...');
    await page.evaluate(() => {
      const typeSelect = document.querySelector('.media-composer select');
      if (typeSelect) {
        typeSelect.value = 'image';
        typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 500));

    const fileInput = await page.$('.media-composer input[type="file"]');
    await fileInput.uploadFile(testImage);
    await fillReactInput(page, '.media-composer input[placeholder="Optional caption"]', 'Test Puppeteer Caption Image');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'whatsapp_09_image_composer_filled.png') });

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('.media-composer button')).find(b => b.textContent.includes('Send media'));
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 4000)); // wait for upload and socket trigger
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'whatsapp_10_image_sent.png') });

    // Reload and check image persistence
    console.log('Refreshing to verify image persistence...');
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.wa-chat-row'));
      const johnDoeRow = rows.find(r => r.textContent.includes('John Doe') || r.textContent.includes('1234567890'));
      johnDoeRow?.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'whatsapp_11_image_persisted.png') });

    const imgFound = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('.conversation-thread img'));
      return images.some(img => img.alt === 'Test Puppeteer Caption Image' || img.src.includes('/media/'));
    });
    console.log('Image rendered in DOM:', imgFound);
    report.steps.imagePersisted = imgFound;

    // 8. Upload PDF Document
    console.log('8. Uploading media document...');
    await page.evaluate(() => {
      const typeSelect = document.querySelector('.media-composer select');
      if (typeSelect) {
        typeSelect.value = 'document';
        typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 500));

    const fileInputDoc = await page.$('.media-composer input[type="file"]');
    await fileInputDoc.uploadFile(testDoc);
    await fillReactInput(page, '.media-composer input[placeholder="Optional caption"]', 'Test Puppeteer Caption PDF');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'whatsapp_12_doc_composer_filled.png') });

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('.media-composer button')).find(b => b.textContent.includes('Send media'));
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 4000)); // wait for upload
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'whatsapp_13_doc_sent.png') });

    // Reload and check doc persistence
    console.log('Refreshing to verify document persistence...');
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.wa-chat-row'));
      const johnDoeRow = rows.find(r => r.textContent.includes('John Doe') || r.textContent.includes('1234567890'));
      johnDoeRow?.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'whatsapp_14_doc_persisted.png') });

    const docFound = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('.conversation-thread a'));
      return links.some(a => a.textContent.includes('Download Document') && a.href.includes('/media/'));
    });
    console.log('Doc download link rendered in DOM:', docFound);
    report.steps.docPersisted = docFound;

    // 9. Agent login and verification
    console.log('9. Logging in as Agent to check assigned chat...');
    
    // Log out user
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const logoutBtn = buttons.find(b => b.textContent.toLowerCase().includes('sign out') || b.textContent.toLowerCase().includes('logout'));
      if (logoutBtn) logoutBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Agent Login
    await page.goto('http://localhost:3010/agent/login', { waitUntil: 'networkidle2' });
    await fillReactInput(page, 'input[type="email"]', 'agent@example.com');
    await fillReactInput(page, 'input[type="password"]', '<PASSWORD>');
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]') || document.querySelector('button');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'whatsapp_15_agent_dashboard.png') });

    // Check if jIuIUSDBji is listed under Assigned chats
    const chatVisibleToAgent = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('table td'));
      return cells.some(c => c.textContent.includes('jIuIUSDBji'));
    });
    console.log('Assigned chat visible to Agent in portal table:', chatVisibleToAgent);
    report.steps.agentAssignedChatVisible = chatVisibleToAgent;

    // 10. Agent reply via REST API
    console.log('10. Sending reply as Agent via REST API...');
    const agentAuthRes = await axios.post('http://localhost:3010/api/agent/login', {
      email: 'agent@example.com',
      password: '<PASSWORD>'
    });
    const agentToken = agentAuthRes.data.token;
    
    const replyRes = await axios.post('http://localhost:3010/api/agent/send_text', {
      text: 'Hello from agent@example.com via REST API!',
      toNumber: '1234567890',
      toName: 'John Doe',
      chatId: 'jIuIUSDBji'
    }, {
      headers: { Authorization: `Bearer ${agentToken}` }
    });

    console.log('Agent REST Reply Response:', replyRes.data);
    report.steps.agentReplySuccess = replyRes.data.success;

    // 11. Re-login as User and verify agent reply persistence
    console.log('11. Relogging as User to verify agent reply in inbox...');
    await page.goto('http://localhost:3010/user/login', { waitUntil: 'networkidle2' });
    await fillReactInput(page, 'input[type="email"]', 'user@example.com');
    await fillReactInput(page, 'input[type="password"]', '<PASSWORD>');
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]') || document.querySelector('button');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    await page.goto('http://localhost:3010/user/inbox', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.wa-chat-row'));
      const johnDoeRow = rows.find(r => r.textContent.includes('John Doe') || r.textContent.includes('1234567890'));
      johnDoeRow?.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'whatsapp_16_agent_reply_verified.png') });

    const replyFound = await page.evaluate(() => {
      const bubbles = Array.from(document.querySelectorAll('.message-bubble'));
      return bubbles.some(b => b.textContent.includes('Hello from agent@example.com via REST API!'));
    });
    console.log('Agent reply found in User inbox thread:', replyFound);
    report.steps.agentReplyPersisted = replyFound;

    // 12. DB row checks
    console.log('12. Querying DB details...');
    const chatRow = await queryDb("SELECT * FROM chats WHERE chat_id = 'jIuIUSDBji'");
    report.database.chatsTable = {
      found: chatRow.length > 0,
      lastMessage: chatRow[0] ? chatRow[0].last_message : null,
      lastMessageCame: chatRow[0] ? chatRow[0].last_message_came : null,
      origin: chatRow[0] ? chatRow[0].origin : null
    };

    // Clean up dummy media files
    if (fs.existsSync(testImage)) fs.unlinkSync(testImage);
    if (fs.existsSync(testDoc)) fs.unlinkSync(testDoc);

  } catch (err) {
    console.error('Run failed:', err.message);
    report.errors.push(err.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('\n=== WhatsApp Inbox Workflow E2E Audit Summary ===');
  console.log(JSON.stringify(report, null, 2));
  fs.writeFileSync('inbox_whatsapp_workflow_report.json', JSON.stringify(report, null, 2));
})();
