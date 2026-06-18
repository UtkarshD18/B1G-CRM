const axios = require('axios');
const { Client } = require('pg');
const fs = require('fs');

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
  const auditLogs = {};
  
  try {
    // 1. Authenticate as Admin
    console.log('Logging in as Admin...');
    const loginRes = await axios.post('http://localhost:3010/api/admin/login', {
      email: 'admin@example.com',
      password: 'Admin@123'
    });
    
    const token = loginRes.data.token;
    if (!token) {
      throw new Error('Failed to login as admin, token not returned');
    }
    const headers = { Authorization: `Bearer ${token}` };

    // Clean up any existing test records
    await queryDb("DELETE FROM plan WHERE title = 'Audit Test Plan'");

    // 2. Add new plan definition
    console.log('Adding new plan definition via API...');
    const addRes = await axios.post('http://localhost:3010/api/admin/add_plan', {
      title: 'Audit Test Plan',
      short_description: 'Audit plan description',
      allow_tag: true,
      allow_note: true,
      allow_chatbot: false,
      contact_limit: 500,
      allow_api: false,
      is_trial: false,
      price: 29.99,
      price_strike: 39.99,
      plan_duration_in_days: 30
    }, { headers });
    
    console.log('Add response:', addRes.data);
    
    // Verify DB entry
    const dbPlans = await queryDb("SELECT * FROM plan WHERE title = 'Audit Test Plan'");
    console.log('DB entry after add:', dbPlans);
    
    if (dbPlans.length < 1) {
      throw new Error('Plan definition not persisted in PG');
    }
    
    const planId = dbPlans[0].id;
    
    // 3. Edit plan definition via API
    console.log(`Editing plan definition ${planId} via API...`);
    const editRes = await axios.post('http://localhost:3010/api/admin/edit_plan', {
      id: planId,
      title: 'Audit Test Plan',
      short_description: 'Updated description',
      allow_tag: true,
      allow_note: true,
      allow_chatbot: true,
      contact_limit: 1000,
      allow_api: true,
      is_trial: false,
      price: 49.99,
      price_strike: 59.99,
      plan_duration_in_days: 90
    }, { headers });
    
    console.log('Edit response:', editRes.data);
    
    // Verify in DB
    const dbPlansAfterEdit = await queryDb("SELECT * FROM plan WHERE id = $1", [planId]);
    console.log('DB entry after edit:', dbPlansAfterEdit);
    
    auditLogs.planEdit = {
      id: planId,
      addSuccess: addRes.data.success,
      editSuccess: editRes.data.success,
      editedRow: dbPlansAfterEdit[0] || null
    };
    
    // 4. Clean up
    console.log('Deleting test plan...');
    const delRes = await axios.post('http://localhost:3010/api/admin/del_plan', {
      id: planId
    }, { headers });
    console.log('Delete response:', delRes.data);
    
  } catch (err) {
    console.error('Plan admin audit failed:', err.message);
    auditLogs.error = err.message;
    if (err.response) {
      console.error('Response data:', err.response.data);
    }
  }
  
  console.log('\n=== Plan Admin Audit Summary ===');
  console.log(JSON.stringify(auditLogs, null, 2));
})();
