const axios = require('axios');
const fs = require('fs');

(async () => {
  const auditLogs = {};
  
  try {
    // 1. Authenticate to get JWT token
    console.log('Logging in as User...');
    const loginRes = await axios.post('http://localhost:3010/api/user/login', {
      email: 'user@example.com',
      password: 'User@123'
    });
    
    const token = loginRes.data.token;
    if (!token) {
      throw new Error('Failed to login, token not returned');
    }

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Create Meta template
    console.log('Creating mock Meta template...');
    const templateName = `mock_temp_${Date.now()}`;
    const createRes = await axios.post('http://localhost:3010/api/user/add_meta_templet', {
      name: templateName,
      language: 'en_US',
      category: 'UTILITY',
      components: [
        { type: 'BODY', text: 'Hello {{1}}, original mock meta content.' }
      ]
    }, { headers });

    console.log('Create response:', createRes.data);

    // Verify in mock JSON file
    // First, let's load all templates
    const getRes = await axios.get('http://localhost:3010/api/user/get_my_meta_templets', { headers });
    const match = getRes.data.data.find(t => t.name === templateName);
    console.log('Found created template in list:', match);

    if (!match) {
      throw new Error('Template name not found in the list of Meta templates');
    }

    auditLogs.create = {
      name: templateName,
      successResponse: createRes.data.success,
      persisted: true,
      data: match
    };

    // 3. Edit Meta template
    console.log('Updating mock Meta template...');
    const updateRes = await axios.post('http://localhost:3010/api/user/update_meta_templet', {
      name: templateName,
      language: 'en_US',
      category: 'MARKETING',
      components: [
        { type: 'BODY', text: 'Hello {{1}}, updated mock meta content.' }
      ]
    }, { headers });

    console.log('Update response:', updateRes.data);

    // Verify update in list
    const getResAfterUpdate = await axios.get('http://localhost:3010/api/user/get_my_meta_templets', { headers });
    const matchAfterUpdate = getResAfterUpdate.data.data.find(t => t.name === templateName);
    console.log('Found template after update:', matchAfterUpdate);

    auditLogs.update = {
      name: templateName,
      successResponse: updateRes.data.success,
      categoryUpdated: matchAfterUpdate?.category === 'MARKETING',
      contentUpdated: matchAfterUpdate?.components?.[0]?.text === 'Hello {{1}}, updated mock meta content.'
    };

    // 4. Delete Meta template
    console.log('Deleting mock Meta template...');
    const deleteRes = await axios.post('http://localhost:3010/api/user/del_meta_templet', {
      name: templateName
    }, { headers });

    console.log('Delete response:', deleteRes.data);

    // Verify removed
    const getResAfterDelete = await axios.get('http://localhost:3010/api/user/get_my_meta_templets', { headers });
    const matchAfterDelete = getResAfterDelete.data.data.find(t => t.name === templateName);
    console.log('Found template after delete (should be undefined):', matchAfterDelete);

    auditLogs.delete = {
      successResponse: deleteRes.data.success,
      removed: matchAfterDelete === undefined
    };

  } catch (err) {
    console.error('Audit encountered error:', err.message);
    auditLogs.error = err.message;
  }

  console.log('\n=== Meta Templates Edit Audit Summary ===');
  console.log(JSON.stringify(auditLogs, null, 2));
  fs.writeFileSync('/home/shadow/projects/meta_templates_edit_audit_report.json', JSON.stringify(auditLogs, null, 2));
})();
