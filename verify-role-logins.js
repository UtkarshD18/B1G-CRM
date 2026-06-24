require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = 'docs/reference-pages/local-reality';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

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

const runRoleTest = async (browser, roleName, loginUrl, email, password, dashboardSlug) => {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const logs = [];

  page.on('response', response => {
    const url = response.url();
    if (url.includes('/api/')) {
      logs.push({
        url,
        status: response.status(),
        method: response.request().method()
      });
    }
  });

  console.log(`\n=== Starting Auth Audit for ${roleName} ===`);
  
  // 1. Load login page
  console.log(`1. Navigating to login URL: ${loginUrl}`);
  await page.goto(loginUrl, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${roleName}_01_login_page.png`) });

  // 2. Perform Login
  console.log(`2. Entering credentials for ${email}`);
  await fillReactInput(page, 'input[type="email"]', email);
  await fillReactInput(page, 'input[type="password"]', password);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${roleName}_02_entered_creds.png`) });

  console.log(`3. Submitting form`);
  await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]') || document.querySelector('button');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  
  const postLoginUrl = page.url();
  console.log(`   Redirected to: ${postLoginUrl}`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${roleName}_03_dashboard.png`) });

  // Verify dashboard loaded
  let sessionPersists = false;
  if (postLoginUrl.includes(dashboardSlug)) {
    sessionPersists = true;
  }

  // 3. Refresh Page & Verify Session Persistence
  console.log(`4. Reloading page to test session persistence`);
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  const postReloadUrl = page.url();
  console.log(`   URL after reload: ${postReloadUrl}`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${roleName}_04_dashboard_refreshed.png`) });

  const persistsAfterReload = postReloadUrl.includes(dashboardSlug);
  console.log(`   Session persisted: ${persistsAfterReload}`);

  // 4. Logout
  console.log(`5. Triggering logout`);
  await page.evaluate(() => {
    // Find logout button (often has text 'Sign out' or uses tag/class)
    const buttons = Array.from(document.querySelectorAll('button, a'));
    const logoutBtn = buttons.find(b => b.textContent.toLowerCase().includes('sign out') || b.textContent.toLowerCase().includes('logout'));
    if (logoutBtn) logoutBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  const postLogoutUrl = page.url();
  console.log(`   URL after logout: ${postLogoutUrl}`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${roleName}_05_logged_out.png`) });

  const loggedOutOk = postLogoutUrl.includes('login');

  // 5. Login Again
  console.log(`6. Attempting re-authentication`);
  await page.goto(loginUrl, { waitUntil: 'networkidle2' });
  await fillReactInput(page, 'input[type="email"]', email);
  await fillReactInput(page, 'input[type="password"]', password);
  await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]') || document.querySelector('button');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  const reLoginUrl = page.url();
  console.log(`   URL after re-login: ${reLoginUrl}`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${roleName}_06_relogin.png`) });

  const reLoginOk = reLoginUrl.includes(dashboardSlug);

  await page.close();

  return {
    role: roleName,
    email,
    loginUrl,
    postLoginUrl,
    sessionPersists,
    postReloadUrl,
    persistsAfterReload,
    postLogoutUrl,
    loggedOutOk,
    reLoginUrl,
    reLoginOk,
    apiCalls: logs
  };
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const auditReport = [];

  try {
    // Audit Admin
    const adminRes = await runRoleTest(
      browser, 'Admin', 'http://localhost:3010/admin/login',
      'admin@example.com', (process.env.TEST_ADMIN_PASSWORD || 'CHANGE_ME'), '/admin/dashboard'
    );
    auditReport.push(adminRes);

    // Audit User
    const userRes = await runRoleTest(
      browser, 'User', 'http://localhost:3010/user/login',
      'user@example.com', process.env.TEST_USER_PASSWORD || 'CHANGE_ME', '/user/dashboard'
    );
    auditReport.push(userRes);

    // Audit Agent
    const agentRes = await runRoleTest(
      browser, 'Agent', 'http://localhost:3010/agent/login',
      'agent@example.com', process.env.TEST_USER_PASSWORD || 'CHANGE_ME', '/agent/dashboard'
    );
    auditReport.push(agentRes);

  } catch (err) {
    console.error('Audit failed with error:', err);
  } finally {
    await browser.close();
  }

  console.log('\n=== Auth Audit Summary ===');
  console.log(JSON.stringify(auditReport, null, 2));
  fs.writeFileSync('role_login_audit_report.json', JSON.stringify(auditReport, null, 2));
})();
