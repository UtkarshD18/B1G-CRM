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
    // 1. Authenticate User to get JWT token
    console.log('Logging in as User...');
    const userLoginRes = await axios.post('http://localhost:3010/api/user/login', {
      email: 'user@example.com',
      password: 'User@123'
    });
    const userToken = userLoginRes.data.token;
    const userHeaders = { Authorization: `Bearer ${userToken}` };

    // 2. Create Agent account
    const agentEmail = `audit-agent-${Date.now()}@example.com`;
    const agentName = `Audit Agent ${Date.now()}`;
    console.log(`Creating agent account for ${agentEmail}...`);
    const createAgentRes = await axios.post('http://localhost:3010/api/agent/add_agent', {
      name: agentName,
      password: 'AgentPassword123',
      email: agentEmail,
      mobile: '+919876543210',
      comments: 'Audit temp comments'
    }, { headers: userHeaders });

    console.log('Agent Create response:', createAgentRes.data);

    // Verify row in DB
    const dbAgents = await queryDb('SELECT * FROM agents WHERE email = $1', [agentEmail]);
    console.log('DB agents match:', dbAgents);

    auditLogs.agentCreate = {
      name: agentName,
      email: agentEmail,
      successResponse: createAgentRes.data.success,
      persistedInDb: dbAgents.length > 0,
      row: dbAgents[0] ? { ...dbAgents[0], password: '[HIDDEN]' } : null
    };

    if (dbAgents.length < 1) {
      throw new Error('Agent row not found in PostgreSQL agents table');
    }

    const agentUid = dbAgents[0].uid;

    // 3. Agent Login
    console.log('Logging in as Agent...');
    const agentLoginRes = await axios.post('http://localhost:3010/api/agent/login', {
      email: agentEmail,
      password: 'AgentPassword123'
    });
    
    const agentToken = agentLoginRes.data.token;
    console.log('Agent login response success:', agentLoginRes.data.success);
    const agentHeaders = { Authorization: `Bearer ${agentToken}` };

    auditLogs.agentLogin = {
      success: agentLoginRes.data.success,
      tokenReturned: !!agentToken
    };

    if (!agentToken) {
      throw new Error('Agent authentication failed');
    }

    // 4. Assign Task
    console.log('User assigning task to Agent...');
    const taskTitle = `Audit Task ${Date.now()}`;
    const createTaskRes = await axios.post('http://localhost:3010/api/user/add_task_for_agent', {
      title: taskTitle,
      des: 'Please complete the parity check validation',
      agent_uid: agentUid
    }, { headers: userHeaders });

    console.log('Task Create response:', createTaskRes.data);

    // Verify task in DB
    const dbTasks = await queryDb('SELECT * FROM agent_task WHERE uid = $1 AND title = $2', [agentUid, taskTitle]);
    console.log('DB tasks match:', dbTasks);

    auditLogs.taskAssign = {
      title: taskTitle,
      successResponse: createTaskRes.data.success,
      persistedInDb: dbTasks.length > 0,
      row: dbTasks[0] || null
    };

    if (dbTasks.length < 1) {
      throw new Error('Task row not found in PostgreSQL agent_task table');
    }

    const taskId = dbTasks[0].id;

    // 5. Agent receives and completes task
    console.log('Agent loading tasks...');
    const getTasksRes = await axios.get('http://localhost:3010/api/agent/get_my_task', { headers: agentHeaders });
    const hasTask = getTasksRes.data.data.some(t => t.id === taskId);
    console.log('Agent task queue has assigned task:', hasTask);

    console.log('Agent completing task...');
    const completeTaskRes = await axios.post('http://localhost:3010/api/agent/mark_task_complete', {
      id: taskId,
      comment: 'Parity check completed successfully'
    }, { headers: agentHeaders });

    console.log('Task Complete response:', completeTaskRes.data);

    // Verify status update in DB
    const dbTasksAfterComplete = await queryDb('SELECT * FROM agent_task WHERE id = $1', [taskId]);
    console.log('DB task status after complete:', dbTasksAfterComplete[0]?.status);
    console.log('DB task agent comments:', dbTasksAfterComplete[0]?.agent_comments);

    auditLogs.taskComplete = {
      successResponse: completeTaskRes.data.success,
      statusInDb: dbTasksAfterComplete[0]?.status,
      commentsInDb: dbTasksAfterComplete[0]?.agent_comments
    };

    // 6. Cleanups
    console.log('Cleaning up tasks and agents...');
    // Delete task
    await axios.post('http://localhost:3010/api/user/del_task_for_agent', { id: taskId }, { headers: userHeaders });
    // Delete agent
    await axios.post('http://localhost:3010/api/agent/del_agent', { uid: agentUid }, { headers: userHeaders });

    // Verify cleanups in DB
    const dbTasksAfterCleanup = await queryDb('SELECT * FROM agent_task WHERE id = $1', [taskId]);
    const dbAgentsAfterCleanup = await queryDb('SELECT * FROM agents WHERE uid = $1', [agentUid]);

    auditLogs.cleanup = {
      taskRemoved: dbTasksAfterCleanup.length === 0,
      agentRemoved: dbAgentsAfterCleanup.length === 0
    };

  } catch (err) {
    console.error('Agent audit failed:', err.message);
    auditLogs.error = err.message;
  }

  console.log('\n=== Agent Lifecycle Audit Summary ===');
  console.log(JSON.stringify(auditLogs, null, 2));
  fs.writeFileSync('/home/shadow/projects/B1GCRM/agents_audit_report.json', JSON.stringify(auditLogs, null, 2));
})();
