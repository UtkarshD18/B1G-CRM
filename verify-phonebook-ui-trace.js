const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER PAGE ERROR:', err.toString()));

  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log('API REQUEST:', request.method(), request.url(), request.postData());
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      try {
        const text = await response.text();
        console.log('API RESPONSE:', response.status(), response.url(), text.substring(0, 500));
      } catch (e) {
        console.log('API RESPONSE (unable to read body):', response.status(), response.url());
      }
    }
  });

  try {
    console.log('1. Logging in...');
    await page.goto('http://localhost:3010/user/login', { waitUntil: 'networkidle2' });
    
    // React input helper
    const testPassword = process.env.TEST_USER_PASSWORD || 'CHANGE_ME';
    await page.evaluate((pass) => {
      const fillInput = (sel, val) => {
        const el = document.querySelector(sel);
        if (el) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };
      fillInput('input[type="email"]', 'user@example.com');
      fillInput('input[type="password"]', pass);
    }, testPassword);

    await page.evaluate(() => {
      document.querySelector('button[type="submit"]').click();
    });
    await new Promise(r => setTimeout(r, 3000));

    console.log('2. Navigating to Contacts...');
    await page.goto('http://localhost:3010/user/contacts', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    console.log('3. Typing phonebook name...');
    const pbName = `Audit PB ${Date.now()}`;
    await page.evaluate((val) => {
      const el = document.querySelector('form input[placeholder="Enterprise leads"]');
      if (el) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, pbName);

    console.log('4. Clicking Add Phonebook button...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add phonebook'));
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 4000));
    console.log('Done waiting.');

  } catch (err) {
    console.error('Error during trace:', err);
  } finally {
    await browser.close();
  }
})();
