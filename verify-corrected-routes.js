const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const screenshotDir = path.join(__dirname, 'docs', 'reference-pages', 'local-reality');

// Only pages that were previously redirecting to landing
const pages = [
  { name: 'meta-templates', path: '/user/create-meta-template' },
  { name: 'automation-flows', path: '/user/automation-flows' },
  { name: 'api-dashboard', path: '/user/api-dashboard' },
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

    // Login
    console.log('Navigating to login...');
    await page.goto('http://localhost:3010/login', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
    await page.type('input[type="email"], input[name="email"]', 'user@example.com');
    await page.type('input[type="password"], input[name="password"]', 'User@123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));
    console.log('Logged in. Current URL:', page.url());

    for (const pg of pages) {
      console.log(`Navigating to ${pg.name} (${pg.path})...`);
      try {
        await page.goto(`http://localhost:3010${pg.path}`, { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));

        const screenshotPath = path.join(screenshotDir, `verified_${pg.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        const currentUrl = page.url();
        const title = await page.title();
        const bodyText = await page.evaluate(() => {
          const main = document.querySelector('main') || document.querySelector('.main-content') || document.body;
          return main.innerText.substring(0, 500);
        });

        const stayedOnPage = currentUrl.includes(pg.path.split('/').pop());
        results.push({
          page: pg.name,
          requestedUrl: `http://localhost:3010${pg.path}`,
          actualUrl: currentUrl,
          stayedOnPage,
          screenshot: screenshotPath,
          bodyTextPreview: bodyText.substring(0, 200),
          status: stayedOnPage ? 'RENDERED' : 'REDIRECTED'
        });

        console.log(`  ${stayedOnPage ? '✓' : '⚠'} ${pg.name}: ${stayedOnPage ? 'RENDERED' : 'REDIRECTED to ' + currentUrl}`);
      } catch (err) {
        console.log(`  ✗ ${pg.name}: ERROR - ${err.message}`);
        results.push({ page: pg.name, error: err.message, status: 'ERROR' });
      }
    }
  } catch (err) {
    console.error('Fatal error:', err.message);
  } finally {
    if (browser) await browser.close();
  }

  console.log('\n=== Corrected Routes Verification ===');
  console.log(JSON.stringify(results, null, 2));
})();
