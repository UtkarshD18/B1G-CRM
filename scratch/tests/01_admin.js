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
    
    // Test 1: admin_login.webm (includes Dashboard UI check)
    let page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    let recorder = new PuppeteerScreenRecorder(page);
    let videoPath = path.join(artifactsCtx.VIDEOS_DIR, 'admin_login.webm');
    await recorder.start(videoPath);
    
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle2' });
    await fillReactInput(page, 'input[type="email"]', 'admin@admin.com');
    await fillReactInput(page, 'input[type="password"]', 'Admin@123');
    await page.evaluate(() => { const b = document.querySelector('button[type="submit"]'); if(b) b.click(); });
    
    let loaded = false;
    try {
        await page.waitForSelector('h1', { timeout: 5000 });
        await new Promise(r => setTimeout(r, 2000));
        loaded = await page.evaluate(() => document.body.innerText.includes('Dashboard') || document.body.innerText.includes('Users') || document.body.innerText.includes('Instances'));
    } catch(e) {}
    
    const dashScreenshot = path.join(artifactsCtx.SCREENSHOTS_DIR, 'admin_dashboard.png');
    await page.screenshot({ path: dashScreenshot });
    
    await recorder.stop();
    
    results.push({
        section: 'Admin Portal Certification (Login)',
        status: loaded ? 'PASS' : 'FAIL',
        details: loaded ? 'Admin dashboard loaded successfully.' : 'Failed to load admin dashboard.',
        dbState: 'Checked via Login API essentially',
        screenshot: dashScreenshot,
        video: videoPath
    });

    // We can do admin_users and admin_plans right here using the same page
    // Test 2: admin_users.webm
    recorder = new PuppeteerScreenRecorder(page);
    videoPath = path.join(artifactsCtx.VIDEOS_DIR, 'admin_users.webm');
    await recorder.start(videoPath);

    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    const usersScreenshot = path.join(artifactsCtx.SCREENSHOTS_DIR, 'admin_users.png');
    await page.screenshot({ path: usersScreenshot });
    const usersLoaded = await page.evaluate(() => document.body.innerText.includes('Email') && document.body.innerText.includes('Role'));

    await recorder.stop();
    results.push({
        section: 'Admin Portal Certification (Users)',
        status: usersLoaded ? 'PASS' : 'FAIL',
        details: usersLoaded ? 'Users list loaded successfully.' : 'Failed to load users list.',
        dbState: 'N/A',
        screenshot: usersScreenshot,
        video: videoPath
    });

    // Test 3: admin_plans.webm
    recorder = new PuppeteerScreenRecorder(page);
    videoPath = path.join(artifactsCtx.VIDEOS_DIR, 'admin_plans.webm');
    await recorder.start(videoPath);

    await page.goto(`${BASE_URL}/admin/plans`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    const plansScreenshot = path.join(artifactsCtx.SCREENSHOTS_DIR, 'admin_plans.png');
    await page.screenshot({ path: plansScreenshot });
    const plansLoaded = await page.evaluate(() => document.body.innerText.includes('Plan Name') || document.body.innerText.includes('Add Plan'));

    await recorder.stop();
    await page.close();

    results.push({
        section: 'Admin Portal Certification (Plans)',
        status: plansLoaded ? 'PASS' : 'FAIL',
        details: plansLoaded ? 'Plans list loaded successfully.' : 'Failed to load plans list.',
        dbState: 'N/A',
        screenshot: plansScreenshot,
        video: videoPath
    });

    return results;
};
