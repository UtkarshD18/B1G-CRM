const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ADMIN_PAGES = [
  'dashboard', 'manage-plans', 'manage-users', 'orders', 'settings'
];

const USER_PAGES = [
  'dashboard', 'inbox', 'kanban', 'contacts', 'campaigns', 
  'automation-flows', 'wa-chatbot', 'integrations', 'agent-login', 
  'agent-task', 'chat-widget', 'billing', 'api-dashboard', 'settings'
];

const AGENT_PAGES = [
  'dashboard', 'chats'
];

const SCREENSHOT_DIR = 'docs/reference-pages/local-reality';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function verifyPage(page, role, url, slug) {
  console.log(`Checking ${role} page: ${slug} (URL: ${url})...`);
  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    // Check if redirect occurred to login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      return { slug, status: 'Redirected to login', currentUrl, classification: 'Broken' };
    }

    const info = await page.evaluate(() => {
      const h2 = document.querySelector('h2')?.innerText || document.querySelector('h1')?.innerText || '';
      const text = document.body.innerText;
      const inputs = document.querySelectorAll('input').length;
      const buttons = document.querySelectorAll('button').length;
      const tables = document.querySelectorAll('table').length;
      
      const textLower = text.toLowerCase();
      const hasError = textLower.includes('error') || textLower.includes('failed') || textLower.includes('not found') || textLower.includes('404');
      const isPlaceholder = textLower.includes('placeholder') || textLower.includes('coming soon') || textLower.includes('under construction') || textLower.includes('planned');
      
      return { h2, inputs, buttons, tables, hasError, isPlaceholder, textSnippet: text.slice(0, 300) };
    });

    // Take screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, `${role}_${slug}.png`);
    await page.screenshot({ path: screenshotPath });

    let classification = 'Fully Functional';
    if (info.isPlaceholder) classification = 'Placeholder';
    else if (info.hasError) classification = 'Broken';
    else if (info.inputs === 0 && info.buttons <= 1 && info.tables === 0) classification = 'UI Only';

    return {
      slug,
      status: 'Loaded',
      title: info.h2,
      inputs: info.inputs,
      buttons: info.buttons,
      tables: info.tables,
      classification,
      textSnippet: info.textSnippet
    };
  } catch (err) {
    return { slug, status: 'Error loading', error: err.message, classification: 'Broken' };
  }
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const report = { admin: [], user: [], agent: [] };

  const fillReactInput = async (selector, value) => {
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

  // ==================== 1. ADMIN PORTAL ====================
  console.log('--- Checking Admin Portal ---');
  await page.goto('http://localhost:3010/admin/login', { waitUntil: 'networkidle2' });
  await fillReactInput('input[type="email"]', 'admin@example.com');
  await fillReactInput('input[type="password"]', '<PASSWORD>');
  await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]') || document.querySelector('button');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 4000));
  console.log('Admin URL after login:', page.url());

  for (const slug of ADMIN_PAGES) {
    const res = await verifyPage(page, 'admin', `http://localhost:3010/admin/${slug}`, slug);
    report.admin.push(res);
  }

  // ==================== 2. USER PORTAL ====================
  console.log('\n--- Checking User Portal ---');
  await page.goto('http://localhost:3010/user/login', { waitUntil: 'networkidle2' });
  await fillReactInput('input[type="email"]', 'user@example.com');
  await fillReactInput('input[type="password"]', '<PASSWORD>');
  await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]') || document.querySelector('button');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 4000));
  console.log('User URL after login:', page.url());

  for (const slug of USER_PAGES) {
    const res = await verifyPage(page, 'user', `http://localhost:3010/user/${slug}`, slug);
    report.user.push(res);
  }

  // ==================== 3. AGENT PORTAL ====================
  console.log('\n--- Checking Agent Portal ---');
  await page.goto('http://localhost:3010/agent/login', { waitUntil: 'networkidle2' });
  await fillReactInput('input[type="email"]', 'agent@example.com');
  await fillReactInput('input[type="password"]', '<PASSWORD>');
  await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]') || document.querySelector('button');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 4000));
  console.log('Agent URL after login:', page.url());

  for (const slug of AGENT_PAGES) {
    const res = await verifyPage(page, 'agent', `http://localhost:3010/agent/${slug}`, slug);
    report.agent.push(res);
  }

  await browser.close();

  // Print results
  console.log('\n--- Local Check Results ---');
  console.log(JSON.stringify(report, null, 2));

  // Write files
  fs.writeFileSync('local_check_report.json', JSON.stringify(report, null, 2));

})();
