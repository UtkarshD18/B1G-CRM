const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // Login
  await page.goto('http://localhost:5173/admin/login');
  await page.type('input[type="email"]', 'admin@example.com');
  await page.type('input[type="password"]', 'CHANGE_ME');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  
  // Go to Settings / Theme
  await page.goto('http://localhost:5173/admin/settings', { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: '/home/sagaragrawal/.gemini/antigravity-ide/brain/14b2a710-c81a-4e34-8250-e4bc2c70db7c/.tempmediaStorage/settings_tab.png' });

  // Translation tab
  try {
      const translationTab = await page.$x("//button[contains(text(), 'Translation')]");
      if (translationTab.length > 0) {
          await translationTab[0].click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: '/home/sagaragrawal/.gemini/antigravity-ide/brain/14b2a710-c81a-4e34-8250-e4bc2c70db7c/.tempmediaStorage/translation_tab.png' });
      }
  } catch(e) {}

  await browser.close();
})();
