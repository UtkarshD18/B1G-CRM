const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const screenshotDir = path.join(__dirname, 'docs', 'reference-pages', 'local-reality');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

const pages = [
  { name: 'inbox', path: '/user/inbox' },
  { name: 'templates', path: '/user/templates' },
  { name: 'automation-flows', path: '/user/flows' },
  { name: 'wa-chatbot', path: '/user/wa-chatbot' },
  { name: 'campaigns', path: '/user/campaigns' },
  { name: 'contacts', path: '/user/contacts' },
  { name: 'integrations', path: '/user/integrations' },
  { name: 'settings', path: '/user/settings' },
  { name: 'billing', path: '/user/billing' },
  { name: 'api-dashboard', path: '/user/api' },
];

(async () => {
  const results = [];
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    // Collect console errors
    const consoleErrors = {};
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const url = page.url();
        if (!consoleErrors[url]) consoleErrors[url] = [];
        consoleErrors[url].push(msg.text());
      }
    });

    // Login
    console.log('Navigating to login...');
    await page.goto('http://localhost:3010/login', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
    await page.type('input[type="email"], input[name="email"]', 'user@example.com');
    await page.type('input[type="password"], input[name="password"]', '<PASSWORD>');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));
    console.log('Logged in. Current URL:', page.url());

    // Screenshot each page
    for (const pg of pages) {
      console.log(`Navigating to ${pg.name} (${pg.path})...`);
      try {
        await page.goto(`http://localhost:3010${pg.path}`, { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000)); // Let React render

        const screenshotPath = path.join(screenshotDir, `verified_${pg.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        // Grab page title and visible text summary
        const title = await page.title();
        const bodyText = await page.evaluate(() => {
          const main = document.querySelector('main') || document.querySelector('.main-content') || document.body;
          return main.innerText.substring(0, 500);
        });

        const hasContent = bodyText.trim().length > 20;
        const errors = consoleErrors[page.url()] || [];

        results.push({
          page: pg.name,
          url: page.url(),
          screenshot: screenshotPath,
          title,
          hasContent,
          bodyTextPreview: bodyText.substring(0, 200),
          consoleErrors: errors.length,
          status: hasContent ? 'RENDERED' : 'EMPTY/BROKEN'
        });

        console.log(`  ✓ ${pg.name}: ${hasContent ? 'RENDERED' : 'EMPTY/BROKEN'} (${path.basename(screenshotPath)})`);
      } catch (err) {
        console.log(`  ✗ ${pg.name}: ERROR - ${err.message}`);
        results.push({
          page: pg.name,
          url: `http://localhost:3010${pg.path}`,
          screenshot: null,
          error: err.message,
          status: 'NAVIGATION_ERROR'
        });
      }
    }
  } catch (err) {
    console.error('Fatal error:', err.message);
  } finally {
    if (browser) await browser.close();
  }

  console.log('\n=== Browser Page Verification Summary ===');
  console.log(JSON.stringify(results, null, 2));

  // Write report
  const reportPath = path.join(__dirname, 'browser_page_verification_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`Report saved to: ${reportPath}`);
})();
