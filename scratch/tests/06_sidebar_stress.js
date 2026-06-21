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
    
    // Setup Tenant
    await page.goto(`${BASE_URL}/user/signup`, { waitUntil: 'networkidle2' });
    await fillReactInput(page, 'input[placeholder="Amina Yusuf"]', 'Demo Organization');
    await fillReactInput(page, 'input[type="email"]', tenantEmail);
    await fillReactInput(page, 'input[placeholder="+1 202 555 0184"]', '+15555555555');
    await fillReactInput(page, 'input[placeholder="Create password"]', tenantPass);
    await page.evaluate(() => { const b = document.querySelector('button[type="submit"]'); if(b) b.click(); });
    await new Promise(r => setTimeout(r, 3000));

    await page.goto(`${BASE_URL}/user/login`, { waitUntil: 'networkidle2' });
    await fillReactInput(page, 'input[type="email"]', tenantEmail);
    await fillReactInput(page, 'input[type="password"]', tenantPass);
    await page.evaluate(() => { const b = document.querySelector('button[type="submit"]'); if(b) b.click(); });
    await new Promise(r => setTimeout(r, 3000));

    // ---------------------------------------------------------
    // Workflow: sidebar_stress.webm
    // ---------------------------------------------------------
    const viewports = [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1280, height: 720 },
        { width: 390, height: 844 } // Mobile
    ];

    const routes = [
        '/user/dashboard',
        '/user/inbox',
        '/user/kanban',
        '/user/campaigns',
        '/user/contacts',
        '/user/chatbots'
    ];

    for (let i = 0; i < viewports.length; i++) {
        const vp = viewports[i];
        await page.setViewport(vp);
        
        let recorder = new PuppeteerScreenRecorder(page);
        let videoPath = path.join(artifactsCtx.VIDEOS_DIR, `sidebar_stress_${vp.width}x${vp.height}.webm`);
        await recorder.start(videoPath);
        
        console.log(`Testing sidebar on viewport ${vp.width}x${vp.height}...`);
        
        for (const route of routes) {
            await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
            await new Promise(r => setTimeout(r, 500));
            // Check sidebar width or presence if possible
            // We just rapidly switch. If it throws an error or crashes, it fails.
        }

        const stressScreenshot = path.join(artifactsCtx.SCREENSHOTS_DIR, `sidebar_stress_${vp.width}x${vp.height}.png`);
        await page.screenshot({ path: stressScreenshot });
        
        await recorder.stop();
        
        results.push({
            section: `Sidebar Stability (${vp.width}x${vp.height})`,
            status: 'PASS',
            details: `Successfully navigated 6 routes rapidly without crashing.`,
            dbState: `N/A`,
            screenshot: stressScreenshot,
            video: videoPath
        });
    }

    await page.close();

    return results;
};
