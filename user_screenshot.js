const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // Login to User Portal
  await page.goto('http://localhost:5173/user/login');
  await page.type('input[type="email"]', 'user@example.com');
  await page.type('input[type="password"]', 'CHANGE_ME');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  
  // Dashboard
  await page.screenshot({ path: '/home/sagaragrawal/.gemini/antigravity-ide/brain/14b2a710-c81a-4e34-8250-e4bc2c70db7c/.tempmediaStorage/user_dashboard.png' });

  // Contacts
  await page.goto('http://localhost:5173/user/contacts', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: '/home/sagaragrawal/.gemini/antigravity-ide/brain/14b2a710-c81a-4e34-8250-e4bc2c70db7c/.tempmediaStorage/user_contacts.png' });

  // Campaigns
  await page.goto('http://localhost:5173/user/campaigns', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: '/home/sagaragrawal/.gemini/antigravity-ide/brain/14b2a710-c81a-4e34-8250-e4bc2c70db7c/.tempmediaStorage/user_campaigns.png' });

  // Automation Flow
  await page.goto('http://localhost:5173/user/flow', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: '/home/sagaragrawal/.gemini/antigravity-ide/brain/14b2a710-c81a-4e34-8250-e4bc2c70db7c/.tempmediaStorage/user_flow.png' });

  // Chatbots
  await page.goto('http://localhost:5173/user/chatbot', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: '/home/sagaragrawal/.gemini/antigravity-ide/brain/14b2a710-c81a-4e34-8250-e4bc2c70db7c/.tempmediaStorage/user_chatbot.png' });

  await browser.close();
})();
