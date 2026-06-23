const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/home/shadow/.gemini/antigravity-ide/brain/0b224df4-b276-4991-a0ab-e5d7dc4cd4be';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

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

const fillReactTextarea = async (page, selector, value) => {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (el) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      nativeInputValueSetter.call(el, val);
      const ev = new Event('input', { bubbles: true });
      el.dispatchEvent(ev);
    }
  }, selector, value);
};

const fillReactSelect = async (page, selector, value) => {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (el) {
      const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
      nativeSelectValueSetter.call(el, val);
      const ev = new Event('change', { bubbles: true });
      el.dispatchEvent(ev);
    }
  }, selector, value);
};

(async () => {
  console.log("Launching Puppeteer Browser...");
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. LOGIN
  console.log("1. Navigating to Login Page...");
  await page.goto('http://localhost:3010/user/login', { waitUntil: 'networkidle2' });
  await fillReactInput(page, 'input[type="email"]', 'user@example.com');
  await fillReactInput(page, 'input[type="password"]', process.env.TEST_USER_PASSWORD || 'CHANGE_ME');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's11_01_login_form.png') });
  
  console.log("Clicking submit login...");
  await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  console.log("Post-login URL:", page.url());
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's11_02_dashboard_loaded.png') });

  // 2. CONTACTS - PHONEBOOK CREATION Refresh Check
  console.log("2. Testing Phonebook immediate listing...");
  await page.goto('http://localhost:3010/user/contacts', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  
  const initialPbCount = await page.evaluate(() => document.querySelectorAll('table tbody tr').length);
  console.log("Initial phonebooks found:", initialPbCount);
  
  const testPbName = 'E2E_Test_Phonebook_' + Math.random().toString(36).substring(2, 7);
  await fillReactInput(page, 'input[placeholder="Enterprise leads"]', testPbName);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's11_03_contacts_filling.png') });
  
  await page.evaluate(() => {
    const btn = document.querySelector('form button[type="submit"]');
    if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 2000)); // wait brief moment for insertion
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's11_04_contacts_created.png') });

  const finalPbCount = await page.evaluate(() => document.querySelectorAll('table tbody tr').length);
  console.log("Post-creation phonebooks count:", finalPbCount);

  // 3. AI PROVIDERS
  console.log("3. Navigating to AI Providers Settings...");
  await page.goto('http://localhost:3010/user/ai-providers', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's11_05_ai_providers.png') });

  // 4. KNOWLEDGE BASE
  console.log("4. Navigating to Knowledge Base...");
  await page.goto('http://localhost:3010/user/knowledge-base', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  
  // Submit a site to crawl
  await fillReactInput(page, 'input[placeholder="https://example.com/about-us"]', 'https://en.wikipedia.org/wiki/Main_Page');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's11_06_kb_form.png') });
  
  console.log("Submitting crawl request...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const crawlBtn = btns.find(b => b.innerText.includes('Crawl'));
    if (crawlBtn) crawlBtn.click();
  });
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's11_07_kb_crawled.png') });

  // 5. WEBSITES MANAGER
  console.log("5. Navigating to Websites Manager...");
  await page.goto('http://localhost:3010/user/website-manager', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  
  // Add website
  await fillReactInput(page, 'input[placeholder="example.com"]', 'widgettest.com');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.innerText.includes('Register'));
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's11_08_website_added.png') });

  // 6. LEAD PIPELINE
  console.log("6. Navigating to Kanban Lead Pipeline...");
  await page.goto('http://localhost:3010/user/pipeline', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's11_09_pipeline_kanban.png') });

  // Open Create Lead form modal
  console.log("Opening Create Lead modal...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('Create Lead'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  const leadName = 'Enterprise Deal Client';
  await fillReactInput(page, 'input[placeholder="e.g. John Doe"]', leadName);
  await fillReactInput(page, 'input[placeholder="e.g. +919999912345"]', '+919999900088');
  await fillReactInput(page, 'input[type="number"]', '15000');
  await fillReactTextarea(page, 'textarea[placeholder="Summary of interest..."]', 'Wants standard multi-tenant AI routing with 10 agents.');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's11_10_pipeline_modal_filled.png') });

  console.log("Submitting lead creation...");
  await page.evaluate(() => {
    const btn = document.querySelector('form button[type="submit"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's11_11_pipeline_post_creation.png') });

  // 7. SUPERVISOR SLA DASHBOARD
  console.log("7. Navigating to Supervisor SLA Dashboard...");
  await page.goto('http://localhost:3010/user/supervisor-dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's11_12_supervisor_dashboard.png') });

  console.log("Visual Verification Complete! Closing browser.");
  await browser.close();
})();
