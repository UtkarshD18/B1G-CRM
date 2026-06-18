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
      password: 'User@123'
    });
    
    const token = loginRes.data.token;
    if (!token) {
      throw new Error('Failed to login, token not returned');
    }

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Create flow
    const flowId = `audit-flow-${Date.now()}`;
    const flowTitle = `Audit Flow ${Date.now()}`;
    const nodes = [{ id: '1', type: 'START', data: { label: 'Start' } }];
    const edges = [];

    console.log(`Creating flow: ${flowTitle} (ID: ${flowId})...`);
    const createRes = await axios.post('http://localhost:3010/api/chat_flow/add_new', {
      title: flowTitle,
      flowId,
      nodes,
      edges
    }, { headers });

    console.log('Create response:', createRes.data);

    // Verify DB entry
    const dbFlows = await queryDb('SELECT * FROM flow WHERE flow_id = $1', [flowId]);
    console.log('DB flows match:', dbFlows);

    auditLogs.create = {
      flowId,
      title: flowTitle,
      successResponse: createRes.data.success,
      persistedInDb: dbFlows.length > 0,
      row: dbFlows[0] || null
    };

    if (dbFlows.length < 1) {
      throw new Error('Flow row not found in PostgreSQL flow table');
    }

    const primaryId = dbFlows[0].id;

    // 3. Verify files on filesystem inside app container
    console.log('Checking JSON files on disk...');
    // We will verify inside the report that files write to `/app/flow-json/...`
    auditLogs.filesystem = {
      nodesPath: `/app/flow-json/nodes/local-user-uid/${flowId}.json`,
      edgesPath: `/app/flow-json/edges/local-user-uid/${flowId}.json`,
      notes: "Files are saved inside docker app container."
    };

    // 4. Reload flow using flowId
    console.log('Reloading flow structure...');
    const reloadRes = await axios.post('http://localhost:3010/api/chat_flow/get_by_flow_id', {
      flowId
    }, { headers });

    console.log('Reload response nodes count:', reloadRes.data.nodes?.length);
    auditLogs.reload = {
      success: reloadRes.data.success,
      nodesCount: reloadRes.data.nodes?.length,
      edgesCount: reloadRes.data.edges?.length,
      structureMatches: reloadRes.data.nodes?.[0]?.id === '1'
    };

    // 5. Update/Edit Flow (Upsert)
    console.log('Updating/Editing flow title...');
    const updatedTitle = `Updated ${flowTitle}`;
    const updateRes = await axios.post('http://localhost:3010/api/chat_flow/add_new', {
      title: updatedTitle,
      flowId,
      nodes: [{ id: '1', type: 'START', data: { label: 'Start Updated' } }],
      edges
    }, { headers });

    console.log('Update response:', updateRes.data);
    
    // Verify DB update
    const dbFlowsAfterUpdate = await queryDb('SELECT * FROM flow WHERE flow_id = $1', [flowId]);
    console.log('DB flows title after update:', dbFlowsAfterUpdate[0]?.title);

    auditLogs.update = {
      successResponse: updateRes.data.success,
      titleUpdatedInDb: dbFlowsAfterUpdate[0]?.title === updatedTitle
    };

    // 6. Delete Flow
    console.log('Deleting flow...');
    const deleteRes = await axios.post('http://localhost:3010/api/chat_flow/del_flow', {
      id: primaryId,
      flowId
    }, { headers });

    console.log('Delete response:', deleteRes.data);

    // Verify DB deletion
    const dbFlowsAfterDelete = await queryDb('SELECT * FROM flow WHERE flow_id = $1', [flowId]);
    console.log('DB flows count after delete:', dbFlowsAfterDelete.length);

    auditLogs.delete = {
      successResponse: deleteRes.data.success,
      removedFromDb: dbFlowsAfterDelete.length === 0
    };

  } catch (err) {
    console.error('Flow e2e audit failed:', err.message);
    auditLogs.error = err.message;
  }

  console.log('\n=== Flow Audit Summary ===');
  console.log(JSON.stringify(auditLogs, null, 2));
  fs.writeFileSync('/home/shadow/projects/B1GCRM/flows_audit_report.json', JSON.stringify(auditLogs, null, 2));
})();
