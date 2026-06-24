require('dotenv').config();
const axios = require('axios');
const { Client } = require('pg');

const queryDb = async (sql, params = []) => {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'b1gcrm',
    password: 'b1gcrm123',
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
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:3010/api/user/login', {
      email: 'user@example.com',
      password: 'CHANGE_ME'
    });
    
    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('Test 1: invalid size string ("abc")');
    const res1 = await axios.post('http://localhost:3010/api/user/add_widget', {
      title: 'Hardening Test 1',
      whatsapp_number: '+919999900001',
      selectedIcon: 'logo.png',
      place: 'BOTTOM_LEFT',
      size: 'abc'
    }, { headers });
    console.log('Test 1 response:', res1.data);

    console.log('Test 2: size string with px suffix ("120px")');
    const res2 = await axios.post('http://localhost:3010/api/user/add_widget', {
      title: 'Hardening Test 2',
      whatsapp_number: '+919999900002',
      selectedIcon: 'logo.png',
      place: 'TOP_RIGHT',
      size: '120px'
    }, { headers });
    console.log('Test 2 response:', res2.data);

    console.log('Test 3: invalid placement value ("somewhere")');
    const res3 = await axios.post('http://localhost:3010/api/user/add_widget', {
      title: 'Hardening Test 3',
      whatsapp_number: '+919999900003',
      selectedIcon: 'logo.png',
      place: 'somewhere',
      size: 50
    }, { headers });
    console.log('Test 3 response:', res3.data);

    console.log('Test 4: un-sanitized phone number ("+1-202-555- 0184")');
    const res4 = await axios.post('http://localhost:3010/api/user/add_widget', {
      title: 'Hardening Test 4',
      whatsapp_number: '+1-202-555- 0184',
      selectedIcon: 'logo.png',
      place: 'ALL_CENTER',
      size: 70
    }, { headers });
    console.log('Test 4 response:', res4.data);

    // Verify all rows in PostgreSQL
    console.log('Querying database to check persisted fields...');
    const rows = await queryDb("SELECT title, whatsapp_number, place, size FROM chat_widget WHERE title LIKE 'Hardening Test%' ORDER BY title");
    console.log('Persisted Rows:', rows);

    // Clean up
    await queryDb("DELETE FROM chat_widget WHERE title LIKE 'Hardening Test%'");
    console.log('Database cleaned up.');
  } catch (err) {
    console.error('Hardening verification failed:', err.response ? err.response.data : err.message);
  }
})();
