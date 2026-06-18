const axios = require("axios");
const fs = require("fs");

const BASE_URL = "http://localhost:3010/api";
let tenant1Token = "";
let tenant2Token = "";
let tenant1Uid = "local-user-uid"; // User 1 email: user@example.com (from setup/schema)
let tenant2Uid = ""; // User 2 email: user2@example.com

async function setupTenants() {
  // 1. Create or log in Tenant 1
  try {
    const res1 = await axios.post(`${BASE_URL}/user/login`, {
      email: "user@example.com",
      password: "User@123"
    });
    tenant1Token = res1.data.token;
  } catch (err) {
    console.error("Tenant 1 login failed:", err.message);
  }

  // 2. Signup & Login Tenant 2
  const tenant2Email = `tenant2_${Date.now()}@example.com`;
  try {
    await axios.post(`${BASE_URL}/user/signup`, {
      name: "Tenant Two",
      email: tenant2Email,
      password: "Password@123",
      mobile_with_country_code: "9876543210",
      acceptPolicy: true
    });
    const res2 = await axios.post(`${BASE_URL}/user/login`, {
      email: tenant2Email,
      password: "Password@123"
    });
    tenant2Token = res2.data.token;

    // Get Tenant 2 profile details to fetch their UID
    const profileRes = await axios.get(`${BASE_URL}/user/get_me`, {
      headers: { Authorization: `Bearer ${tenant2Token}` }
    });
    tenant2Uid = profileRes.data.uid || profileRes.data.data?.uid;
    console.log(`Tenant 2 Setup complete. Email: ${tenant2Email}, UID: ${tenant2Uid}`);
  } catch (err) {
    console.error("Tenant 2 Setup failed:", err.message);
  }
}

const auditResults = [];

function logTest(attackType, endpoint, payload, expectedOutcome, actualResponse, passed) {
  auditResults.push({
    attackType,
    endpoint,
    payload,
    expectedOutcome,
    actualResponseStatus: actualResponse?.status,
    actualResponseData: actualResponse?.data,
    passed
  });
  console.log(`[${passed ? "PASS" : "FAIL"}] ${attackType} on ${endpoint}`);
}

