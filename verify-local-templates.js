require('dotenv').config();
const axios = require('axios');
const { Client } = require('pg');
const fs = require('fs');

const queryDb = async (sql, params = []) => {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'b1gcrm',
    password: process.env.PGPASSWORD || 'CHANGE_ME',
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
    // 1. Authenticate to get JWT token
    console.log('Logging in as User...');
    const loginRes = await axios.post('http://localhost:3010/api/user/login', {
      email: 'user@example.com',
      password: process.env.TEST_USER_PASSWORD || 'CHANGE_ME'
    });
    
    const token = loginRes.data.token;
    if (!token) {
      throw new Error('Failed to login, token not returned');
    }

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Create local template
    console.log('Creating local template...');
    const templateTitle = `Audit Temp ${Date.now()}`;
    const createRes = await axios.post('http://localhost:3010/api/templet/add_new', {
      title: templateTitle,
      type: 'text',
      content: { body: 'Hello audit tester' }
    }, { headers });

    console.log('Create response:', createRes.data);
    
    // Verify in database
    const dbRows = await queryDb('SELECT * FROM templets WHERE title = $1', [templateTitle]);
    console.log('DB rows match:', dbRows);

    auditLogs.create = {
      title: templateTitle,
      successResponse: createRes.data.success,
      persisted: dbRows.length > 0,
      row: dbRows[0] || null
    };

    if (dbRows.length < 1) {
      throw new Error('Template row not found in PostgreSQL templets table');
    }

    const templateId = dbRows[0].id;

    // 3. Read templates
    console.log('Reading local templates...');
    const getRes = await axios.get('http://localhost:3010/api/templet/get_templets', { headers });
    console.log('Read response count:', getRes.data.data.length);
    
    auditLogs.read = {
      success: getRes.data.success,
      count: getRes.data.data.length,
      containsAuditTemp: getRes.data.data.some(t => t.title === templateTitle)
    };

    // 4. Edit template (Not supported)
    auditLogs.edit = {
      supported: false,
      notes: "Edit/Update local templates is not supported by API routes (no update endpoint in routes/templet.js) or user portal client files."
    };

    // 5. Delete template
    console.log('Deleting local template...');
    const deleteRes = await axios.post('http://localhost:3010/api/templet/del_templets', {
      selected: [templateId]
    }, { headers });

    console.log('Delete response:', deleteRes.data);

    // Verify row removed from database
    const dbRowsAfterDelete = await queryDb('SELECT * FROM templets WHERE id = $1', [templateId]);
    console.log('DB rows after delete:', dbRowsAfterDelete);

    auditLogs.delete = {
      successResponse: deleteRes.data.success,
      removedFromDb: dbRowsAfterDelete.length === 0
    };

  } catch (err) {
    console.error('Audit encountered error:', err.message);
    auditLogs.error = err.message;
  }

  console.log('\n=== Local Templates Audit Summary ===');
  console.log(JSON.stringify(auditLogs, null, 2));
  fs.writeFileSync('templates_audit_report.json', JSON.stringify(auditLogs, null, 2));
})();
