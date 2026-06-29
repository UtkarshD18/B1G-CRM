const { query } = require("../database/dbpromise");
const { sign } = require("jsonwebtoken");
const env = require("../env");
const fetch = require("node-fetch");

async function runVerification() {
  console.log("=== Starting Phase 3 (Flow Versioning & Intelligence) Endpoints Verification ===");

  // 1. Fetch a test user
  const users = await query("SELECT * FROM \"user\" LIMIT 1");
  if (users.length === 0) {
    console.error("No users found in database.");
    process.exit(1);
  }
  const testUser = users[0];
  console.log(`Test user: ${testUser.email} (UID: ${testUser.uid})`);

  // 2. Generate a valid JWT token
  const token = sign(
    {
      uid: testUser.uid,
      role: "user",
      email: testUser.email
    },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };

  const baseUrl = `http://localhost:3010`;
  const flowId = `flow-verify-${Date.now()}`;

  // 3. Test validation endpoint (POST /api/chatbot-automation/flows/validate)
  console.log("\n1. Testing validation diagnostics engine...");
  const invalidPayload = {
    nodes: [
      { id: "node-initial-1", type: "initial", data: { label: "Trigger" } },
      { id: "node-initial-2", type: "initial", data: { label: "Trigger 2" } } // Dual start (Error!)
    ],
    edges: []
  };

  const valRes = await fetch(`${baseUrl}/api/chatbot-automation/flows/validate`, {
    method: "POST",
    headers,
    body: JSON.stringify(invalidPayload)
  });
  const valData = await valRes.json();
  console.log("Validation Result (Expected Error):", valData);
  if (valData.success && valData.validationResult?.success === false) {
    console.log("✅ Diagnostics validation engine correctly blocked invalid dual initial node configurations!");
  } else {
    console.error("❌ Diagnostics validation failed to block dual initial nodes.");
    process.exit(1);
  }

  // 4. Save a new flow (POST /api/chatbot-automation/flows) -> creates Version 1 Draft
  console.log("\n2. Saving flow to create Version 1 Draft...");
  const validFlow = {
    flowId,
    name: "Verification Versioning Flow",
    nodes: [
      { id: "node-initial", type: "initial", position: { x: 100, y: 100 }, data: { label: "Start Trigger", source: "Chatbot" } },
      { id: "node-end", type: "End Flow", position: { x: 300, y: 300 }, data: { label: "Exit Point" } }
    ],
    edges: [
      { id: "edge-1", source: "node-initial", target: "node-end", sourceHandle: "next" }
    ]
  };

  const saveRes = await fetch(`${baseUrl}/api/chatbot-automation/flows`, {
    method: "POST",
    headers,
    body: JSON.stringify(validFlow)
  });
  const saveResult = await saveRes.json();
  console.log("Save Response:", saveResult);
  if (saveResult.success) {
    console.log("✅ Save successful, created draft version 1!");
  } else {
    console.error("❌ Save failed:", saveResult);
    process.exit(1);
  }

  // 5. Test history retrieval (GET /api/chatbot-automation/flows/:flowId/versions)
  console.log("\n3. Testing history retrieval...");
  const histRes = await fetch(`${baseUrl}/api/chatbot-automation/flows/${flowId}/versions`, {
    headers
  });
  const histData = await histRes.json();
  console.log("Full History Response:", histData);
  if (histData.success && histData.data?.length > 0) {
    console.log(`✅ Version history loaded successfully. Latest version: v${histData.data[0].version} (${histData.data[0].status})`);
  } else {
    console.error("❌ Failed to load version history.");
    process.exit(1);
  }

  // 6. Test publishing (POST /api/chatbot-automation/flows/publish)
  console.log("\n4. Testing publication deployment...");
  const pubRes = await fetch(`${baseUrl}/api/chatbot-automation/flows/publish`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      flowId,
      releaseTag: "Production",
      versionNotes: "First deployment from validation suite"
    })
  });
  const pubData = await pubRes.json();
  console.log("Publish Response:", pubData);
  if (pubData.success) {
    console.log("✅ Flow published successfully!");
  } else {
    console.error("❌ Publish failed:", pubData);
    process.exit(1);
  }

  // 7. Make a modified version and save it (adds a new node) -> creates Version 2 Draft
  console.log("\n5. Modifying flow and saving Version 2 Draft...");
  const modifiedFlow = {
    flowId,
    name: "Verification Versioning Flow (V2)",
    nodes: [
      { id: "node-initial", type: "initial", position: { x: 100, y: 100 }, data: { label: "Start Trigger", source: "Chatbot" } },
      { id: "node-ai", type: "Send Message", position: { x: 200, y: 200 }, data: { label: "RAG Answer Node", message: "Hi! Ask me anything." } },
      { id: "node-end", type: "End Flow", position: { x: 300, y: 300 }, data: { label: "Exit Point" } }
    ],
    edges: [
      { id: "edge-1", source: "node-initial", target: "node-ai", sourceHandle: "next" },
      { id: "edge-2", source: "node-ai", target: "node-end", sourceHandle: "next" }
    ]
  };

  const saveRes2 = await fetch(`${baseUrl}/api/chatbot-automation/flows`, {
    method: "POST",
    headers,
    body: JSON.stringify(modifiedFlow)
  });
  const saveResult2 = await saveRes2.json();
  console.log("Save V2 Response:", saveResult2);

  // 8. Compare Version 1 and Version 2 (GET /api/chatbot-automation/flows/:flowId/compare)
  console.log("\n6. Comparing Version 1 and Version 2...");
  const compRes = await fetch(`${baseUrl}/api/chatbot-automation/flows/${flowId}/compare?v1=1&v2=2`, {
    headers
  });
  const compData = await compRes.json();
  console.log("Comparison Result:", compData);
  if (compData.success && compData.diff?.addedNodes?.length > 0) {
    console.log("✅ Compare successful! Detected added node:", compData.diff.addedNodes);
  } else {
    console.error("❌ Comparison failed or could not find added nodes.");
    process.exit(1);
  }

  // 9. Configure Template Settings (POST /api/chatbot-automation/flows/:flowId/template)
  console.log("\n7. Setting version 1 as a template...");
  const tempConfRes = await fetch(`${baseUrl}/api/chatbot-automation/flows/${flowId}/template`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      version: 1,
      isTemplate: true,
      category: "Customer Support",
      description: "Sample template built by automated verification test suite."
    })
  });
  const tempConfData = await tempConfRes.json();
  console.log("Template Configuration Response:", tempConfData);
  if (tempConfData.success) {
    console.log("✅ Successfully marked version 1 as template!");
  } else {
    console.error("❌ Failed to configure template setting.");
    process.exit(1);
  }

  // 10. Fetch templates list (GET /api/chatbot-automation/flows/templates)
  console.log("\n8. Listing all templates...");
  const tempGetRes = await fetch(`${baseUrl}/api/chatbot-automation/flows/templates`, {
    headers
  });
  const tempGetData = await tempGetRes.json();
  console.log("Full Templates Response:", tempGetData);
  if (tempGetData.success && tempGetData.data?.length > 0) {
    console.log("✅ Templates fetched successfully!");
  } else {
    console.error("❌ Failed to list templates.");
    process.exit(1);
  }

  // 11. Clone Template (POST /api/chatbot-automation/flows/clone-template)
  console.log("\n9. Cloning template...");
  const templateId = tempGetData.data[0].id;
  const cloneRes = await fetch(`${baseUrl}/api/chatbot-automation/flows/clone-template`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      templateId,
      name: "Cloned Verification Flow"
    })
  });
  const cloneData = await cloneRes.json();
  console.log("Clone Response:", cloneData);
  if (cloneData.success) {
    console.log(`✅ Flow successfully cloned! Cloned flowId: ${cloneData.flowId}`);
  } else {
    console.error("❌ Failed to clone template.");
    process.exit(1);
  }

  // 12. Test Rollback (POST /api/chatbot-automation/flows/rollback)
  console.log("\n10. Testing version rollback...");
  const rollRes = await fetch(`${baseUrl}/api/chatbot-automation/flows/rollback`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      flowId,
      version: 1,
      versionNotes: "Emergency rollback to stable version 1"
    })
  });
  const rollData = await rollRes.json();
  console.log("Rollback Response:", rollData);
  if (rollData.success) {
    console.log("✅ Rollback succeeded and deployed version 1!");
  } else {
    console.error("❌ Rollback failed:", rollData);
    process.exit(1);
  }

  // 13. Verify version history now lists version 3 (the rollback version)
  console.log("\n11. Re-checking history list for rollback trace...");
  const histRes2 = await fetch(`${baseUrl}/api/chatbot-automation/flows/${flowId}/versions`, {
    headers
  });
  const histData2 = await histRes2.json();
  console.log("History after rollback:", histData2.data);
  const latestVer2 = histData2.data[0];
  if (latestVer2.version === 3 && latestVer2.rollback_source_version === 1 && latestVer2.status === 'published') {
    console.log("✅ Rollback successfully recorded in history as version 3 with source v1 as status='published'!");
  } else {
    console.error("❌ Rollback version check failed.");
    process.exit(1);
  }

  // Cleanup testing flow
  console.log("\nCleaning up...");
  await query("DELETE FROM automation_flow_versions WHERE flow_id = ?", [flowId]);
  await query("DELETE FROM automation_flows WHERE flow_id = ?", [flowId]);
  if (cloneData.flowId) {
    await query("DELETE FROM automation_flow_versions WHERE flow_id = ?", [cloneData.flowId]);
    await query("DELETE FROM automation_flows WHERE flow_id = ?", [cloneData.flowId]);
  }
  console.log("✅ Test flow records cleaned up successfully.");

  console.log("\n🎉 ALL PHASE 3 END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY!");
}

runVerification().then(() => process.exit(0)).catch(e => { console.error("FATAL ERROR:", e); process.exit(1); });
