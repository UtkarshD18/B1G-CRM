const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const path = require('path');

const BASE_URL = 'http://localhost:3010';

async function fillReactInput(page, selector, value) {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (el) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeInputValueSetter.call(el, val);
      const ev = new Event('input', { bubbles: true });
      el.dispatchEvent(ev);
    }
  }, selector, value);
}

exports.runTest = async (browser, dbClient, artifactsCtx) => {
    const results = [];
    const tenantEmail = `demo_tenant_${Date.now()}@example.com`;
    const tenantPass = 'Password@123';
    let tenantUid;
    
    let page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // First setup the user via signup API or UI
    await page.goto(`${BASE_URL}/user/signup`, { waitUntil: 'networkidle2' });
    await fillReactInput(page, 'input[placeholder="Amina Yusuf"]', 'Demo Organization');
    await fillReactInput(page, 'input[type="email"]', tenantEmail);
    await fillReactInput(page, 'input[placeholder="+1 202 555 0184"]', '+15555555555');
    await fillReactInput(page, 'input[placeholder="Create password"]', tenantPass);
    await page.evaluate(() => { const b = document.querySelector('button[type="submit"]'); if(b) b.click(); });
    await new Promise(r => setTimeout(r, 3000));

    const users = await dbClient.query('SELECT * FROM "user" WHERE email = $1', [tenantEmail]);
    tenantUid = users.rows.length > 0 ? users.rows[0].uid : null;
    if (tenantUid) {
        await dbClient.query(`UPDATE "user" SET plan = '{"contact_limit":100000,"allow_note":1,"allow_tag":1,"allow_chatbot":1,"allow_api":1}' WHERE uid = $1`, [tenantUid]);
    }

    await page.goto(`${BASE_URL}/user/login`, { waitUntil: 'networkidle2' });
    await fillReactInput(page, 'input[type="email"]', tenantEmail);
    await fillReactInput(page, 'input[type="password"]', tenantPass);
    await page.evaluate(() => { const b = document.querySelector('button[type="submit"]'); if(b) b.click(); });
    await new Promise(r => setTimeout(r, 3000));

    // Test: phonebook_crud.webm
    let recorder = new PuppeteerScreenRecorder(page);
    let videoPath = path.join(artifactsCtx.VIDEOS_DIR, 'phonebook_crud.webm');
    await recorder.start(videoPath);
    
    await page.goto(`${BASE_URL}/user/contacts`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    await fillReactInput(page, 'input[placeholder="Enterprise leads"]', 'Demo Phonebook');
    await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Add Phonebook') || b.type === 'submit'); if(b) b.click(); });
    await new Promise(r => setTimeout(r, 2000));

    // Wait for phonebook list to update
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    const pbPersisted = await page.evaluate(() => document.body.innerText.includes('Demo Phonebook'));
    
    const pbScreenshot = path.join(artifactsCtx.SCREENSHOTS_DIR, 'phonebook_crud.png');
    await page.screenshot({ path: pbScreenshot });
    
    const pbs = await dbClient.query('SELECT * FROM phonebook WHERE uid = $1 AND name = $2', [tenantUid, 'Demo Phonebook']);
    const pbId = pbs.rows.length > 0 ? pbs.rows[0].id : null;

    await recorder.stop();

    results.push({
        section: 'Phonebook CRUD Certification',
        status: (pbId && pbPersisted) ? 'PASS' : 'FAIL',
        details: pbPersisted ? 'Phonebook created and persisted.' : 'Phonebook creation failed visually.',
        dbState: pbId ? `Phonebook ID: ${pbId}` : 'Not found in DB',
        screenshot: pbScreenshot,
        video: videoPath
    });

    // Test: user_contacts_crud.webm
    recorder = new PuppeteerScreenRecorder(page);
    videoPath = path.join(artifactsCtx.VIDEOS_DIR, 'user_contacts_crud.webm');
    await recorder.start(videoPath);

    // If there is a way to add contact via UI, do it. B1GCRM contacts typically require selecting a phonebook first or importing.
    // If we can't easily click, we navigate to the phonebook specifically or use the contact button.
    await page.goto(`${BASE_URL}/user/contacts`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Try to find the "Add Contact" button
    const addedContact = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Add Contact'));
        if (btn) {
            btn.click();
            return true;
        }
        return false;
    });

    if (addedContact) {
        await new Promise(r => setTimeout(r, 1000));
        await fillReactInput(page, 'input[name="name"]', 'Demo Contact');
        await fillReactInput(page, 'input[name="phone"]', '+15551234567');
        await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Save') || b.type === 'submit'); if(b) b.click(); });
        await new Promise(r => setTimeout(r, 2000));
    }

    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    const contactPersisted = await page.evaluate(() => document.body.innerText.includes('Demo Contact') || document.body.innerText.includes('+15551234567'));
    
    const contactScreenshot = path.join(artifactsCtx.SCREENSHOTS_DIR, 'user_contacts_crud.png');
    await page.screenshot({ path: contactScreenshot });

    const contacts = await dbClient.query('SELECT * FROM contact WHERE uid = $1 AND mobile = $2', [tenantUid, '+15551234567']);
    const contactId = contacts.rows.length > 0 ? contacts.rows[0].id : null;

    await recorder.stop();
    await page.close();

    results.push({
        section: 'Contacts CRUD Certification',
        status: (contactId && contactPersisted) ? 'PASS' : (contactId ? 'PARTIAL' : 'FAIL'),
        details: contactId ? 'Contact exists in DB.' : 'Contact creation UI step failed.',
        dbState: contactId ? `Contact ID: ${contactId}` : 'Not found in DB',
        screenshot: contactScreenshot,
        video: videoPath
    });

    return results;
};
