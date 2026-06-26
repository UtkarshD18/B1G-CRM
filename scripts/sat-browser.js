const puppeteer = require('puppeteer');

const TARGET_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://127.0.0.1:3020';
const EMAIL = 'tenant@example.com';
const PASSWORD = 'password';

async function log(msg) {
  console.log(`[BROWSER-SAT] ${msg}`);
}

async function fail(msg) {
  console.error(`[BROWSER-SAT ERROR] ${msg}`);
  process.exit(1);
}

(async () => {
  log('Starting Phase 2 & 8 Browser SAT...');
  
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  
  const errors = [];
  
  page.on('pageerror', err => {
    errors.push(`Page Error on ${page.url()}: ${err.toString()}`);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('Failed to load resource')) {
      // we ignore favicon or generic 404s for purely missing static images in seeds
      errors.push(`Console Error on ${page.url()}: ${msg.text()}`);
    }
  });

  page.on('requestfailed', request => {
    const url = request.url();
    // Ignore external trackers, google fonts, or websockets if they fail immediately in headless
    if (url.includes('google') || url.startsWith('ws://')) return;
    errors.push(`Request Failed on ${page.url()}: ${url} - ${request.failure()?.errorText}`);
  });

  try {
    // 1. Navigate to Login
    log('Navigating to Login...');
    await page.goto(`${TARGET_URL}/login`, { waitUntil: 'networkidle2' });
    
    // Type credentials
    log('Logging in...');
    await page.type('input[type="email"]', EMAIL);
    await page.type('input[type="password"]', PASSWORD);
    
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    // Check if we reached dashboard
    if (!page.url().includes('dashboard')) {
      fail('Login failed, did not reach dashboard');
    }
    
    log('Successfully logged in.');

    // 2. Define routes to test
    const routes = [
      '/dashboard',
      '/inbox',
      '/kanban',
      '/crm/contacts',
      '/crm/leads',
      '/broadcast',
      '/chatbot',
      '/knowledge-base',
      '/settings/channels',
      '/settings/users',
      '/reports'
    ];

    for (const route of routes) {
      log(`Testing route: ${route}`);
      await page.goto(`${TARGET_URL}${route}`, { waitUntil: 'networkidle2', timeout: 10000 }).catch(e => {
        errors.push(`Navigation Timeout on ${route}`);
      });
      
      // Wait a moment for React to render
      await new Promise(r => setTimeout(r, 2000));
      
      // Check for blank screen (body has no children or just an empty div)
      const content = await page.content();
      if (!content || content.includes('Application Error') || content.length < 500) {
        errors.push(`Potential blank screen or React error boundary on ${route}`);
      }
    }

    if (errors.length > 0) {
      log('Browser Validation Failed with following errors:');
      errors.forEach(e => console.error(e));
      process.exit(1);
    } else {
      log('✅ Browser Validation Passed! No crashes, no blank screens, no severe console errors.');
      process.exit(0);
    }
    
  } catch (err) {
    fail(err.message);
  } finally {
    await browser.close();
  }
})();
