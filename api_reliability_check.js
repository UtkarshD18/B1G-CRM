const axios = require("axios");
const fs = require("fs");

const BASE_URL = "http://localhost:3010/api";
let userToken = "";
let adminToken = "";

async function login() {
  // Login as User
  const userLogin = await axios.post(`${BASE_URL}/user/login`, {
    email: "user@example.com",
    password: "<PASSWORD>",
  });
  userToken = userLogin.data.token;

  // Login as Admin
  const adminLogin = await axios.post(`${BASE_URL}/admin/login`, {
    email: "admin@example.com",
    password: "<PASSWORD>",
  });
  adminToken = adminLogin.data.token;
}

const report = [];

function logTest(category, route, method, pathType, inputPayload, responseStatus, responseData) {
  const isOk =
    pathType === "success"
      ? (responseStatus === 200 && (responseData.success === true || responseData.success === 1 || responseData.data !== undefined || responseData.msg === undefined || !responseData.msg.toLowerCase().includes("something went wrong")))
      : pathType === "validation"
      ? (responseData.success === false || responseData.success === 0 || (responseData.msg && responseData.msg.toLowerCase().includes("missing")) || responseData.errors !== undefined || responseData.msg !== undefined)
      : (responseData.logout === true || responseData.success === 0 || responseData.success === false || responseStatus >= 400 || (responseData.msg && responseData.msg.toLowerCase().includes("invalid")) || responseData.msg === "Unauthorized token");

  report.push({
    category,
    route,
    method,
    pathType,
    inputPayload,
    status: responseStatus,
    data: responseData,
    passed: !!isOk,
  });
  console.log(`[${category}] ${method} ${route} (${pathType}) -> Status: ${responseStatus}, Passed: ${isOk}`);
}

