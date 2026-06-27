const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // Login to Agent Portal
  await page.goto('http://localhost:5173/agent/login');
  await page.type('input[type="email"]', 'agent@example.com');
  await page.type('input[type="password"]', 'CHANGE_ME');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  
  // Dashboard
  await page.screenshot({ path: '/home/sagaragrawal/.gemini/antigravity-ide/brain/14b2a710-c81a-4e34-8250-e4bc2c70db7c/.tempmediaStorage/agent_dashboard.png' });

  // Inbox
  await page.goto('http://localhost:5173/agent/inbox', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: '/home/sagaragrawal/.gemini/antigravity-ide/brain/14b2a710-c81a-4e34-8250-e4bc2c70db7c/.tempmediaStorage/agent_inbox.png' });

  await browser.close();
})();
