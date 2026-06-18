const axios = require('axios');
const FormData = require('form-data');
const { Client } = require('pg');

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
  try {
    console.log('Logging in as User...');
    const loginRes = await axios.post('http://localhost:3010/api/user/login', {
      email: 'user@example.com',
      password: '<PASSWORD>'
    });
    
    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('Creating phonebook for CSV Import Audit...');
    const pbName = `CSV PB ${Date.now()}`;
    const createPbRes = await axios.post('http://localhost:3010/api/phonebook/add', {
      name: pbName
    }, { headers });

    const dbPb = await queryDb('SELECT * FROM phonebook WHERE name = $1', [pbName]);
    const pbId = dbPb[0].id;

    console.log('Preparing mock CSV file data...');
    const csvContent = 'name,mobile,var1\nCSV User 1,+919999900001,var1_value\nCSV User 2,+919999900002,var2_value\n';
    
    const form = new FormData();
    form.append('id', pbId);
    form.append('phonebook_name', pbName);
    form.append('file', Buffer.from(csvContent), {
      filename: 'contacts.csv',
      contentType: 'text/csv'
    });

    console.log('Uploading CSV to import_contacts API endpoint...');
    const importRes = await axios.post('http://localhost:3010/api/phonebook/import_contacts', form, {
      headers: {
        ...headers,
        ...form.getHeaders()
      }
    });

    console.log('Import API Response:', importRes.data);

    // Verify in database
    const dbContacts = await queryDb('SELECT * FROM contact WHERE phonebook_id = $1 ORDER BY id ASC', [pbId]);
    console.log('Database Rows:', dbContacts);

    const success = importRes.data.success && dbContacts.length === 2 && dbContacts[0].name === 'CSV User 1';

    console.log('\n=== CSV Import Verification Summary ===');
    console.log(JSON.stringify({
      success,
      apiResponse: importRes.data,
      dbContactsCount: dbContacts.length,
      dbRows: dbContacts
    }, null, 2));

    // Cleanup
    await queryDb('DELETE FROM contact WHERE phonebook_id = $1', [pbId]);
    await queryDb('DELETE FROM phonebook WHERE id = $1', [pbId]);

  } catch (err) {
    console.error('CSV Import Verification failed:', err.message);
  }
})();
