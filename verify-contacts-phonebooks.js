const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const axios = require('axios');

const SCREENSHOT_DIR = '/home/shadow/projects/B1GCRM/docs/reference-pages/local-reality';
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

const queryDb = async (sql, params = []) => {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'b1gcrm',
    password: 'b1gcrm_local_dev',
    database: 'b1gcrm'
  });
  await client.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows;
  } finally {
    await client.end();
  }
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const auditLogs = {
    phonebook: {},
    contact: {}
  };

  try {
    // 1. Login User
    console.log('Logging in as User...');
    await page.goto('http://localhost:3010/user/login', { waitUntil: 'networkidle2' });
    await fillReactInput(page, 'input[type="email"]', 'user@example.com');
    await fillReactInput(page, 'input[type="password"]', 'User@123');
    await page.evaluate(() => {
      document.querySelector('button[type="submit"]').click();
    });
    await new Promise(r => setTimeout(r, 3000));

    // 2. Navigate to Contacts Page
    console.log('Navigating to Contacts page...');
    await page.goto('http://localhost:3010/user/contacts', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'contacts_01_initial_state.png') });

    // 3. Create Phonebook
    console.log('Creating phonebook: Audit Phonebook...');
    const uniquePbName = `Audit PB ${Date.now()}`;
    await fillReactInput(page, 'form input[placeholder="Enterprise leads"]', uniquePbName);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'contacts_02_typed_phonebook.png') });
    
    await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form'));
      const pbForm = forms.find(f => f.innerText.includes('Create phonebook'));
      pbForm.querySelector('button[type="submit"]').click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'contacts_03_phonebook_created.png') });

    // Verify Phonebook in Database
    const dbPhonebooks = await queryDb('SELECT * FROM phonebook WHERE name = $1', [uniquePbName]);
    console.log('DB phonebooks match:', dbPhonebooks);
    auditLogs.phonebook.create = {
      name: uniquePbName,
      persisted: dbPhonebooks.length > 0,
      row: dbPhonebooks[0] || null
    };

    if (dbPhonebooks.length < 1) {
      throw new Error('Phonebook not found in database after create');
    }

    const pbId = dbPhonebooks[0].id;

    // 4. Create Contact
    console.log('Creating contact: Audit User...');
    // Select the newly created phonebook in the dropdown
    await page.evaluate((id) => {
      const selects = Array.from(document.querySelectorAll('select'));
      const pbSelect = selects.find(s => s.parentElement.innerText.includes('Phonebook') || s.innerText.includes('Select phonebook'));
      if (pbSelect) {
        pbSelect.value = id;
        pbSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, pbId);

    const contactName = `Audit Contact ${Date.now()}`;
    const contactMobile = `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    await fillReactInput(page, 'input[placeholder="Aarav Mehta"]', contactName);
    await fillReactInput(page, 'input[placeholder="+919999999999"]', contactMobile);
    await fillReactInput(page, 'input[placeholder="Optional var1"]', 'val1');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'contacts_04_typed_contact.png') });

    await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form'));
      const contactForm = forms.find(f => f.innerText.includes('Add single contact'));
      contactForm.querySelector('button[type="submit"]').click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'contacts_05_contact_created.png') });

    // Verify Contact in Database
    const dbContacts = await queryDb('SELECT * FROM contact WHERE name = $1', [contactName]);
    console.log('DB contacts match:', dbContacts);
    auditLogs.contact.create = {
      name: contactName,
      mobile: contactMobile,
      persisted: dbContacts.length > 0,
      row: dbContacts[0] || null
    };

    if (dbContacts.length < 1) {
      throw new Error('Contact not found in database after create');
    }

    const contactId = dbContacts[0].id;

    // 5. Test Edit Capability
    console.log('Verifying Edit Contact and Phonebook capabilities via API...');
    const loginRes = await axios.post('http://localhost:3010/api/user/login', {
      email: 'user@example.com',
      password: 'User@123'
    });
    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Update phonebook name
    const updatedPbName = `${uniquePbName} - Edited`;
    const updatePbRes = await axios.post('http://localhost:3010/api/phonebook/update', {
      id: pbId,
      name: updatedPbName
    }, { headers });

    const dbPhonebooksAfterEdit = await queryDb('SELECT * FROM phonebook WHERE id = $1', [pbId]);
    const dbContactsAfterPbEdit = await queryDb('SELECT * FROM contact WHERE id = $1', [contactId]);

    // Update contact details
    const updatedContactName = `${contactName} - Edited`;
    const updateContactRes = await axios.post('http://localhost:3010/api/phonebook/update_contact', {
      id: contactId,
      name: updatedContactName,
      mobile: '+919876543211',
      var1: 'val1_edited',
      var2: 'val2'
    }, { headers });

    const dbContactsAfterEdit = await queryDb('SELECT * FROM contact WHERE id = $1', [contactId]);

    auditLogs.phonebook.edit = {
      apiPresent: true,
      successResponse: updatePbRes.data?.success,
      updatedNameInDb: dbPhonebooksAfterEdit[0]?.name === updatedPbName,
      syncedInContactsDb: dbContactsAfterPbEdit[0]?.phonebook_name === updatedPbName
    };

    auditLogs.contact.edit = {
      apiPresent: true,
      successResponse: updateContactRes.data?.success,
      updatedNameInDb: dbContactsAfterEdit[0]?.name === updatedContactName,
      updatedMobileInDb: dbContactsAfterEdit[0]?.mobile === '+919876543211',
      updatedVar1InDb: dbContactsAfterEdit[0]?.var1 === 'val1_edited',
      updatedVar2InDb: dbContactsAfterEdit[0]?.var2 === 'val2'
    };

    // Reload page to verify persistence on UI refresh
    console.log('Reloading page to verify refresh persistence...');
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'contacts_05b_after_edit_reload.png') });

    // 6. Delete Contact
    console.log('Deleting contact...');
    // Select check box for our edited contact
    await page.evaluate((name) => {
      const rows = Array.from(document.querySelectorAll('tr'));
      const targetRow = rows.find(r => r.innerText.includes(name));
      if (targetRow) {
        const targetCheckbox = targetRow.querySelector('input[type="checkbox"]');
        if (targetCheckbox) {
          targetCheckbox.click();
        }
      }
    }, updatedContactName);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'contacts_06_selected_contact.png') });

    // Click "Delete selected" button
    await page.evaluate(() => {
      const deleteBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Delete selected'));
      if (deleteBtn) deleteBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'contacts_07_contact_deleted.png') });

    // Verify row removed from database
    const deletedContacts = await queryDb('SELECT * FROM contact WHERE id = $1', [contactId]);
    console.log('DB contacts match after delete:', deletedContacts);
    auditLogs.contact.delete = {
      persisted: deletedContacts.length === 0
    };

    // 7. Delete Phonebook
    console.log('Deleting phonebook...');
    await page.evaluate((id) => {
      // Find row with phonebook ID and click its Delete button
      const rows = Array.from(document.querySelectorAll('tr'));
      const targetRow = rows.find(r => r.innerText.includes(id));
      if (targetRow) {
        const delBtn = targetRow.querySelector('button');
        if (delBtn) delBtn.click();
      }
    }, pbId);
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'contacts_08_phonebook_deleted.png') });

    // Verify phonebook deleted from database
    const deletedPhonebooks = await queryDb('SELECT * FROM phonebook WHERE id = $1', [pbId]);
    console.log('DB phonebooks match after delete:', deletedPhonebooks);
    auditLogs.phonebook.delete = {
      persisted: deletedPhonebooks.length === 0
    };

  } catch (err) {
    console.error('Audit encountered error:', err);
    auditLogs.error = err.message;
  } finally {
    await browser.close();
  }

  console.log('\n=== Contacts & Phonebook Audit Summary ===');
  console.log(JSON.stringify(auditLogs, null, 2));
  fs.writeFileSync('/home/shadow/projects/B1GCRM/contacts_audit_report.json', JSON.stringify(auditLogs, null, 2));
})();
