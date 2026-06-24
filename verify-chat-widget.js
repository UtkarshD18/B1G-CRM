require('dotenv').config();
const axios = require('axios');
const { Client } = require('pg');

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

    // 2. Add Chat Widget
    const widgetTitle = `Audit Widget ${Date.now()}`;
    console.log(`Creating chat widget: ${widgetTitle}...`);
    const createRes = await axios.post('http://localhost:3010/api/user/add_widget', {
      title: widgetTitle,
      whatsapp_number: '+919999900000',
      selectedIcon: 'logo.png',
      place: 'right',
      size: 60
    }, { headers });

    console.log('Create response:', createRes.data);

    // Verify DB entry
    const dbWidgets = await queryDb('SELECT * FROM chat_widget WHERE title = $1', [widgetTitle]);
    console.log('DB widgets match:', dbWidgets);

    auditLogs.create = {
      title: widgetTitle,
      successResponse: createRes.data.success,
      persistedInDb: dbWidgets.length > 0,
      row: dbWidgets[0] || null
    };

    if (dbWidgets.length < 1) {
      throw new Error('Chat widget row not found in PostgreSQL');
    }

    const widgetId = dbWidgets[0].id;
    const widgetUniqueId = dbWidgets[0].unique_id;

    // 3. Get my widget
    console.log('Reading my widget list...');
    const getRes = await axios.get('http://localhost:3010/api/user/get_my_widget', { headers });
    const containsAuditWidget = getRes.data.data.some(w => w.title === widgetTitle);
    console.log('Contains audit widget:', containsAuditWidget);

    auditLogs.read = {
      success: getRes.data.success,
      count: getRes.data.data.length,
      containsAuditWidget
    };

    // 4. Verify widget public endpoint rendering
    console.log(`Fetching public widget rendering endpoint: GET /api/user/widget?id=${widgetUniqueId}...`);
    const publicRenderRes = await axios.get(`http://localhost:3010/api/user/widget?id=${widgetUniqueId}`);
    
    console.log('Public widget status:', publicRenderRes.status);
    const hasWaLink = publicRenderRes.data.includes('https://wa.me/') || publicRenderRes.data.includes('https://api.whatsapp.com/send');
    const hasLogo = publicRenderRes.data.includes('logo.png');
    console.log('Contains WhatsApp redirect url:', hasWaLink);
    console.log('Contains Widget logo url:', hasLogo);

    auditLogs.publicRender = {
      status: publicRenderRes.status,
      returnsHTML: typeof publicRenderRes.data === 'string',
      hasWhatsAppRedirect: hasWaLink,
      hasLogo
    };

    // 5. Delete Widget
    console.log('Deleting chat widget...');
    const deleteRes = await axios.post('http://localhost:3010/api/user/del_widget', {
      id: widgetId
    }, { headers });

    console.log('Delete response:', deleteRes.data);

    // Verify DB deletion
    const dbWidgetsAfterDelete = await queryDb('SELECT * FROM chat_widget WHERE id = $1', [widgetId]);
    console.log('DB widgets after delete:', dbWidgetsAfterDelete.length);

    auditLogs.delete = {
      successResponse: deleteRes.data.success,
      removedFromDb: dbWidgetsAfterDelete.length === 0
    };

  } catch (err) {
    console.error('Chat widget audit failed:', err.message);
    auditLogs.error = err.message;
  }

  console.log('\n=== Chat Widget Audit Summary ===');
  console.log(JSON.stringify(auditLogs, null, 2));
})();
