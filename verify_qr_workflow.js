const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const SCREENSHOT_DIR = '/home/shadow/projects/B1GCRM/docs/reference-pages/local-reality';
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
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeInputValueSetter.call(el, val);
      const ev = new Event('input', { bubbles: true });
      el.dispatchEvent(ev);
    }
  }, selector, value);
};

(async () => {
  const report = {
    steps: {},
    errors: []
  };

  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));

    // 1. User login
    console.log('1. User login...');
    await page.goto('http://localhost:3010/user/login', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qr_00_login_page.png') });

    await fillReactInput(page, 'input[type="email"]', 'user@example.com');
    await fillReactInput(page, 'input[type="password"]', 'User@123');
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]') || document.querySelector('button');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 3000));
    console.log('User dashboard loaded. Redirected to:', page.url());

    // 2. Open Integrations -> WhatsApp QR tab
    console.log('2. Opening Integrations -> WhatsApp QR...');
    await page.goto('http://localhost:3010/user/add-whatsapp-qr', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qr_01_integrations_page.png') });

    // 3. Create QR instance
    console.log('3. Creating QR instance...');
    const testInstanceId = `test-inst-${Date.now()}`;
    // Fill Title
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('form input'));
      if (inputs.length >= 2) {
        // First input is Title, second is Unique ID
        const titleEl = inputs[0];
        const nativeInputTitleSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputTitleSetter.call(titleEl, 'Test QR Instance');
        titleEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    // Fill Unique ID
    await page.evaluate((instId) => {
      const inputs = Array.from(document.querySelectorAll('form input'));
      if (inputs.length >= 2) {
        const idEl = inputs[1];
        const nativeInputIdSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputIdSetter.call(idEl, instId);
        idEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, testInstanceId);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qr_02_form_filled.png') });

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('form button')).find(b => b.textContent.includes('Create QR instance'));
      if (btn) btn.click();
    });

    console.log('Waiting for QR code generation...');
    await new Promise(r => setTimeout(r, 6000)); // wait for generation
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qr_03_instance_generating.png') });

    // Verify row in database
    const dbRow = await queryDb('SELECT * FROM instance WHERE uniqueId = $1', [testInstanceId]);
    console.log('DB instance row:', dbRow);
    report.steps.createdInDb = dbRow.length > 0;
    report.steps.dbStatus = dbRow[0]?.status;

    const tableHtml = await page.evaluate(() => {
      const tbl = document.querySelector('table');
      return tbl ? tbl.outerHTML : 'No table found';
    });
    console.log('TABLE HTML:', tableHtml);

    // Check if QR image is rendered on the UI
    const qrImageExists = await page.evaluate(() => {
      const img = document.querySelector('img[alt="Scan QR"]');
      return !!img && img.src.startsWith('data:image/png;base64');
    });

    console.log('QR Image rendered on UI:', qrImageExists);
    report.steps.qrImageRendered = qrImageExists;

    // Delete instance
    console.log('4. Deleting QR instance...');
    await page.evaluate((instId) => {
      // Find row with instance ID
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const targetRow = rows.find(r => r.textContent.includes(instId));
      if (targetRow) {
        const delBtn = targetRow.querySelector('button.subtle-danger');
        if (delBtn) delBtn.click();
      }
    }, testInstanceId);

    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qr_04_instance_deleted.png') });

    // Verify removed in database
    const dbRowAfterDelete = await queryDb('SELECT * FROM instance WHERE uniqueId = $1', [testInstanceId]);
    console.log('DB instance row after delete:', dbRowAfterDelete);
    report.steps.deletedInDb = dbRowAfterDelete.length === 0;

  } catch (err) {
    console.error('Run failed:', err.message);
    report.errors.push(err.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('\n=== WhatsApp QR Connector E2E Audit Summary ===');
  console.log(JSON.stringify(report, null, 2));
  fs.writeFileSync('/home/shadow/projects/B1GCRM/qr_workflow_report.json', JSON.stringify(report, null, 2));
})();
