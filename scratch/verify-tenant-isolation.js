require('dotenv').config();
const axios = require('axios');
const { Client } = require('pg');
const fs = require('fs');

const queryDb = async (sql, params = []) => {
  const client = new Client({
    host: process.env.PGHOST || '127.0.0.1',
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER || 'b1gcrm',
    password: process.env.PGPASSWORD || 'CHANGE_ME',
    database: process.env.PGDATABASE || 'b1gcrm'
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
  console.log('=== Tenant Isolation (IDOR) Hardening Verification ===\n');
  const results = {
    setup: false,
    addReminderBlocked: false,
    addActivityBlocked: false,
    getRemindersBlocked: false,
    getActivitiesBlocked: false,
    importContactsBlocked: false,
    addSingleContactBlocked: false,
    cleanup: false,
    pass: false
  };

  let tenant1Token = '';
  let tenant2Token = '';
  let tenant1LeadId = null;
  let tenant1PhonebookId = null;
  let tenant2Email = `tenant2_${Date.now()}@example.com`;

  try {
    // 1. Authenticate as Tenant 1
    console.log('Logging in as Tenant 1 (user@example.com)...');
    const login1Res = await axios.post('http://localhost:3010/api/user/login', {
      email: 'user@example.com',
      password: process.env.TEST_USER_PASSWORD || 'CHANGE_ME'
    });
    tenant1Token = login1Res.data.token;
    if (!tenant1Token) throw new Error('Tenant 1 login failed');
 
    // 2. Sign up and login as Tenant 2
    console.log(`Signing up and logging in as Tenant 2 (${tenant2Email})...`);
    await axios.post('http://localhost:3010/api/user/signup', {
      name: 'Tenant Two',
      email: tenant2Email,
      password: process.env.TEST_USER_PASSWORD || 'CHANGE_ME',
      mobile_with_country_code: '9876543210',
      acceptPolicy: true
    });
    // Give Tenant 2 a valid plan to pass the checkPlan middleware
    await queryDb(
      `UPDATE "user" SET plan = $1, plan_expire = $2 WHERE email = $3`,
      ['{"contact_limit":100000,"allow_note":1,"allow_tag":1,"allow_chatbot":1,"allow_api":1}', 4102444800000, tenant2Email]
    );
    const login2Res = await axios.post('http://localhost:3010/api/user/login', {
      email: tenant2Email,
      password: process.env.TEST_USER_PASSWORD || 'CHANGE_ME'
    });
    tenant2Token = login2Res.data.token;
    if (!tenant2Token) throw new Error('Tenant 2 login failed');

    // 3. Create Lead and Phonebook as Tenant 1
    console.log("Creating a Lead as Tenant 1...");
    const createLeadRes = await axios.post('http://localhost:3010/api/crm/leads/add', {
      name: 'Tenant 1 Lead',
      mobile: '1234567890',
      stage: 'Lead',
      value: 100
    }, { headers: { Authorization: `Bearer ${tenant1Token}` } });
    
    tenant1LeadId = createLeadRes.data.data?.id;
    console.log(`- Created Lead ID: ${tenant1LeadId}`);

    console.log("Creating a Phonebook as Tenant 1...");
    const createPbRes = await axios.post('http://localhost:3010/api/phonebook/add', {
      name: 'Tenant 1 Phonebook'
    }, { headers: { Authorization: `Bearer ${tenant1Token}` } });

    tenant1PhonebookId = createPbRes.data.data?.id;
    console.log(`- Created Phonebook ID: ${tenant1PhonebookId}`);

    if (tenant1LeadId && tenant1PhonebookId) {
      results.setup = true;
    } else {
      throw new Error("Failed to set up Tenant 1 resource IDs");
    }

    console.log('\n--- Auditing cross-tenant IDOR queries under Tenant 2 ---');

    // 4. Test add_reminder on Tenant 1 Lead
    console.log('Testing add_reminder on another tenant\'s Lead...');
    const addReminderRes = await axios.post('http://localhost:3010/api/crm/leads/add_reminder', {
      lead_id: tenant1LeadId,
      title: 'Hacked Reminder',
      remind_at: new Date(Date.now() + 3600000).toISOString()
    }, { headers: { Authorization: `Bearer ${tenant2Token}` } });
    console.log(`- Response: success = ${addReminderRes.data.success}, msg = "${addReminderRes.data.msg}"`);
    if (addReminderRes.data.success === false && addReminderRes.data.msg.includes('not found or unauthorized')) {
      results.addReminderBlocked = true;
    }

    // 5. Test add_activity on Tenant 1 Lead
    console.log('Testing add_activity on another tenant\'s Lead...');
    const addActivityRes = await axios.post('http://localhost:3010/api/crm/leads/add_activity', {
      lead_id: tenant1LeadId,
      activity_type: 'note',
      description: 'Hacked Activity'
    }, { headers: { Authorization: `Bearer ${tenant2Token}` } });
    console.log(`- Response: success = ${addActivityRes.data.success}, msg = "${addActivityRes.data.msg}"`);
    if (addActivityRes.data.success === false && addActivityRes.data.msg.includes('not found or unauthorized')) {
      results.addActivityBlocked = true;
    }

    // 6. Test get reminders on Tenant 1 Lead
    console.log('Testing fetch reminders on another tenant\'s Lead...');
    const getRemindersRes = await axios.get(`http://localhost:3010/api/crm/leads/reminders/${tenant1LeadId}`, {
      headers: { Authorization: `Bearer ${tenant2Token}` }
    });
    console.log(`- Response: success = ${getRemindersRes.data.success}, msg = "${getRemindersRes.data.msg}"`);
    if (getRemindersRes.data.success === false && getRemindersRes.data.msg.includes('not found or unauthorized')) {
      results.getRemindersBlocked = true;
    }

    // 7. Test get activities on Tenant 1 Lead
    console.log('Testing fetch activities on another tenant\'s Lead...');
    const getActivitiesRes = await axios.get(`http://localhost:3010/api/crm/leads/activities/${tenant1LeadId}`, {
      headers: { Authorization: `Bearer ${tenant2Token}` }
    });
    console.log(`- Response: success = ${getActivitiesRes.data.success}, msg = "${getActivitiesRes.data.msg}"`);
    if (getActivitiesRes.data.success === false && getActivitiesRes.data.msg.includes('not found or unauthorized')) {
      results.getActivitiesBlocked = true;
    }

    // 8. Test import_contacts on Tenant 1 Phonebook
    console.log('Testing import_contacts on another tenant\'s Phonebook...');
    // We mock the files payload or send empty file to hit the validation logic first
    const importContactsRes = await axios.post('http://localhost:3010/api/phonebook/import_contacts', {
      id: tenant1PhonebookId,
      phonebook_name: 'Tenant 1 Phonebook'
    }, { headers: { Authorization: `Bearer ${tenant2Token}` } });
    console.log(`- Response: success = ${importContactsRes.data.success}, msg = "${importContactsRes.data.msg}"`);
    if (importContactsRes.data.success === false && importContactsRes.data.msg.includes('not found or unauthorized')) {
      results.importContactsBlocked = true;
    }

    // 9. Test add_single_contact on Tenant 1 Phonebook
    console.log('Testing add_single_contact on another tenant\'s Phonebook...');
    const addSingleRes = await axios.post('http://localhost:3010/api/phonebook/add_single_contact', {
      id: tenant1PhonebookId,
      phonebook_name: 'Tenant 1 Phonebook',
      name: 'Hacked Contact',
      mobile: '9999999999'
    }, { headers: { Authorization: `Bearer ${tenant2Token}` } });
    console.log(`- Response: success = ${addSingleRes.data.success}, msg = "${addSingleRes.data.msg}"`);
    if (addSingleRes.data.success === false && addSingleRes.data.msg.includes('not found or unauthorized')) {
      results.addSingleContactBlocked = true;
    }

    // 10. Clean up created DB entries
    console.log('\nCleaning up verification entries from database...');
    await queryDb('DELETE FROM crm_leads WHERE id = $1', [tenant1LeadId]);
    await queryDb('DELETE FROM crm_lead_activities WHERE lead_id = $1', [tenant1LeadId]);
    await queryDb('DELETE FROM phonebook WHERE id = $1', [tenant1PhonebookId]);
    await queryDb('DELETE FROM "user" WHERE email = $1', [tenant2Email]);
    results.cleanup = true;
    console.log('- Cleanup done.');

    // Overall check
    if (
      results.setup &&
      results.addReminderBlocked &&
      results.addActivityBlocked &&
      results.getRemindersBlocked &&
      results.getActivitiesBlocked &&
      results.importContactsBlocked &&
      results.addSingleContactBlocked &&
      results.cleanup
    ) {
      results.pass = true;
      console.log('\n✅ All Tenant Isolation IDOR audits PASSED!');
    } else {
      console.log('\n❌ Tenant Isolation IDOR validation audit FAILED!');
    }

  } catch (err) {
    console.error('\nVerification run failed with error:', err.message);
    results.error = err.message;
    // Attempt cleanup even on failure
    if (tenant1LeadId) {
      await queryDb('DELETE FROM crm_leads WHERE id = $1', [tenant1LeadId]);
      await queryDb('DELETE FROM crm_lead_activities WHERE lead_id = $1', [tenant1LeadId]);
    }
    if (tenant1PhonebookId) {
      await queryDb('DELETE FROM phonebook WHERE id = $1', [tenant1PhonebookId]);
    }
    await queryDb('DELETE FROM "user" WHERE email = $1', [tenant2Email]);
  }

  fs.writeFileSync('tenant_isolation_verification_report.json', JSON.stringify(results, null, 2));
  console.log('Report saved to tenant_isolation_verification_report.json');
})();