async function runAdversarialAudit() {
  await setupTenants();

  const t1Headers = { Authorization: `Bearer ${tenant1Token}` };
  const t2Headers = { Authorization: `Bearer ${tenant2Token}` };

  // ==================== 1. Webhook Rules Ownership Bypass ====================
  console.log("\nAuditing Webhook Rules Ownership...");
  // Tenant 1 creates a webhook rule
  let t1RuleId = null;
  try {
    const res = await axios.post(`${BASE_URL}/webhooks/rules`, {
      name: "Tenant 1 Rule",
      source: "external",
      event_type: "message",
      match_field: "body.text",
      match_operator: "contains",
      match_value: "test",
      action_type: "tag_chat",
      action_payload: JSON.stringify({ tag: "test" }),
      active: 1
    }, { headers: t1Headers });
    t1RuleId = res.data.id || res.data.data?.id || (await axios.get(`${BASE_URL}/webhooks/rules`, { headers: t1Headers })).data.data?.[0]?.id;
    console.log("Tenant 1 created webhook rule ID:", t1RuleId);
  } catch (err) {
    console.error("Tenant 1 webhook rule creation failed:", err.message);
  }

  if (t1RuleId) {
    // Attack 1: Tenant 2 attempts to update Tenant 1's webhook rule
    try {
      const res = await axios.post(`${BASE_URL}/webhooks/rules/update`, {
        id: t1RuleId,
        name: "Hacked Rule",
        source: "external",
        event_type: "message",
        match_field: "body.text",
        match_operator: "contains",
        match_value: "hacked",
        action_type: "tag_chat",
        action_payload: JSON.stringify({ tag: "hacked" }),
        active: 1
      }, { headers: t2Headers });
      // The API should fail to update (affected rows < 1, or returns success: false)
      const passed = res.data.success === false || res.data.msg?.toLowerCase().includes("not found") || res.data.data === undefined;
      logTest("Cross-Tenant Rule Update", "/webhooks/rules/update", { id: t1RuleId }, "Fail to update rule", res, passed);
    } catch (err) {
      logTest("Cross-Tenant Rule Update", "/webhooks/rules/update", { id: t1RuleId }, "Fail to update rule", err.response, true);
    }

    // Attack 2: Tenant 2 attempts to delete Tenant 1's webhook rule
    try {
      const res = await axios.post(`${BASE_URL}/webhooks/rules/delete`, { id: t1RuleId }, { headers: t2Headers });
      const passed = res.data.success === false || res.data.msg?.toLowerCase().includes("not found");
      logTest("Cross-Tenant Rule Delete", "/webhooks/rules/delete", { id: t1RuleId }, "Fail to delete rule", res, passed);
    } catch (err) {
      logTest("Cross-Tenant Rule Delete", "/webhooks/rules/delete", { id: t1RuleId }, "Fail to delete rule", err.response, true);
    }
  }

  // ==================== 2. Templates Ownership Bypass ====================
  console.log("\nAuditing Templates Ownership...");
  // Tenant 1 creates a template
  let t1TemplateId = null;
  try {
    const res = await axios.post(`${BASE_URL}/templet/add_new`, {
      title: "Tenant 1 Temp",
      type: "text",
      content: "Hello T1 content"
    }, { headers: t1Headers });
    const list = await axios.get(`${BASE_URL}/templet/get_templets`, { headers: t1Headers });
    t1TemplateId = list.data.data?.find(t => t.title === "Tenant 1 Temp")?.id;
    console.log("Tenant 1 created template ID:", t1TemplateId);
  } catch (err) {
    console.error("Tenant 1 template creation failed:", err.message);
  }

  if (t1TemplateId) {
    // Attack 1: Tenant 2 attempts to update Tenant 1's template
    try {
      const res = await axios.post(`${BASE_URL}/templet/update`, {
        id: t1TemplateId,
        title: "Hacked Template",
        type: "text",
        content: "Hacked Content"
      }, { headers: t2Headers });
      const passed = res.data.success === false || res.data.msg?.toLowerCase().includes("not found");
      logTest("Cross-Tenant Template Update", "/templet/update", { id: t1TemplateId }, "Fail to update template", res, passed);
    } catch (err) {
      logTest("Cross-Tenant Template Update", "/templet/update", { id: t1TemplateId }, "Fail to update template", err.response, true);
    }

    // Attack 2: Tenant 2 attempts to delete Tenant 1's template
    try {
      const res = await axios.post(`${BASE_URL}/templet/del_templets`, { selected: [t1TemplateId] }, { headers: t2Headers });
      // Since it filters by uid, affected rows should be 0 and database template should still exist
      // Let's see what the endpoint returns
      const listAfterAttack = await axios.get(`${BASE_URL}/templet/get_templets`, { headers: t1Headers });
      const exists = listAfterAttack.data.data?.some(t => t.id === t1TemplateId);
      logTest("Cross-Tenant Template Delete", "/templet/del_templets", { selected: [t1TemplateId] }, "Template persists in T1's list", res, exists);
    } catch (err) {
      logTest("Cross-Tenant Template Delete", "/templet/del_templets", { selected: [t1TemplateId] }, "Template persists", err.response, true);
    }
  }

  // ==================== 3. Chatbots Ownership Bypass ====================
  console.log("\nAuditing Chatbots Ownership...");
  // Tenant 1 creates a flow first, then a chatbot using that flow
  let t1BotId = null;
  let t1FlowId = "t1-flow-id-" + Date.now();
  try {
    // Save a flow for Tenant 1
    await axios.post(`${BASE_URL}/chat_flow/add_new`, {
      title: "T1 Flow",
      flowId: t1FlowId,
      nodes: [],
      edges: []
    }, { headers: t1Headers });

    const chatbotPayload = {
      title: "T1 Bot",
      flow: { flow_id: t1FlowId, title: "T1 Flow" },
      for_all: 1,
      chats: [],
      origin: { title: "Meta", code: "META", data: {} }
    };

    const res = await axios.post(`${BASE_URL}/chatbot/add_chatbot`, chatbotPayload, { headers: t1Headers });
    const list = await axios.get(`${BASE_URL}/chatbot/get_chatbot`, { headers: t1Headers });
    t1BotId = list.data.data?.find(b => b.title === "T1 Bot")?.id;
    console.log("Tenant 1 created chatbot ID:", t1BotId);
  } catch (err) {
    console.error("Tenant 1 chatbot creation failed:", err.message);
  }

  if (t1BotId) {
    // Attack 1: Tenant 2 attempts to update Tenant 1's chatbot
    try {
      const res = await axios.post(`${BASE_URL}/chatbot/update_chatbot`, {
        id: t1BotId,
        title: "Hacked Bot",
        flow: { flow_id: t1FlowId, title: "T1 Flow" },
        for_all: 1,
        chats: [],
        origin: { title: "Meta", code: "META", data: {} }
      }, { headers: t2Headers });
      const passed = res.data.success === false || res.data.msg?.toLowerCase().includes("not found");
      logTest("Cross-Tenant Chatbot Update", "/chatbot/update_chatbot", { id: t1BotId }, "Fail to update chatbot", res, passed);
    } catch (err) {
      logTest("Cross-Tenant Chatbot Update", "/chatbot/update_chatbot", { id: t1BotId }, "Fail to update chatbot", err.response, true);
    }

    // Attack 2: Tenant 2 attempts to delete Tenant 1's chatbot
    try {
      const res = await axios.post(`${BASE_URL}/chatbot/del_chatbot`, { id: t1BotId }, { headers: t2Headers });
      const listAfterAttack = await axios.get(`${BASE_URL}/chatbot/get_chatbot`, { headers: t1Headers });
      const exists = listAfterAttack.data.data?.some(b => b.id === t1BotId);
      logTest("Cross-Tenant Chatbot Delete", "/chatbot/del_chatbot", { id: t1BotId }, "Chatbot persists in T1's list", res, exists);
    } catch (err) {
      logTest("Cross-Tenant Chatbot Delete", "/chatbot/del_chatbot", { id: t1BotId }, "Chatbot persists", err.response, true);
    }
  }

  // ==================== 4. Chat Flows Ownership Bypass ====================
  console.log("\nAuditing Chat Flows Ownership...");
  if (t1FlowId) {
    // Attack 1: Tenant 2 attempts to delete Tenant 1's flow
    try {
      const listBeforeAttack = await axios.get(`${BASE_URL}/chat_flow/get_mine`, { headers: t1Headers });
      const flowDbId = listBeforeAttack.data.data?.find(f => f.flow_id === t1FlowId)?.id;

      const res = await axios.post(`${BASE_URL}/chat_flow/del_flow`, {
        id: flowDbId,
        flowId: t1FlowId
      }, { headers: t2Headers });

      const listAfterAttack = await axios.get(`${BASE_URL}/chat_flow/get_mine`, { headers: t1Headers });
      const exists = listAfterAttack.data.data?.some(f => f.flow_id === t1FlowId);
      logTest("Cross-Tenant Flow Delete", "/chat_flow/del_flow", { flowId: t1FlowId }, "Flow persists in T1's list", res, exists);
    } catch (err) {
      logTest("Cross-Tenant Flow Delete", "/chat_flow/del_flow", { flowId: t1FlowId }, "Flow persists", err.response, true);
    }
  }

  // ==================== 5. Contacts / Phonebooks Ownership Bypass ====================
  console.log("\nAuditing Contacts & Phonebooks Ownership...");
  let t1PhonebookId = null;
  let t1ContactId = null;
  try {
    const pbRes = await axios.post(`${BASE_URL}/phonebook/add`, { name: "T1 Phonebook" }, { headers: t1Headers });
    const pbList = await axios.get(`${BASE_URL}/phonebook/get_by_uid`, { headers: t1Headers });
    t1PhonebookId = pbList.data.data?.find(p => p.name === "T1 Phonebook")?.id;

    const contactRes = await axios.post(`${BASE_URL}/phonebook/add_single_contact`, {
      name: "T1 Contact",
      mobile: "1234567890",
      id: t1PhonebookId,
      phonebook_name: "T1 Phonebook"
    }, { headers: t1Headers });
    
    // We retrieve contacts list
    const contactList = await axios.get(`${BASE_URL}/phonebook/get_by_uid`, { headers: t1Headers });
    // Let's query db or get contact list. Wait, is there a get_contacts or get_contacts_by_pb route?
    // Let's verify route /phonebook/get_contacts
    const pbContacts = await axios.get(`${BASE_URL}/phonebook/get_by_uid`, { headers: t1Headers });
    // Let's fetch using postgres directly to be simple or find from contacts table
    console.log("Tenant 1 created PB ID:", t1PhonebookId);
  } catch (err) {
    console.error("Tenant 1 PB/Contact creation failed:", err.message);
  }

  // To find contact ID, query DB or let's use the local pg query client to retrieve the ID of contact
  const { Client } = require("pg");
  const dbClient = new Client({
    host: "127.0.0.1",
    port: 5432,
    user: "b1gcrm",
    password: "b1gcrm_local_dev",
    database: "b1gcrm"
  });
  await dbClient.connect();
  const dbContacts = await dbClient.query("SELECT id FROM contact WHERE name = 'T1 Contact' AND uid = 'local-user-uid'");
  if (dbContacts.rows.length > 0) {
    t1ContactId = dbContacts.rows[0].id;
  }
  await dbClient.end();

  if (t1PhonebookId && t1ContactId) {
    // Attack 1: Tenant 2 attempts to rename Tenant 1's phonebook
    try {
      const res = await axios.post(`${BASE_URL}/phonebook/update`, {
        id: t1PhonebookId,
        name: "Hacked Phonebook"
      }, { headers: t2Headers });
      const passed = res.data.success === false;
      logTest("Cross-Tenant PB Rename", "/phonebook/update", { id: t1PhonebookId }, "Fail to update phonebook", res, passed);
    } catch (err) {
      logTest("Cross-Tenant PB Rename", "/phonebook/update", { id: t1PhonebookId }, "Fail to update phonebook", err.response, true);
    }

    // Attack 2: Tenant 2 attempts to edit Tenant 1's contact
    try {
      const res = await axios.post(`${BASE_URL}/phonebook/update_contact`, {
        id: t1ContactId,
        name: "Hacked Contact",
        mobile: "9999999999"
      }, { headers: t2Headers });
      const passed = res.data.success === false;
      logTest("Cross-Tenant Contact Edit", "/phonebook/update_contact", { id: t1ContactId }, "Fail to update contact", res, passed);
    } catch (err) {
      logTest("Cross-Tenant Contact Edit", "/phonebook/update_contact", { id: t1ContactId }, "Fail to update contact", err.response, true);
    }

    // Attack 3: Tenant 2 attempts to delete Tenant 1's contact
    try {
      const res = await axios.post(`${BASE_URL}/phonebook/del_contacts`, { selected: [t1ContactId] }, { headers: t2Headers });
      // Verify persistence directly via DB
      const pgClient = new Client({
        host: "127.0.0.1",
        port: 5432,
        user: "b1gcrm",
        password: "b1gcrm_local_dev",
        database: "b1gcrm"
      });
      await pgClient.connect();
      const verifyRow = await pgClient.query("SELECT * FROM contact WHERE id = $1", [t1ContactId]);
      await pgClient.end();
      logTest("Cross-Tenant Contact Delete", "/phonebook/del_contacts", { selected: [t1ContactId] }, "Contact persists in DB", res, verifyRow.rows.length > 0);
    } catch (err) {
      logTest("Cross-Tenant Contact Delete", "/phonebook/del_contacts", { selected: [t1ContactId] }, "Contact persists", err.response, true);
    }

    // Attack 4: Tenant 2 attempts to delete Tenant 1's phonebook
    try {
      const res = await axios.post(`${BASE_URL}/phonebook/del_phonebook`, { id: t1PhonebookId }, { headers: t2Headers });
      const pgClient = new Client({
        host: "127.0.0.1",
        port: 5432,
        user: "b1gcrm",
        password: "b1gcrm_local_dev",
        database: "b1gcrm"
      });
      await pgClient.connect();
      const verifyPb = await pgClient.query("SELECT * FROM phonebook WHERE id = $1", [t1PhonebookId]);
      await pgClient.end();
      logTest("Cross-Tenant PB Delete", "/phonebook/del_phonebook", { id: t1PhonebookId }, "Phonebook persists in DB", res, verifyPb.rows.length > 0);
    } catch (err) {
      logTest("Cross-Tenant PB Delete", "/phonebook/del_phonebook", { id: t1PhonebookId }, "Phonebook persists", err.response, true);
    }
  }

  // ==================== 6. Agent Management Ownership Bypass ====================
  console.log("\nAuditing Agent Management Ownership...");
  let t1AgentUid = null;
  let t1TaskId = null;
  try {
    const res = await axios.post(`${BASE_URL}/agent/add_agent`, {
      name: "T1 Agent",
      password: "AgentPassword@123",
      email: `t1agent_${Date.now()}@example.com`,
      mobile: "1112223333",
      comments: "T1 comments"
    }, { headers: t1Headers });

    const list = await axios.get(`${BASE_URL}/agent/get_my_agents`, { headers: t1Headers });
    t1AgentUid = list.data.data?.find(a => a.name === "T1 Agent")?.uid;

    const taskRes = await axios.post(`${BASE_URL}/user/add_task_for_agent`, {
      title: "T1 Task",
      des: "Do task details",
      agent_uid: t1AgentUid
    }, { headers: t1Headers });
    const taskList = await axios.get(`${BASE_URL}/user/get_my_agent_tasks`, { headers: t1Headers });
    t1TaskId = taskList.data.data?.find(t => t.title === "T1 Task")?.id;

    console.log(`Tenant 1 created Agent UID: ${t1AgentUid}, Task ID: ${t1TaskId}`);
  } catch (err) {
    console.error("Tenant 1 Agent/Task creation failed:", err.message);
  }

  if (t1AgentUid && t1TaskId) {
    // Attack 1: Tenant 2 attempts to change Tenant 1's agent activeness status
    try {
      const res = await axios.post(`${BASE_URL}/agent/change_agent_activeness`, {
        agentUid: t1AgentUid,
        activeness: 0
      }, { headers: t2Headers });
      // Wait, let's see if is_active changes in database or if it gets updated.
      // Wait, let's inspect the agents list for T1
      const listAfterAttack = await axios.get(`${BASE_URL}/agent/get_my_agents`, { headers: t1Headers });
      const agent = listAfterAttack.data.data?.find(a => a.uid === t1AgentUid);
      const passed = agent?.is_active === 1; // It should still be active (1) because change_agent_activeness route lacks owner_uid matching!
      logTest("Cross-Tenant Agent Activeness Update", "/agent/change_agent_activeness", { agentUid: t1AgentUid }, "Agent remains active", res, passed);
    } catch (err) {
      logTest("Cross-Tenant Agent Activeness Update", "/agent/change_agent_activeness", { agentUid: t1AgentUid }, "Agent remains active", err.response, true);
    }

    // Attack 2: Tenant 2 attempts to update agent assignments in chat (assigning T1 agent to a chat)
    try {
      const res = await axios.post(`${BASE_URL}/agent/update_agent_in_chat`, {
        assignAgent: { uid: t1AgentUid, email: "agent@example.com" },
        chatId: "any-chat-id",
        agentUid: t1AgentUid
      }, { headers: t2Headers });
      // Wait, let's check what happened or if this endpoint verifies that the agent belongs to Tenant 2
      // Let's log outcome
      logTest("Cross-Tenant Agent Assignment update_agent_in_chat", "/agent/update_agent_in_chat", { agentUid: t1AgentUid }, "Ownership verification check", res, res.data.success === false);
    } catch (err) {
      logTest("Cross-Tenant Agent Assignment update_agent_in_chat", "/agent/update_agent_in_chat", { agentUid: t1AgentUid }, "Ownership check", err.response, true);
    }

    // Attack 3: Tenant 2 attempts to delete Tenant 1's agent
    try {
      const res = await axios.post(`${BASE_URL}/agent/del_agent`, { uid: t1AgentUid }, { headers: t2Headers });
      const listAfterAttack = await axios.get(`${BASE_URL}/agent/get_my_agents`, { headers: t1Headers });
      const exists = listAfterAttack.data.data?.some(a => a.uid === t1AgentUid);
      logTest("Cross-Tenant Agent Delete", "/agent/del_agent", { uid: t1AgentUid }, "Agent persists in T1's list", res, exists);
    } catch (err) {
      logTest("Cross-Tenant Agent Delete", "/agent/del_agent", { uid: t1AgentUid }, "Agent persists", err.response, true);
    }

    // Attack 4: Tenant 2 attempts to delete Tenant 1's agent task
    try {
      const res = await axios.post(`${BASE_URL}/user/del_task_for_agent`, { id: t1TaskId }, { headers: t2Headers });
      const listAfterAttack = await axios.get(`${BASE_URL}/user/get_my_agent_tasks`, { headers: t1Headers });
      const exists = listAfterAttack.data.data?.some(t => t.id === t1TaskId);
      logTest("Cross-Tenant Task Delete", "/user/del_task_for_agent", { id: t1TaskId }, "Task persists in T1's list", res, exists);
    } catch (err) {
      logTest("Cross-Tenant Task Delete", "/user/del_task_for_agent", { id: t1TaskId }, "Task persists", err.response, true);
    }
  }

  fs.writeFileSync("adversarial_security_report.json", JSON.stringify(auditResults, null, 2));
  console.log("\nSaved adversarial security audit report to adversarial_security_report.json");
}

runAdversarialAudit().catch(err => {
  console.error("Adversarial audit execution failure:", err);
  process.exit(1);
});