async function runTests() {
  await login();
  console.log("Logged in successfully. Starting endpoint audits...");

  const userHeaders = { Authorization: `Bearer ${userToken}` };
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  const invalidHeaders = { Authorization: `Bearer invalid_token` };

  // ==================== WEBHOOKS ====================
  // 1. GET /webhooks/rules
  try {
    const res = await axios.get(`${BASE_URL}/webhooks/rules`, { headers: userHeaders });
    logTest("Webhooks", "/webhooks/rules", "GET", "success", null, res.status, res.data);
  } catch (err) {
    logTest("Webhooks", "/webhooks/rules", "GET", "success", null, err.response?.status || 500, err.response?.data || {});
  }
  // GET /webhooks/rules (Error Path: Invalid Token)
  try {
    const res = await axios.get(`${BASE_URL}/webhooks/rules`, { headers: invalidHeaders });
    logTest("Webhooks", "/webhooks/rules", "GET", "error", null, res.status, res.data);
  } catch (err) {
    logTest("Webhooks", "/webhooks/rules", "GET", "error", null, err.response?.status || 500, err.response?.data || {});
  }

  // 2. POST /webhooks/rules
  const validRule = {
    name: "Test Audit Rule",
    source: "external",
    event_type: "message",
    match_field: "body.text",
    match_operator: "contains",
    match_value: "hello",
    action_type: "tag_chat",
    action_payload: "AuditTag",
    active: 1
  };
  let createdRuleId = null;
  try {
    const res = await axios.post(`${BASE_URL}/webhooks/rules`, validRule, { headers: userHeaders });
    if (res.data.success) createdRuleId = res.data.id || (res.data.data && res.data.data.id);
    // Wait, the API returns the rule ID or rules list. Let's see the response
    logTest("Webhooks", "/webhooks/rules", "POST", "success", validRule, res.status, res.data);
  } catch (err) {
    logTest("Webhooks", "/webhooks/rules", "POST", "success", validRule, err.response?.status || 500, err.response?.data || {});
  }
  // POST /webhooks/rules (Validation Path: Missing name)
  const invalidRule = { ...validRule, name: "" };
  try {
    const res = await axios.post(`${BASE_URL}/webhooks/rules`, invalidRule, { headers: userHeaders });
    logTest("Webhooks", "/webhooks/rules", "POST", "validation", invalidRule, res.status, res.data);
  } catch (err) {
    logTest("Webhooks", "/webhooks/rules", "POST", "validation", invalidRule, err.response?.status || 500, err.response?.data || {});
  }

  // ==================== TEMPLATES ====================
  // 1. GET /templet/get_templets
  try {
    const res = await axios.get(`${BASE_URL}/templet/get_templets`, { headers: userHeaders });
    logTest("Templates", "/templet/get_templets", "GET", "success", null, res.status, res.data);
  } catch (err) {
    logTest("Templates", "/templet/get_templets", "GET", "success", null, err.response?.status || 500, err.response?.data || {});
  }

  // 2. POST /templet/add_new
  const validTemplate = {
    title: "Test Audit Template",
    type: "text",
    content: "This is a test audit template content."
  };
  let createdTemplateId = null;
  try {
    const res = await axios.post(`${BASE_URL}/templet/add_new`, validTemplate, { headers: userHeaders });
    if (res.data.success && res.data.data) {
      createdTemplateId = res.data.data.id;
    } else if (res.data.success) {
      // Find created template id by fetching templates list
      const list = await axios.get(`${BASE_URL}/templet/get_templets`, { headers: userHeaders });
      const found = list.data.data?.find(t => t.title === validTemplate.title);
      if (found) createdTemplateId = found.id;
    }
    logTest("Templates", "/templet/add_new", "POST", "success", validTemplate, res.status, res.data);
  } catch (err) {
    logTest("Templates", "/templet/add_new", "POST", "success", validTemplate, err.response?.status || 500, err.response?.data || {});
  }
  // POST /templet/add_new (Validation Path: Missing content)
  const invalidTemplate = { ...validTemplate, content: "" };
  try {
    const res = await axios.post(`${BASE_URL}/templet/add_new`, invalidTemplate, { headers: userHeaders });
    logTest("Templates", "/templet/add_new", "POST", "validation", invalidTemplate, res.status, res.data);
  } catch (err) {
    logTest("Templates", "/templet/add_new", "POST", "validation", invalidTemplate, err.response?.status || 500, err.response?.data || {});
  }

  // 3. POST /templet/update
  if (createdTemplateId) {
    const updatePayload = {
      id: createdTemplateId,
      title: "Updated Audit Template",
      type: "text",
      content: "Updated content details."
    };
    try {
      const res = await axios.post(`${BASE_URL}/templet/update`, updatePayload, { headers: userHeaders });
      logTest("Templates", "/templet/update", "POST", "success", updatePayload, res.status, res.data);
    } catch (err) {
      logTest("Templates", "/templet/update", "POST", "success", updatePayload, err.response?.status || 500, err.response?.data || {});
    }
  }
  // POST /templet/update (Validation Path: Missing fields)
  try {
    const res = await axios.post(`${BASE_URL}/templet/update`, { id: createdTemplateId || 9999 }, { headers: userHeaders });
    logTest("Templates", "/templet/update", "POST", "validation", {}, res.status, res.data);
  } catch (err) {
    logTest("Templates", "/templet/update", "POST", "validation", {}, err.response?.status || 500, err.response?.data || {});
  }

  // ==================== CHATBOTS ====================
  // 1. GET /chatbot/get_chatbot
  try {
    const res = await axios.get(`${BASE_URL}/chatbot/get_chatbot`, { headers: userHeaders });
    logTest("Chatbots", "/chatbot/get_chatbot", "GET", "success", null, res.status, res.data);
  } catch (err) {
    logTest("Chatbots", "/chatbot/get_chatbot", "GET", "success", null, err.response?.status || 500, err.response?.data || {});
  }

  // 2. POST /chatbot/add_chatbot
  const validBot = {
    title: "Audit Test Bot",
    flow_id: "test-flow-id",
    for_all: 1
  };
  let createdBotId = null;
  try {
    const res = await axios.post(`${BASE_URL}/chatbot/add_chatbot`, validBot, { headers: userHeaders });
    if (res.data.success) {
      const bots = await axios.get(`${BASE_URL}/chatbot/get_chatbot`, { headers: userHeaders });
      const found = bots.data.data?.find(b => b.title === validBot.title);
      if (found) createdBotId = found.id;
    }
    logTest("Chatbots", "/chatbot/add_chatbot", "POST", "success", validBot, res.status, res.data);
  } catch (err) {
    logTest("Chatbots", "/chatbot/add_chatbot", "POST", "success", validBot, err.response?.status || 500, err.response?.data || {});
  }
  // POST /chatbot/add_chatbot (Validation Path: Missing title)
  try {
    const res = await axios.post(`${BASE_URL}/chatbot/add_chatbot`, { flow_id: "test" }, { headers: userHeaders });
    logTest("Chatbots", "/chatbot/add_chatbot", "POST", "validation", {}, res.status, res.data);
  } catch (err) {
    logTest("Chatbots", "/chatbot/add_chatbot", "POST", "validation", {}, err.response?.status || 500, err.response?.data || {});
  }

  // ==================== FLOWS ====================
  // 1. GET /chat_flow/get_mine
  try {
    const res = await axios.get(`${BASE_URL}/chat_flow/get_mine`, { headers: userHeaders });
    logTest("Flows", "/chat_flow/get_mine", "GET", "success", null, res.status, res.data);
  } catch (err) {
    logTest("Flows", "/chat_flow/get_mine", "GET", "success", null, err.response?.status || 500, err.response?.data || {});
  }

  // 2. POST /chat_flow/add_new
  const validFlow = {
    title: "Audit Test Flow",
    flowId: "audit-test-flow-id-" + Date.now(),
    nodes: [],
    edges: []
  };
  let createdFlowDbId = null;
  try {
    const res = await axios.post(`${BASE_URL}/chat_flow/add_new`, validFlow, { headers: userHeaders });
    if (res.data.success) {
      const list = await axios.get(`${BASE_URL}/chat_flow/get_mine`, { headers: userHeaders });
      const found = list.data.data?.find(f => f.title === validFlow.title);
      if (found) createdFlowDbId = found.id;
    }
    logTest("Flows", "/chat_flow/add_new", "POST", "success", validFlow, res.status, res.data);
  } catch (err) {
    logTest("Flows", "/chat_flow/add_new", "POST", "success", validFlow, err.response?.status || 500, err.response?.data || {});
  }
  // POST /chat_flow/add_new (Validation Path: Missing title)
  try {
    const res = await axios.post(`${BASE_URL}/chat_flow/add_new`, { flowId: "missing-title" }, { headers: userHeaders });
    logTest("Flows", "/chat_flow/add_new", "POST", "validation", {}, res.status, res.data);
  } catch (err) {
    logTest("Flows", "/chat_flow/add_new", "POST", "validation", {}, err.response?.status || 500, err.response?.data || {});
  }

  // ==================== CAMPAIGNS ====================
  // 1. GET /broadcast/dashboard_summary
  try {
    const res = await axios.get(`${BASE_URL}/broadcast/dashboard_summary`, { headers: userHeaders });
    logTest("Campaigns", "/broadcast/dashboard_summary", "GET", "success", null, res.status, res.data);
  } catch (err) {
    logTest("Campaigns", "/broadcast/dashboard_summary", "GET", "success", null, err.response?.status || 500, err.response?.data || {});
  }

  // 2. GET /broadcast/get_broadcast
  try {
    const res = await axios.get(`${BASE_URL}/broadcast/get_broadcast`, { headers: userHeaders });
    logTest("Campaigns", "/broadcast/get_broadcast", "GET", "success", null, res.status, res.data);
  } catch (err) {
    logTest("Campaigns", "/broadcast/get_broadcast", "GET", "success", null, err.response?.status || 500, err.response?.data || {});
  }

  // 3. POST /broadcast/add_new (Validation Path: Missing fields)
  try {
    const res = await axios.post(`${BASE_URL}/broadcast/add_new`, {}, { headers: userHeaders });
    logTest("Campaigns", "/broadcast/add_new", "POST", "validation", {}, res.status, res.data);
  } catch (err) {
    logTest("Campaigns", "/broadcast/add_new", "POST", "validation", {}, err.response?.status || 500, err.response?.data || {});
  }

  // ==================== QR ====================
  // 1. GET /qr/get_all
  try {
    const res = await axios.get(`${BASE_URL}/qr/get_all`, { headers: userHeaders });
    logTest("QR", "/qr/get_all", "GET", "success", null, res.status, res.data);
  } catch (err) {
    logTest("QR", "/qr/get_all", "GET", "success", null, err.response?.status || 500, err.response?.data || {});
  }

  // 2. POST /qr/gen_qr (Validation Path: Missing title)
  try {
    const res = await axios.post(`${BASE_URL}/qr/gen_qr`, {}, { headers: userHeaders });
    logTest("QR", "/qr/gen_qr", "POST", "validation", {}, res.status, res.data);
  } catch (err) {
    logTest("QR", "/qr/gen_qr", "POST", "validation", {}, err.response?.status || 500, err.response?.data || {});
  }

  // ==================== INBOX ====================
  // 1. GET /inbox/get_chats
  try {
    const res = await axios.get(`${BASE_URL}/inbox/get_chats`, { headers: userHeaders });
    logTest("Inbox", "/inbox/get_chats", "GET", "success", null, res.status, res.data);
  } catch (err) {
    logTest("Inbox", "/inbox/get_chats", "GET", "success", null, err.response?.status || 500, err.response?.data || {});
  }

  // 2. POST /inbox/get_convo (Validation Path: Missing mobile)
  try {
    const res = await axios.post(`${BASE_URL}/inbox/get_convo`, {}, { headers: userHeaders });
    logTest("Inbox", "/inbox/get_convo", "POST", "validation", {}, res.status, res.data);
  } catch (err) {
    logTest("Inbox", "/inbox/get_convo", "POST", "validation", {}, err.response?.status || 500, err.response?.data || {});
  }

  // 3. POST /inbox/send_text (Validation Path: Missing fields)
  try {
    const res = await axios.post(`${BASE_URL}/inbox/send_text`, {}, { headers: userHeaders });
    logTest("Inbox", "/inbox/send_text", "POST", "validation", {}, res.status, res.data);
  } catch (err) {
    logTest("Inbox", "/inbox/send_text", "POST", "validation", {}, err.response?.status || 500, err.response?.data || {});
  }

  // ==================== CLEANUP OPERATIONS ====================
  // Cleanup template
  if (createdTemplateId) {
    try {
      const res = await axios.post(`${BASE_URL}/templet/del_templets`, { selected: [createdTemplateId] }, { headers: userHeaders });
      logTest("Templates", "/templet/del_templets", "POST", "success", { selected: [createdTemplateId] }, res.status, res.data);
    } catch (err) {
      console.log("Template cleanup failed:", err.message);
    }
  }

  // Cleanup chatbot
  if (createdBotId) {
    try {
      const res = await axios.post(`${BASE_URL}/chatbot/del_chatbot`, { id: createdBotId }, { headers: userHeaders });
      logTest("Chatbots", "/chatbot/del_chatbot", "POST", "success", { id: createdBotId }, res.status, res.data);
    } catch (err) {
      console.log("Chatbot cleanup failed:", err.message);
    }
  }

  // Cleanup flow
  if (createdFlowDbId) {
    try {
      const res = await axios.post(`${BASE_URL}/chat_flow/del_flow`, { id: createdFlowDbId, flowId: validFlow.flowId }, { headers: userHeaders });
      logTest("Flows", "/chat_flow/del_flow", "POST", "success", { id: createdFlowDbId }, res.status, res.data);
    } catch (err) {
      console.log("Flow cleanup failed:", err.message);
    }
  }

  fs.writeFileSync("api_reliability_report.json", JSON.stringify(report, null, 2));
  console.log("Saved API reliability audit report to api_reliability_report.json");
}

runTests().catch(err => {
  console.error("Test execution run failure:", err);
  process.exit(1);
});
