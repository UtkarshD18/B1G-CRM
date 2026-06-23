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

    await page.goto(`${BASE_URL}/user/login`, { waitUntil: 'networkidle2' });
    await fillReactInput(page, 'input[type="email"]', tenantEmail);
    await fillReactInput(page, 'input[type="password"]', tenantPass);
    await page.evaluate(() => { const b = document.querySelector('button[type="submit"]'); if(b) b.click(); });
    await new Promise(r => setTimeout(r, 3000));

    // Seed Data
    const instanceId = `mock_inst_${Date.now()}`;
    const instanceRes = await dbClient.query(`INSERT INTO instance (uid, uniqueid, status) VALUES ($1, $2, $3) RETURNING id`, [tenantUid, instanceId, 'INIT']);
    const chatRes = await dbClient.query(`INSERT INTO chats (uid, sender_name, sender_mobile, chat_id, is_opened, chat_status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`, [tenantUid, 'Kanban Customer', '+18888888888', instanceId, 0, 'Open']);
    const chatId = chatRes.rows[0].id;

    const taskRes = await dbClient.query(`INSERT INTO agent_task (owner_uid, uid, title, status) VALUES ($1, $2, $3, $4) RETURNING id`, [tenantUid, tenantUid, 'Follow up task', 'PENDING']);
    const taskId = taskRes.rows[0].id;

    // ---------------------------------------------------------
    // Workflow: task_sync.webm
    // ---------------------------------------------------------
    let recorder = new PuppeteerScreenRecorder(page);
    let videoPath = path.join(artifactsCtx.VIDEOS_DIR, 'task_sync.webm');
    await recorder.start(videoPath);

    await page.goto(`${BASE_URL}/user/inbox`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    // Check if task exists in inbox UI
    const taskVisible = await page.evaluate(() => document.body.innerText.includes('Follow up task'));
    const taskScreenshot = path.join(artifactsCtx.SCREENSHOTS_DIR, 'task_sync.png');
    await page.screenshot({ path: taskScreenshot });

    await recorder.stop();
    results.push({
        section: 'Task Sync Certification',
        status: taskVisible ? 'PASS' : 'FAIL',
        details: taskVisible ? 'Task created via DB is visible in inbox.' : 'Task not visible.',
        dbState: `Task ID: ${taskId}`,
        screenshot: taskScreenshot,
        video: videoPath
    });

    // ---------------------------------------------------------
    // Workflow: kanban_dragdrop.webm
    // ---------------------------------------------------------
    recorder = new PuppeteerScreenRecorder(page);
    videoPath = path.join(artifactsCtx.VIDEOS_DIR, 'kanban_dragdrop.webm');
    await recorder.start(videoPath);

    await page.goto(`${BASE_URL}/user/kanban`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    // Verify no raw JSON and customer name shown
    const kanbanText = await page.evaluate(() => document.body.innerText);
    const noRawJson = !kanbanText.includes('"{') && !kanbanText.includes('}"');
    const customerVisible = kanbanText.includes('Kanban Customer');

    const kanbanScreenshot = path.join(artifactsCtx.SCREENSHOTS_DIR, 'kanban_dragdrop.png');
    await page.screenshot({ path: kanbanScreenshot });

    await recorder.stop();
    await page.close();

    results.push({
        section: 'Kanban Certification',
        status: (noRawJson && customerVisible) ? 'PASS' : 'FAIL',
        details: `No Raw JSON: ${noRawJson}, Customer Visible: ${customerVisible}`,
        dbState: `Chat Status: Open`,
        screenshot: kanbanScreenshot,
        video: videoPath
    });

    return results;
};
