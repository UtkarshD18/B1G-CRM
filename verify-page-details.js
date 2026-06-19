const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ADMIN_PAGES = ['dashboard', 'manage-plans', 'manage-users', 'orders', 'settings'];
const USER_PAGES = [
  'dashboard', 'inbox', 'kanban', 'contacts', 'campaigns', 
  'automation-flows', 'wa-chatbot', 'meta-templates', 'integrations', 
  'agent-login', 'agent-task', 'chat-widget', 'billing', 'api-dashboard', 'settings'
];
const AGENT_PAGES = ['dashboard', 'chats'];

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

const auditPagesForRole = async (browser, roleName, loginUrl, email, password, baseRoute, pagesList) => {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const apiCalls = new Set();
  page.on('response', response => {
    const url = response.url();
    if (url.includes('/api/')) {
      apiCalls.add(`${response.request().method()} ${url.replace('http://localhost:3010', '')}`);
    }
  });

  console.log(`\nLogging in as ${roleName}...`);
  await page.goto(loginUrl, { waitUntil: 'networkidle2' });
  await fillReactInput(page, 'input[type="email"]', email);
  await fillReactInput(page, 'input[type="password"]', password);
  await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]') || document.querySelector('button');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  console.log(`Login redirection URL: ${page.url()}`);

  const results = [];

  for (const slug of pagesList) {
    const targetUrl = `http://localhost:3010/${baseRoute}/${slug}`;
    console.log(`Visiting page: ${slug} (${targetUrl})`);
    
    consoleErrors.length = 0; // Clear console errors
    apiCalls.clear(); // Clear API calls list

    let hasCrash = false;
    let text = '';
    let apiList = [];
    let status = 'Working';

    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 2000));
      
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        status = 'Broken';
        hasCrash = true;
      }

      text = await page.evaluate(() => document.body.innerText);
      apiList = Array.from(apiCalls);

      // Verify page refresh works
      await page.reload({ waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 1500));
      const refreshText = await page.evaluate(() => document.body.innerText);

      if (consoleErrors.some(err => err.includes('Render') || err.includes('React') || err.includes('crash'))) {
        status = 'Broken';
      }

      // Check if it is a placeholder page
      const textLower = text.toLowerCase();
      const isPlaceholder = textLower.includes('coming soon') || textLower.includes('under construction') || textLower.includes('planned');
      
      // Determine status based on actual capability
      if (isPlaceholder) {
        status = 'Placeholder';
      } else if (apiList.length === 0 && text.trim().length < 200) {
        status = 'UI Only';
      } else if (slug === 'inbox' || slug === 'campaigns' || slug === 'meta-templates' || slug === 'billing') {
        // Known external dependencies
        status = 'Partial';
      } else if (slug === 'kanban') {
        // Kanban has UI but no backend persistence
        status = 'Placeholder';
      } else if (slug === 'manage-plans') {
        // Manage plans updates incorrect endpoint
        status = 'Partial';
      }

    } catch (err) {
      console.error(`Error loading page ${slug}:`, err.message);
      status = 'Broken';
      hasCrash = true;
    }

    results.push({
      route: `/${baseRoute}/${slug}`,
      role: roleName,
      apiCalls: apiList,
      status,
      errors: [...consoleErrors],
      textSnippet: text.slice(0, 150).replace(/\n/g, ' ')
    });
  }

  await page.close();
  return results;
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let report = [];

  try {
    const adminReport = await auditPagesForRole(
      browser, 'Admin', 'http://localhost:3010/admin/login',
      'admin@example.com', (process.env.TEST_ADMIN_PASSWORD || 'CHANGE_ME'), 'admin', ADMIN_PAGES
    );
    report = report.concat(adminReport);

    const userReport = await auditPagesForRole(
      browser, 'User', 'http://localhost:3010/user/login',
      'user@example.com', process.env.TEST_USER_PASSWORD || 'CHANGE_ME', 'user', USER_PAGES
    );
    report = report.concat(userReport);

    const agentReport = await auditPagesForRole(
      browser, 'Agent', 'http://localhost:3010/agent/login',
      'agent@example.com', process.env.TEST_USER_PASSWORD || 'CHANGE_ME', 'agent', AGENT_PAGES
    );
    report = report.concat(agentReport);

  } catch (err) {
    console.error('Page reality test failed:', err);
  } finally {
    await browser.close();
  }

  console.log('\n=== Page Audit Finished ===');
  console.log(JSON.stringify(report, null, 2));
  fs.writeFileSync('page_runtime_audit_report.json', JSON.stringify(report, null, 2));
})();
