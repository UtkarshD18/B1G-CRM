const fetch = require("node-fetch");
const { query } = require("../database/dbpromise");

const BASE = "http://localhost:3010";

async function run() {
  console.log("=== Testing Chatbot Automation Engine Simulator ===");

  // 1. Get user token
  const loginRes = await fetch(`${BASE}/api/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "user@example.com", password: "userpassword" })
  });
  const loginJson = await loginRes.json();
  if (!loginJson.success || !loginJson.token) {
    throw new Error("Failed to login");
  }
  const token = loginJson.token;
  const uid = loginJson.uid || "local-user-uid";
  console.log("Logged in successfully. Token obtained.");

  // 2. Setup mock flow schema in DB
  const flowId = "simulator-test-flow-" + Date.now();
  console.log(`Setting up mock flow: ${flowId}`);

  await query(`INSERT INTO automation_flows (uid, flow_id, name, is_published) VALUES (?, ?, ?, ?)`, [
    uid, flowId, "Simulator Verification Flow", 1
  ]);

  // Insert Nodes: Initial Node, Send Message Node, Condition Node, End Flow Node
  const nodes = [
    { id: "node-initial", type: "TRIGGER", data: { source: "Chatbot" } },
    { id: "node-msg", type: "Send Message", data: { messageBody: "Welcome {{senderName}}! Your query is {{senderMessage}}." } },
    { id: "node-cond", type: "Condition", data: { 
        conditions: [
          { variableName: "{{senderMessage}}", operator: "contains", valueToCompare: "pricing" }
        ] 
      } 
    },
    { id: "node-pricing-msg", type: "Send Message", data: { messageBody: "Pricing is $10/mo." } },
    { id: "node-default-msg", type: "Send Message", data: { messageBody: "How can we help you?" } },
    { id: "node-end", type: "End Flow", data: {} }
  ];

  const edges = [
    { id: "e1", source: "node-initial", target: "node-msg", sourceHandle: "next" },
    { id: "e2", source: "node-msg", target: "node-cond", sourceHandle: "next" },
    { id: "e3", source: "node-cond", target: "node-pricing-msg", sourceHandle: "branch_0" },
    { id: "e4", source: "node-cond", target: "node-default-msg", sourceHandle: "default_path" },
    { id: "e5", source: "node-pricing-msg", target: "node-end", sourceHandle: "next" },
    { id: "e6", source: "node-default-msg", target: "node-end", sourceHandle: "next" }
  ];

  for (const n of nodes) {
    await query(`INSERT INTO automation_nodes (flow_id, node_id, type, position_x, position_y, data) VALUES (?, ?, ?, 0, 0, ?)`, [
      flowId, n.id, n.type, JSON.stringify(n.data)
    ]);
  }

  for (const e of edges) {
    await query(`INSERT INTO automation_edges (flow_id, edge_id, source, target, source_handle, target_handle) VALUES (?, ?, ?, ?, ?, ?)`, [
      flowId, e.id, e.source, e.target, e.sourceHandle, null
    ]);
  }

  // 3. Post simulation test (matching condition: message has 'pricing')
  console.log("\nTesting Path A (matching condition: message contains 'pricing')");
  const testResA = await fetch(`${BASE}/api/chatbot-automation/flows/test`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      flowId,
      message: "tell me about pricing please",
      phone: "+919999999999",
      name: "Piyush"
    })
  });

  const testJsonA = await testResA.json();
  console.dir({
    success: testJsonA.success,
    executionStatus: testJsonA.execution?.status,
    executionPath: testJsonA.execution?.executionPath,
    logs: testJsonA.logs?.map(l => ({ node: l.nodeId, status: l.status }))
  }, { depth: null });

  // 4. Post simulation test (matching default path: message has 'hello')
  console.log("\nTesting Path B (matching default else path: message is 'hello')");
  const testResB = await fetch(`${BASE}/api/chatbot-automation/flows/test`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      flowId,
      message: "hello there",
      phone: "+919999999999",
      name: "Piyush"
    })
  });

  const testJsonB = await testResB.json();
  console.dir({
    success: testJsonB.success,
    executionStatus: testJsonB.execution?.status,
    executionPath: testJsonB.execution?.executionPath,
    logs: testJsonB.logs?.map(l => ({ node: l.nodeId, status: l.status }))
  }, { depth: null });

  // Clean up mock flow
  await query(`DELETE FROM automation_flows WHERE flow_id = ?`, [flowId]);
  console.log("\nCleanup done. Verification test complete!");
}

run().catch(console.error);
