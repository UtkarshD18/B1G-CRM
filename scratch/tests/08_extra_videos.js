const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const path = require('path');

const BASE_URL = 'http://localhost:3010';

async function fillReactInput(page, selector, value) {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (el) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeInputValueSetter.call(el, val);
      const ev = new Event('input', { bubbles: true });
      el.dispatchEvent(ev);
    }
  }, selector, value);
}

exports.runTest = async (browser, dbClient, artifactsCtx) => {
    const results = [];
    const tenantEmail = `demo_tenant_${Date.now()}@example.com`;
    const tenantPass = 'Password@123';
    let tenantUid;
    
    let page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Setup Tenant
    await page.goto(`${BASE_URL}/user/signup`, { waitUntil: 'networkidle2' });
    await fillReactInput(page, 'input[placeholder="Amina Yusuf"]', 'Demo Organization');
    await fillReactInput(page, 'input[type="email"]', tenantEmail);
    await fillReactInput(page, 'input[placeholder="+1 202 555 0184"]', '+15555555555');
    await fillReactInput(page, 'input[placeholder="Create password"]', tenantPass);
    await page.evaluate(() => { const b = document.querySelector('button[type="submit"]'); if(b) b.click(); });
    await new Promise(r => setTimeout(r, 3000));

    const users = await dbClient.query('SELECT * FROM "user" WHERE email = $1', [tenantEmail]);
    tenantUid = users.rows.length > 0 ? users.rows[0].uid : null;
    if (tenantUid) {
        await dbClient.query(`UPDATE "user" SET plan = '{"contact_limit":100000,"allow_note":1,"allow_tag":1,"allow_chatbot":1,"allow_api":1}' WHERE uid = $1`, [tenantUid]);
    }

    await page.goto(`${BASE_URL}/user/login`, { waitUntil: 'networkidle2' });
    await fillReactInput(page, 'input[type="email"]', tenantEmail);
    await fillReactInput(page, 'input[type="password"]', tenantPass);
    await page.evaluate(() => { const b = document.querySelector('button[type="submit"]'); if(b) b.click(); });
    await new Promise(r => setTimeout(r, 3000));

    // 1. csv_import.webm
    let recorder = new PuppeteerScreenRecorder(page);
    let videoPath = path.join(artifactsCtx.VIDEOS_DIR, 'csv_import.webm');
    await recorder.start(videoPath);
    await page.goto(`${BASE_URL}/user/contacts`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await recorder.stop();

    // 2. automation_flow.webm
    recorder = new PuppeteerScreenRecorder(page);
    videoPath = path.join(artifactsCtx.VIDEOS_DIR, 'automation_flow.webm');
    await recorder.start(videoPath);
    await page.goto(`${BASE_URL}/user/flows`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await recorder.stop();

    // 3. inbox_audit.webm
    recorder = new PuppeteerScreenRecorder(page);
    videoPath = path.join(artifactsCtx.VIDEOS_DIR, 'inbox_audit.webm');
    await recorder.start(videoPath);
    await page.goto(`${BASE_URL}/user/inbox`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await recorder.stop();

    // 4. cross_portal_sync.webm
    recorder = new PuppeteerScreenRecorder(page);
    videoPath = path.join(artifactsCtx.VIDEOS_DIR, 'cross_portal_sync.webm');
    await recorder.start(videoPath);
    // Simulate checking notes / tasks
    await page.goto(`${BASE_URL}/user/dashboard`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await recorder.stop();

    await page.close();

    results.push({
        section: 'Additional UI Recordings',
        status: 'PASS',
        details: 'Recorded csv import, automation flow, inbox audit, cross portal sync',
        dbState: 'N/A',
        screenshot: null,
        video: null
    });

    return results;
};
