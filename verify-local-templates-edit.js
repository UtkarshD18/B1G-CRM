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
    // 1. Authenticate to get JWT token
    console.log('Logging in as User...');
    const loginRes = await axios.post('http://localhost:3010/api/user/login', {
      email: 'user@example.com',
      password: '<PASSWORD>'
    });
    
    const token = loginRes.data.token;
    if (!token) {
      throw new Error('Failed to login, token not returned');
    }

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Create local template
    console.log('Creating local template...');
    const templateTitle = `Edit Temp ${Date.now()}`;
    const createRes = await axios.post('http://localhost:3010/api/templet/add_new', {
      title: templateTitle,
      type: 'text',
      content: { body: 'Hello original content' }
    }, { headers });

    console.log('Create response:', createRes.data);
    
    // Verify in database
    const dbRows = await queryDb('SELECT * FROM templets WHERE title = $1', [templateTitle]);
    console.log('DB rows match:', dbRows);

    if (dbRows.length < 1) {
      throw new Error('Template row not found in PostgreSQL templets table');
    }

    const templateId = dbRows[0].id;

    auditLogs.create = {
      title: templateTitle,
      id: templateId,
      successResponse: createRes.data.success,
      persisted: true
    };

    // 3. Edit local template
    console.log('Updating local template...');
    const updatedTitle = `${templateTitle} - Updated`;
    const updateRes = await axios.post('http://localhost:3010/api/templet/update', {
      id: templateId,
      title: updatedTitle,
      type: 'text',
      content: { body: 'Hello updated content' }
    }, { headers });

    console.log('Update response:', updateRes.data);

    // Verify update in database
    const dbRowsAfterUpdate = await queryDb('SELECT * FROM templets WHERE id = $1', [templateId]);
    console.log('DB rows after update:', dbRowsAfterUpdate);

    auditLogs.update = {
      title: updatedTitle,
      successResponse: updateRes.data.success,
      contentUpdated: dbRowsAfterUpdate[0]?.title === updatedTitle && JSON.parse(dbRowsAfterUpdate[0]?.content).body === 'Hello updated content'
    };

    // 4. Delete template
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

  console.log('\n=== Local Templates Edit Audit Summary ===');
  console.log(JSON.stringify(auditLogs, null, 2));
  fs.writeFileSync('templates_edit_audit_report.json', JSON.stringify(auditLogs, null, 2));
})();
