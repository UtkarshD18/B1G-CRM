require('dotenv').config();
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

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

  // Login Admin
  console.log('Logging in Admin...');
  await page.goto('http://localhost:3010/admin/login', { waitUntil: 'networkidle2' });
  await fillReactInput('input[type="email"]', 'admin@example.com');
  await fillReactInput('input[type="password"]', process.env.TEST_ADMIN_PASSWORD || 'CHANGE_ME');
  await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]') || document.querySelector('button');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 4000));

  // Check Admin Dashboard
  await page.goto('http://localhost:3010/admin/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  let bodyText = await page.evaluate(() => document.body.innerText);
  console.log('--- Admin Dashboard Text Contains:');
  ['error', 'failed', 'not found', '404'].forEach(word => {
    if (bodyText.toLowerCase().includes(word)) {
      console.log(`  MATCHED WORD: "${word}"`);
      // Find where it matched
      const index = bodyText.toLowerCase().indexOf(word);
      console.log(`  Snippet: ...${bodyText.slice(Math.max(0, index - 50), index + 100)}...`);
    }
  });

  // Login User
  console.log('\nLogging in User...');
  await page.goto('http://localhost:3010/user/login', { waitUntil: 'networkidle2' });
  await fillReactInput('input[type="email"]', 'user@example.com');
  await fillReactInput('input[type="password"]', process.env.TEST_USER_PASSWORD || 'CHANGE_ME');
  await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]') || document.querySelector('button');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 4000));

  const checkUserPage = async (slug) => {
    await page.goto(`http://localhost:3010/user/${slug}`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    bodyText = await page.evaluate(() => document.body.innerText);
    console.log(`\n--- User ${slug} Text Contains:`);
    ['error', 'failed', 'not found', '404'].forEach(word => {
      if (bodyText.toLowerCase().includes(word)) {
        console.log(`  MATCHED WORD: "${word}"`);
        const index = bodyText.toLowerCase().indexOf(word);
        console.log(`  Snippet: ...${bodyText.slice(Math.max(0, index - 50), index + 100)}...`);
      }
    });
  };

  await checkUserPage('contacts');
  await checkUserPage('automation-flows');
  await checkUserPage('agent-login');
  await checkUserPage('agent-task');

  await browser.close();
})();
