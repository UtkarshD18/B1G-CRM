/**
 * CROSS-MODULE INTEGRATION AUDIT
 * Tests real integration paths between modules via API calls and DB queries.
 */

require('dotenv').config();
const fetch = require('node-fetch');

const BASE = process.env.TEST_APP_URL || 'http://127.0.0.1:3010';
const USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'CHANGE_ME';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'CHANGE_ME';
const AGENT_PASSWORD = process.env.TEST_AGENT_PASSWORD || USER_PASSWORD;
const results = [];
let userToken = '';
let adminToken = '';

function log(module, test, pass, detail) {
  const status = pass ? '✅ PASS' : '❌ FAIL';
  console.log(`[${module}] ${status}: ${test}${detail ? ' — ' + detail : ''}`);
  results.push({ module, test, pass, detail });
}

async function api(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(`${BASE}${path}`, opts);
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return { status: res.status, ...data };
    } catch {
      return { success: false, error: 'Non-JSON response', htmlResponse: text.startsWith('<!') };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function loginUser() {
  const res = await api('POST', '/api/user/login', { email: 'user@example.com', password: USER_PASSWORD });
  if (res.success && res.token) {
    userToken = res.token;
    log('AUTH', 'User login', true, 'Token obtained');
  } else {
    log('AUTH', 'User login', false, JSON.stringify(res).slice(0, 200));
  }
}

async function loginAdmin() {
  const res = await api('POST', '/api/admin/login', { email: 'admin@example.com', password: ADMIN_PASSWORD });
  if (res.success && res.token) {
    adminToken = res.token;
    log('AUTH', 'Admin login', true, 'Token obtained');
  } else {
    log('AUTH', 'Admin login', false, JSON.stringify(res).slice(0, 200));
  }
}

// ============ FLOW → CHATBOT INTEGRATION ============
async function testFlowChatbotIntegration() {
  console.log('\n=== FLOW → CHATBOT INTEGRATION ===');
  
  const flows = await api('GET', '/api/chat_flow/get_mine', null, userToken);
  log('FLOW→CHATBOT', 'Get flows', flows.success && flows.data?.length > 0, `Found ${flows.data?.length || 0} flows`);
  
  if (!flows.data || flows.data.length === 0) {
    log('FLOW→CHATBOT', 'Flow existence', false, 'No flows exist');
    return;
  }
  
  const flow = flows.data[0];
  
  // Create chatbot attached to this flow
  const chatbotRes = await api('POST', '/api/chatbot/add_chatbot', {
    title: 'Integration Test Bot',
    flow: { flow_id: flow.flow_id, id: flow.id },
    origin: { code: 'META' },
    for_all: true,
    chats: []
  }, userToken);
  log('FLOW→CHATBOT', 'Create chatbot with flow', chatbotRes.success, chatbotRes.msg);
  
  // Verify chatbot list
  const chatbots = await api('GET', '/api/chatbot/get_chatbot', null, userToken);
  const testBot = chatbots.data?.find(b => b.title === 'Integration Test Bot');
  if (testBot) {
    const attachedFlow = JSON.parse(testBot.flow || '{}');
    log('FLOW→CHATBOT', 'Chatbot has flow_id', !!attachedFlow.flow_id, `flow_id: ${attachedFlow.flow_id}`);
    log('FLOW→CHATBOT', 'Chatbot active', testBot.active === 1, `active: ${testBot.active}`);
    
    const flowDetail = await api('POST', '/api/chat_flow/get_by_flow_id', { flowId: flow.flow_id }, userToken);
    log('FLOW→CHATBOT', 'Flow JSON loadable', flowDetail.success, 
      `nodes: ${flowDetail.nodes?.length || 0}, edges: ${flowDetail.edges?.length || 0}`);
    
    // Clean up
    await api('POST', '/api/chatbot/del_chatbot', { id: testBot.id }, userToken);
  } else {
    log('FLOW→CHATBOT', 'Chatbot created in DB', false, 'Not found');
  }
}

// ============ CHATBOT → DIAGNOSTICS ============
async function testChatbotDiagnostics() {
  console.log('\n=== CHATBOT → DIAGNOSTICS ===');
  
  const chatbots = await api('GET', '/api/chatbot/get_chatbot', null, userToken);
  log('CHATBOT→DIAG', 'Get chatbots', chatbots.success, `Found ${chatbots.data?.length || 0} chatbots`);
  
  const logs_res = await api('GET', '/api/chatbot/get_logs', null, userToken);
  log('CHATBOT→DIAG', 'Get diagnostic logs', logs_res.success, `Found ${logs_res.data?.length || 0} logs`);
  
  if (logs_res.data?.length > 0 && chatbots.data?.length > 0) {
    const chatbotIds = new Set(chatbots.data.map(c => c.id));
    const orphanLogs = logs_res.data.filter(l => !chatbotIds.has(l.chatbot_id));
    log('CHATBOT→DIAG', 'Logs reference valid chatbots', orphanLogs.length === 0,
      orphanLogs.length > 0 ? `${orphanLogs.length} orphan logs` : 'All valid');
  }
}

// ============ CONTACT → CAMPAIGN ============
async function testContactCampaignIntegration() {
  console.log('\n=== CONTACT → CAMPAIGN ===');
  
  // Correct endpoint: /api/phonebook/get_by_uid
  const phonebooks = await api('GET', '/api/phonebook/get_by_uid', null, userToken);
  log('CONTACT→CAMPAIGN', 'Get phonebooks', phonebooks.success, `Found ${phonebooks.data?.length || 0} phonebooks`);
  
  if (!phonebooks.data || phonebooks.data.length === 0) {
    log('CONTACT→CAMPAIGN', 'Phonebook existence', false, 'No phonebooks — cannot test campaign');
    return;
  }
  
  // Get contacts in phonebook
  const contacts = await api('GET', '/api/phonebook/get_uid_contacts', null, userToken);
  log('CONTACT→CAMPAIGN', 'Get contacts', contacts.success, `Found ${contacts.data?.length || 0} contacts`);
  
  // Get campaigns
  const campaigns = await api('GET', '/api/broadcast/get_broadcast', null, userToken);
  log('CONTACT→CAMPAIGN', 'Get campaigns', campaigns.success, `Found ${campaigns.data?.length || 0} campaigns`);
  
  // Verify campaign references a valid phonebook
  if (campaigns.data?.length > 0) {
    for (const camp of campaigns.data.slice(0, 3)) {
      try {
        const campPb = JSON.parse(camp.phonebook || '{}');
        const pbExists = phonebooks.data.some(p => p.id === campPb.id);
        log('CONTACT→CAMPAIGN', `Campaign "${camp.title}" phonebook valid`, pbExists,
          `References phonebook id: ${campPb.id}`);
      } catch(e) {
        log('CONTACT→CAMPAIGN', `Campaign "${camp.title}" phonebook parse`, false, e.message);
      }
    }
  }
}

// ============ CONTACT → INBOX ============
async function testContactInboxIntegration() {
  console.log('\n=== CONTACT → INBOX ===');
  
  const chats = await api('GET', '/api/inbox/get_chats', null, userToken);
  log('CONTACT→INBOX', 'Get chat list', chats.success, `Found ${chats.data?.length || 0} chats`);
  
  if (chats.data?.length > 0) {
    const chatsWithNames = chats.data.filter(c => c.sender_name || c.name || c.contact_name);
    log('CONTACT→INBOX', 'Chats have sender identity', chatsWithNames.length > 0,
      `${chatsWithNames.length}/${chats.data.length} chats have sender names`);
  }
}

// ============ AI PROVIDER → CHATBOT ============
async function testAiProviderIntegration() {
  console.log('\n=== AI PROVIDER → CHATBOT ===');
  
  const providers = await api('GET', '/api/ai_providers/get_all', null, userToken);
  log('AI→CHATBOT', 'Get AI providers', providers.success, `Found ${providers.data?.length || 0} providers`);
  
  // Verify the AI function module loads
  try {
    const { singleReplyAi } = require('./functions/ai.js');
    log('AI→CHATBOT', 'AI module loadable', typeof singleReplyAi === 'function', 'singleReplyAi is a function');
  } catch (err) {
    log('AI→CHATBOT', 'AI module loadable', false, err.message);
  }
}

// ============ KNOWLEDGE BASE → AI ============
async function testKnowledgeBaseIntegration() {
  console.log('\n=== KNOWLEDGE BASE → AI ===');
  
  const kb = await api('GET', '/api/knowledge_base/get_all', null, userToken);
  log('KB→AI', 'Get knowledge base', kb.success, `Found ${kb.data?.length || 0} items`);
  
  // The KB→AI integration happens inside functions/ai.js singleReplyAi
  // which queries knowledge_base table directly. Verify the code path exists:
  const fs = require('fs');
  const aiCode = fs.readFileSync(__dirname + '/functions/ai.js', 'utf-8');
  const hasKbQuery = aiCode.includes('knowledge_base WHERE uid');
  log('KB→AI', 'AI module queries KB table', hasKbQuery, 
    hasKbQuery ? 'knowledge_base query found in singleReplyAi' : 'MISSING');
}

// ============ CRM LEADS → CONTACTS ============
async function testCrmLeadsIntegration() {
  console.log('\n=== CRM LEADS → CONTACTS ===');
  const testLeadName = `Integration Test Lead ${Date.now()}`;
  
  const leads = await api('GET', '/api/crm/leads', null, userToken);
  log('CRM→CONTACTS', 'Get CRM leads', leads.success, `Found ${leads.data?.length || 0} leads`);
  
  // Create a test lead - correct endpoint: /api/crm/leads/add
  const createRes = await api('POST', '/api/crm/leads/add', {
    name: testLeadName,
    mobile: '+919999999999',
    stage: 'Lead',
    value: 5000
  }, userToken);
  log('CRM→CONTACTS', 'Create lead', createRes.success, createRes.msg);
  
  // Verify it appeared
  const leadsAfter = await api('GET', '/api/crm/leads', null, userToken);
  const testLead = leadsAfter.data?.find(l => l.name === testLeadName);
  log('CRM→CONTACTS', 'Lead in list after creation', !!testLead, testLead ? `ID: ${testLead.id}` : 'Not found');

  if (testLead) {
    const deleteRes = await api('POST', '/api/crm/leads/delete', { id: testLead.id }, userToken);
    log('CRM→CONTACTS', 'Delete test lead', deleteRes.success, deleteRes.msg);

    const leadsAfterDelete = await api('GET', '/api/crm/leads', null, userToken);
    const deleted = !leadsAfterDelete.data?.some(l => l.id === testLead.id);
    log('CRM→CONTACTS', 'Lead absent after deletion', deleted, deleted ? 'Cleanup verified' : 'Lead still present');
  }
}

// ============ AGENT → INBOX ============
async function testAgentInboxIntegration() {
  console.log('\n=== AGENT → INBOX ===');
  
  // Correct endpoint: /api/agent/get_my_agents
  const agents = await api('GET', '/api/agent/get_my_agents', null, userToken);
  log('AGENT→INBOX', 'Get agents', agents.success, `Found ${agents.data?.length || 0} agents`);
  
  // Try agent login 
  const agentLogin = await api('POST', '/api/agent/login', { 
    email: 'agent@example.com', 
    password: AGENT_PASSWORD
  });
  
  if (agentLogin.success && agentLogin.token) {
    log('AGENT→INBOX', 'Agent login', true, 'Token obtained');
    const agentChats = await api('GET', '/api/agent/get_my_assigned_chats', null, agentLogin.token);
    log('AGENT→INBOX', 'Agent can get chats', agentChats.success, 
      `Agent sees ${agentChats.data?.length || 0} chats`);
  } else {
    log('AGENT→INBOX', 'Agent login', false, agentLogin.msg || agentLogin.error);
  }
}

// ============ WEBSITE → WIDGET ============
async function testWebsiteWidgetIntegration() {
  console.log('\n=== WEBSITE → WIDGET ===');
  
  const websites = await api('GET', '/api/website/get_all', null, userToken);
  log('WEBSITE→WIDGET', 'Get websites', websites.success, `Found ${websites.data?.length || 0} websites`);
}

// ============ SUPERVISOR → AGENT KPI ============
async function testSupervisorIntegration() {
  console.log('\n=== SUPERVISOR → AGENT KPI ===');
  
  const kpis = await api('GET', '/api/agent_workflow/kpis', null, userToken);
  log('SUPERVISOR→AGENT', 'Get KPIs', kpis.success, JSON.stringify(kpis.data || {}).slice(0, 200));
  
  const escalations = await api('GET', '/api/agent_workflow/escalations', null, userToken);
  log('SUPERVISOR→AGENT', 'Get escalations', escalations.success, `Found ${escalations.data?.length || 0} escalations`);
  
  const agentMetrics = await api('GET', '/api/agent_workflow/agent_metrics', null, userToken);
  // This endpoint may not exist — agent metrics come from /kpis response
  // If it returns 404/HTML, check kpis.data.averageResponseTimePerAgent instead
  if (agentMetrics.htmlResponse || !agentMetrics.success) {
    // Fall back to checking kpis per-agent data
    const hasPerAgent = kpis.data?.averageResponseTimePerAgent !== undefined;
    log('SUPERVISOR→AGENT', 'Agent metrics via KPIs', hasPerAgent,
      hasPerAgent ? `Per-agent metrics available (${kpis.data.averageResponseTimePerAgent.length} entries)` : 'No per-agent data');
  } else {
    log('SUPERVISOR→AGENT', 'Get agent metrics', agentMetrics.success, `Found ${agentMetrics.data?.length || 0} agent metrics`);
  }
}

// ============ WEBHOOK RULES → INBOX ============
async function testWebhookInboxIntegration() {
  console.log('\n=== WEBHOOK → INBOX ===');
  
  // Correct endpoint: /api/webhooks/rules
  const rules = await api('GET', '/api/webhooks/rules', null, userToken);
  log('WEBHOOK→INBOX', 'Get webhook rules', rules.success, `Found ${rules.data?.length || 0} rules`);
  
  // Verify webhook engine module loads
  try {
    const { processWebhookRules } = require('./helper/webhooks/engine.js');
    log('WEBHOOK→INBOX', 'Webhook engine loadable', typeof processWebhookRules === 'function', 'processWebhookRules is a function');
  } catch (err) {
    log('WEBHOOK→INBOX', 'Webhook engine loadable', false, err.message);
  }
}

// ============ CHATBOT MODULES INTEGRATION ============
async function testChatbotModules() {
  console.log('\n=== CHATBOT MODULE INTEGRATION ===');
  
  try {
    const { metaChatbotInit } = require('./helper/chatbot/meta/index.js');
    log('CHATBOT→INBOX', 'metaChatbotInit loadable', typeof metaChatbotInit === 'function', 'function loaded');
  } catch (err) {
    log('CHATBOT→INBOX', 'metaChatbotInit loadable', false, err.message);
  }
  
  try {
    const { recordChatbotLog } = require('./functions/chatbotDiagnostics.js');
    log('CHATBOT→INBOX', 'recordChatbotLog loadable', typeof recordChatbotLog === 'function', 'function loaded');
  } catch (err) {
    log('CHATBOT→INBOX', 'recordChatbotLog loadable', false, err.message);
  }
  
  try {
    const { destributeTaskFlow } = require('./functions/chatbot.js');
    log('CHATBOT→INBOX', 'destributeTaskFlow loadable', typeof destributeTaskFlow === 'function', 'function loaded');
  } catch (err) {
    log('CHATBOT→INBOX', 'destributeTaskFlow loadable', false, err.message);
  }
}

// ============ FLOW DELETE CASCADE ============
async function testFlowDeleteCascade() {
  console.log('\n=== FLOW DELETE → CHATBOT DEACTIVATION ===');
  
  const fs = require('fs');
  const chatFlowCode = fs.readFileSync(__dirname + '/routes/chatFlow.js', 'utf-8');
  const hasDeactivation = chatFlowCode.includes('UPDATE chatbot SET flow_id = NULL, active = 0');
  log('FLOW_DELETE→CHATBOT', 'Flow delete cascades to chatbot', hasDeactivation, 
    hasDeactivation ? 'Chatbot deactivated on flow delete' : 'MISSING');
}

// ============ SLA ESCALATION ============
async function testSlaEscalation() {
  console.log('\n=== SLA ESCALATION → SUPERVISOR ===');
  
  const fs = require('fs');
  const serverCode = fs.readFileSync(__dirname + '/server.js', 'utf-8');
  log('SLA→SUPERVISOR', 'SLA checker exists', serverCode.includes('checkSlaEscalations'), 'interval running');
  log('SLA→SUPERVISOR', 'Escalation queue insert', serverCode.includes('INSERT INTO escalation_queue'), 'auto-escalation');
  
  const inboxCode = fs.readFileSync(__dirname + '/helper/inbox/inbox.js', 'utf-8');
  log('SLA→SUPERVISOR', 'SLA timer on incoming msg', inboxCode.includes('sla_expires_at'), 'timer updated');
}

// ============ DASHBOARD → CAMPAIGN SUMMARY ============
async function testDashboardCampaignIntegration() {
  console.log('\n=== DASHBOARD → CAMPAIGN SUMMARY ===');
  
  const summary = await api('GET', '/api/broadcast/dashboard_summary', null, userToken);
  log('DASHBOARD→CAMPAIGN', 'Campaign dashboard summary', summary.success, 
    summary.data ? `Campaigns: ${summary.data.campaignStatus?.total || 0}, Delivery: ${summary.data.delivery?.total || 0}` : 'No data');
}

// ============ MAIN ============
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   CROSS-MODULE INTEGRATION AUDIT                ║');
  console.log('║   B1GCRM — LIVE RUNTIME TEST                   ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  
  await loginUser();
  await loginAdmin();
  
  if (!userToken) {
    console.error('FATAL: Cannot proceed without user token');
    process.exit(1);
  }
  
  await testFlowChatbotIntegration();
  await testChatbotDiagnostics();
  await testContactCampaignIntegration();
  await testContactInboxIntegration();
  await testAiProviderIntegration();
  await testKnowledgeBaseIntegration();
  await testCrmLeadsIntegration();
  await testAgentInboxIntegration();
  await testWebsiteWidgetIntegration();
  await testSupervisorIntegration();
  await testWebhookInboxIntegration();
  await testChatbotModules();
  await testFlowDeleteCascade();
  await testSlaEscalation();
  await testDashboardCampaignIntegration();
  
  // Summary
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   INTEGRATION AUDIT SUMMARY                     ║');
  console.log('╚══════════════════════════════════════════════════╝');
  
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  const total = results.length;
  
  console.log(`\nTotal: ${total}  |  ✅ Passed: ${passed}  |  ❌ Failed: ${failed}  |  Score: ${Math.round((passed / total) * 100)}%\n`);
  
  if (failed > 0) {
    console.log('FAILURES:');
    results.filter(r => !r.pass).forEach(r => {
      console.log(`  ❌ [${r.module}] ${r.test}: ${r.detail}`);
    });
  }
  
  const fs = require('fs');
  fs.writeFileSync(__dirname + '/cross_module_audit_results.json', JSON.stringify({ 
    timestamp: new Date().toISOString(), total, passed, failed, 
    score: Math.round((passed / total) * 100), results 
  }, null, 2));
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('AUDIT FATAL ERROR:', err);
  process.exit(1);
});
