const router = require("express").Router();
const { query, withTransaction } = require("../database/dbpromise");
const { validateUserOrAgent, verifyPermission } = require("../middlewares/auth");
const { checkPlan } = require("../middlewares/plan");
const { startFlow } = require("../functions/chatbotAutomationEngine");
const { encryptKey, decryptKey } = require("../utils/crypto");
const { testAIProviderConnection } = require("../functions/aiProviders");
const { logActivity } = require("../utils/activityLogger");
const { hasPermission } = require("../utils/permissionResolver");

// GET /api/chatbot-automation/flows
router.get("/flows", validateUserOrAgent, verifyPermission("automation.read"), async (req, res) => {
  try {
    const flows = await query(
      `SELECT * FROM automation_flows WHERE uid = ? ORDER BY updated_at DESC`,
      [req.decode.uid]
    );
    
    // Supplement with node count
    for (const flow of flows) {
      const [{ count }] = await query(
        `SELECT COUNT(*) as count FROM automation_nodes WHERE flow_id = ?`,
        [flow.flow_id]
      );
      flow.nodeCount = parseInt(count || 0, 10);
    }

    res.json({ success: true, data: flows });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

// GET /api/chatbot-automation/flows/:flowId
router.get("/flows/:flowId", validateUserOrAgent, verifyPermission("automation.read"), async (req, res) => {
  try {
    const { flowId } = req.params;
    const [flow] = await query(
      `SELECT * FROM automation_flows WHERE uid = ? AND flow_id = ?`,
      [req.decode.uid, flowId]
    );

    if (!flow) {
      return res.json({ success: false, msg: "Flow not found" });
    }

    const nodes = await query(
      `SELECT * FROM automation_nodes WHERE flow_id = ?`,
      [flowId]
    );

    const edges = await query(
      `SELECT * FROM automation_edges WHERE flow_id = ?`,
      [flowId]
    );

    const formattedNodes = nodes.map(n => {
      let nodeData = JSON.parse(n.data || "{}");
      if ((n.type === 'AI Transfer' || n.type === 'ai-transfer') && nodeData.apiKey) {
         nodeData.apiKey = "••••••••••••••••";
      }
      return {
        id: n.node_id,
        type: n.type,
        position: { x: parseFloat(n.position_x), y: parseFloat(n.position_y) },
        data: nodeData
      };
    });

    const formattedEdges = edges.map(e => ({
      id: e.edge_id,
      source: e.source,
      target: e.target,
      sourceHandle: e.source_handle,
      targetHandle: e.target_handle
    }));

    res.json({
      success: true,
      flow: {
        id: flow.flow_id,
        flow_id: flow.flow_id,
        title: flow.name,
        name: flow.name,
        isPublished: flow.is_published > 0,
        createdAt: flow.created_at,
        updatedAt: flow.updated_at
      },
      nodes: formattedNodes,
      edges: formattedEdges
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Something went wrong" });
  }
});

// POST /api/chatbot-automation/flows
router.post("/flows", validateUserOrAgent, verifyPermission("automation.edit"), checkPlan, async (req, res) => {
  try {
    const { flowId, name, nodes, edges, isPublished } = req.body;
    const uid = req.decode.uid;

    if (!flowId || !name) {
      return res.json({ success: false, msg: "Flow ID and name are required" });
    }

    await withTransaction(async (tx) => {
      // 1. Insert or update flow
      const [existing] = await tx(
        `SELECT * FROM automation_flows WHERE flow_id = ? AND uid = ?`,
        [flowId, uid]
      );

      if (existing) {
        await tx(
          `UPDATE automation_flows 
           SET name = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE flow_id = ? AND uid = ?`,
          [name, isPublished ? 1 : 0, flowId, uid]
        );
      } else {
        await tx(
          `INSERT INTO automation_flows (uid, flow_id, name, is_published) 
           VALUES (?, ?, ?, ?)`,
          [uid, flowId, name, isPublished ? 1 : 0]
        );
      }

      // 2. Delete old nodes and edges
      await tx(`DELETE FROM automation_nodes WHERE flow_id = ?`, [flowId]);
      await tx(`DELETE FROM automation_edges WHERE flow_id = ?`, [flowId]);

      // 3. Insert new nodes
      if (nodes && Array.isArray(nodes)) {
        for (const n of nodes) {
          let nodeDataToSave = { ...(n.data || {}) };
          
          if ((n.type === 'AI Transfer' || n.type === 'ai-transfer') && nodeDataToSave.apiKey) {
            if (nodeDataToSave.apiKey === "••••••••••••••••") {
              const oldNodes = await tx(`SELECT data FROM automation_nodes WHERE flow_id = ? AND node_id = ?`, [flowId, n.id]);
              if (oldNodes.length > 0) {
                 try {
                   const oldData = JSON.parse(oldNodes[0].data || "{}");
                   nodeDataToSave.apiKey = oldData.apiKey || "";
                 } catch(e) {}
              }
            } else {
              nodeDataToSave.apiKey = encryptKey(nodeDataToSave.apiKey);
            }
          }

          await tx(
            `INSERT INTO automation_nodes (flow_id, node_id, type, position_x, position_y, data) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              flowId,
              n.id,
              n.type || "Send Message",
              n.position?.x || 0,
              n.position?.y || 0,
              JSON.stringify(nodeDataToSave)
            ]
          );
        }
      }

      // 4. Insert new edges
      if (edges && Array.isArray(edges)) {
        for (const e of edges) {
          await tx(
            `INSERT INTO automation_edges (flow_id, edge_id, source, target, source_handle, target_handle) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              flowId,
              e.id || `edge-${e.source}-${e.target}`,
              e.source,
              e.target,
              e.sourceHandle || null,
              e.targetHandle || null
            ]
          );
        }
      }
    });

    await logActivity(req, "Automation", "flow_edit", name, { flowId });

    res.json({ success: true, msg: "Flow saved successfully" });
  } catch (err) {
    console.error("FLOW_SAVE_ERROR:", err);
    res.json({ success: false, msg: "Failed to save flow: " + err.message });
  }
});

// POST /api/chatbot-automation/ai/test
router.post("/ai/test", validateUserOrAgent, verifyPermission("settings.ai"), async (req, res) => {
  try {
    const { provider, model, apiKey, prompt, flowId, nodeId } = req.body;
    let actualApiKey = apiKey;
    
    if (apiKey === "••••••••••••••••" && flowId && nodeId) {
       const nodes = await query(`SELECT data FROM automation_nodes WHERE flow_id = ? AND node_id = ?`, [flowId, nodeId]);
       if (nodes.length > 0) {
          const nodeData = JSON.parse(nodes[0].data || "{}");
          actualApiKey = decryptKey(nodeData.apiKey);
       } else {
          return res.json({ success: false, msg: "Failed to load saved API key for testing." });
       }
    }

    if (!actualApiKey) {
      return res.json({ success: false, msg: "API key is required" });
    }

    let customEndpoint = null;
    if (provider === "custom" || provider === "deepseek") {
      const [aiProvider] = await query(
        `SELECT custom_endpoint FROM tenant_ai_providers WHERE uid = ? AND provider = ? LIMIT 1`,
        [req.decode.uid, provider]
      );
      customEndpoint = aiProvider?.custom_endpoint;
    }

    const result = await testAIProviderConnection(provider, model, actualApiKey, prompt || "Hello!", customEndpoint);
    res.json(result);
  } catch (error) {
    console.error("AI Test Error:", error);
    res.json({ success: false, msg: error.message || "Connection failed" });
  }
});

// POST /api/chatbot-automation/flows/publish
router.post("/flows/publish", validateUserOrAgent, verifyPermission("automation.publish"), async (req, res) => {
  try {
    const { flowId, isPublished } = req.body;
    await query(
      `UPDATE automation_flows SET is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE flow_id = ? AND uid = ?`,
      [isPublished ? 1 : 0, flowId, req.decode.uid]
    );

    await logActivity(req, "Automation", "flow_publish", flowId, { isPublished });

    res.json({ success: true, msg: isPublished ? "Flow published" : "Flow unpublished" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to update status" });
  }
});

// POST /api/chatbot-automation/flows/delete
router.post("/flows/delete", validateUserOrAgent, verifyPermission("automation.edit"), async (req, res) => {
  try {
    const { flowId } = req.body;
    await query(
      `DELETE FROM automation_flows WHERE flow_id = ? AND uid = ?`,
      [flowId, req.decode.uid]
    );

    await logActivity(req, "Automation", "flow_delete", flowId);

    res.json({ success: true, msg: "Flow deleted successfully" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to delete flow" });
  }
});

// POST /api/chatbot-automation/flows/duplicate
router.post("/flows/duplicate", validateUserOrAgent, verifyPermission("automation.edit"), async (req, res) => {
  try {
    const { flowId } = req.body;
    const uid = req.decode.uid;

    const [flow] = await query(
      `SELECT * FROM automation_flows WHERE flow_id = ? AND uid = ?`,
      [flowId, uid]
    );
    if (!flow) {
      return res.json({ success: false, msg: "Flow not found" });
    }

    const nodes = await query(`SELECT * FROM automation_nodes WHERE flow_id = ?`, [flowId]);
    const edges = await query(`SELECT * FROM automation_edges WHERE flow_id = ?`, [flowId]);

    const newFlowId = `flow-${Date.now()}`;
    const newName = `${flow.name} (Copy)`;

    await withTransaction(async (tx) => {
      await tx(
        `INSERT INTO automation_flows (uid, flow_id, name, is_published) VALUES (?, ?, ?, ?)`,
        [uid, newFlowId, newName, 0]
      );

      for (const n of nodes) {
        await tx(
          `INSERT INTO automation_nodes (flow_id, node_id, type, position_x, position_y, data) VALUES (?, ?, ?, ?, ?, ?)`,
          [newFlowId, n.node_id, n.type, n.position_x, n.position_y, n.data]
        );
      }

      for (const e of edges) {
        await tx(
          `INSERT INTO automation_edges (flow_id, edge_id, source, target, source_handle, target_handle) VALUES (?, ?, ?, ?, ?, ?)`,
          [newFlowId, e.edge_id, e.source, e.target, e.source_handle, e.target_handle]
        );
      }
    });

    await logActivity(req, "Automation", "flow_duplicate", flowId, { newFlowId });

    res.json({ success: true, msg: "Flow duplicated successfully", flowId: newFlowId });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to duplicate flow" });
  }
});

// POST /api/chatbot-automation/flows/test
router.post("/flows/test", validateUserOrAgent, verifyPermission("automation.edit"), async (req, res) => {
  try {
    const { flowId, message, phone, variables, name } = req.body;
    const uid = req.decode.uid;

    const executionId = await startFlow(
      flowId,
      message || "hi",
      phone || "+15550001111",
      name || "Test User",
      uid,
      null,
      true,
      variables || {}
    );

    if (!executionId) {
      return res.json({ success: false, msg: "Simulation failed to start" });
    }

    const [exec] = await query(
      `SELECT * FROM flow_executions WHERE id = ?`,
      [executionId]
    );

    const logs = await query(
      `SELECT * FROM flow_execution_logs WHERE execution_id = ? ORDER BY id ASC`,
      [executionId]
    );

    res.json({
      success: true,
      execution: {
        status: exec.status,
        currentNode: exec.current_node_id,
        variables: JSON.parse(exec.variables || "{}"),
        labels: JSON.parse(exec.labels || "[]"),
        executionPath: JSON.parse(exec.execution_path || "[]")
      },
      logs: logs.map(l => ({
        nodeId: l.node_id,
        status: l.status,
        errorMessage: l.error_message,
        executionTime: l.execution_time,
        timestamp: l.created_at
      }))
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to execute simulation" });
  }
});

// GET /api/chatbot-automation/logs
router.get("/logs", validateUserOrAgent, verifyPermission("automation.read"), async (req, res) => {
  try {
    const data = await query(
      `SELECT l.*, f.name as flow_name 
       FROM flow_execution_logs l
       JOIN automation_flows f ON l.flow_id = f.flow_id
       WHERE f.uid = ?
       ORDER BY l.id DESC LIMIT 100`,
      [req.decode.uid]
    );
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to load logs" });
  }
});

// GET /api/chatbot-automation/forms
router.get("/forms", validateUserOrAgent, verifyPermission("automation.read"), async (req, res) => {
  try {
    const data = await query(
      `SELECT * FROM whatsapp_forms WHERE uid = ? ORDER BY created_at DESC`,
      [req.decode.uid]
    );
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to load WhatsApp forms" });
  }
});

// GET /api/chatbot-automation/labels
router.get("/labels", validateUserOrAgent, verifyPermission("inbox.read"), async (req, res) => {
  try {
    const data = await query(
      `SELECT * FROM chat_tags WHERE uid = ? ORDER BY title ASC`,
      [req.decode.uid]
    );
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to load labels" });
  }
});

// GET /api/chatbot-automation/templates
router.get("/templates", validateUserOrAgent, verifyPermission("inbox.read"), async (req, res) => {
  try {
    const data = await query(
      `SELECT * FROM templets WHERE uid = ? ORDER BY id DESC`,
      [req.decode.uid]
    );
    const formatted = data.map(t => {
      let parsed = {};
      try { parsed = JSON.parse(t.content || "{}"); } catch { parsed = {}; }
      return {
        id: t.id,
        title: t.title,
        category: parsed.category || t.category || "UTILITY",
        language: parsed.language || t.language || "en_US",
        status: t.status || "APPROVED",
        content: t.content,
        components: parsed.components || []
      };
    });
    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to load templates" });
  }
});

// GET /api/chatbot-automation/ai-execution-logs
router.get("/ai-execution-logs", validateUserOrAgent, async (req, res) => {
  try {
    const userId = req.decode.agentUid || req.decode.uid;
    const canInspect = await hasPermission(userId, "ai.inspector");
    const canExecute = await hasPermission(userId, "ai.execution");

    if (!canInspect && !canExecute) {
      return res.status(403).json({ success: false, msg: "Permission denied", code: "PERMISSION_DENIED" });
    }

    const logs = await query(
      `SELECT * FROM ai_execution_logs WHERE uid = ? ORDER BY timestamp DESC LIMIT 100`,
      [req.decode.uid]
    );

    // Sanitize logs based on permissions
    const viewPrompt = await hasPermission(userId, "ai.prompt");
    const viewPayload = await hasPermission(userId, "ai.payload");
    const viewExecution = await hasPermission(userId, "ai.execution");
    const viewChunks = await hasPermission(userId, "ai.chunks");
    const viewSources = await hasPermission(userId, "ai.sources");

    const sanitizedLogs = logs.map(log => {
      const sanitized = { ...log };

      // Parse JSON columns
      let llm = {};
      let vec = {};
      let kw = {};
      let merged = {};
      let builder = {};

      try { llm = JSON.parse(log.llm_call || "{}"); } catch(e) {}
      try { vec = JSON.parse(log.vector_retrieval || "{}"); } catch(e) {}
      try { kw = JSON.parse(log.keyword_retrieval || "{}"); } catch(e) {}
      try { merged = JSON.parse(log.merged_context || "{}"); } catch(e) {}
      try { builder = JSON.parse(log.flow_builder || "{}"); } catch(e) {}

      // Prompt Sanitization
      if (!viewPrompt) {
        delete llm.systemPrompt;
        delete llm.userPrompt;
      }

      // API Payload Sanitization
      if (!viewPayload) {
        delete llm.provider;
        delete llm.model;
        delete llm.latency;
        delete llm.retrievalLatencyMs;
        delete llm.endpoint;
        delete llm.requestPayload;
        delete llm.responsePayload;
        delete llm.statusCode;
      }

      // Token usage/Execution metrics Sanitization
      if (!viewExecution) {
        delete llm.tokenEstimate;
        delete builder.variablesGenerated;
      }

      // Chunks and Sources Sanitization inside merged context
      if (merged.finalChunksSelected) {
        merged.finalChunksSelected = merged.finalChunksSelected.map(chunk => {
          const chunkObj = { ...chunk };
          if (!viewChunks) {
            delete chunkObj.content;
            delete chunkObj.text;
          }
          if (!viewSources) {
            delete chunkObj.title;
          }
          return chunkObj;
        });
      }

      sanitized.llm_call = JSON.stringify(llm);
      sanitized.vector_retrieval = JSON.stringify(vec);
      sanitized.keyword_retrieval = JSON.stringify(kw);
      sanitized.merged_context = JSON.stringify(merged);
      sanitized.flow_builder = JSON.stringify(builder);

      return sanitized;
    });

    await logActivity(req, "AI", "ai_inspector_open");

    res.json({ success: true, data: sanitizedLogs });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to load AI execution logs" });
  }
});

// GET /api/chatbot-automation/ai-execution-detail
router.get("/ai-execution-detail", validateUserOrAgent, async (req, res) => {
  try {
    const userId = req.decode.agentUid || req.decode.uid;
    const { msgText, executionId } = req.query;

    if (!msgText && !executionId) {
      return res.status(400).json({ success: false, msg: "msgText or executionId parameter is required" });
    }

    let rows;
    if (executionId) {
      rows = await query(
        `SELECT * FROM ai_execution_logs WHERE uid = ? AND execution_id = ? LIMIT 1`,
        [req.decode.uid, executionId]
      );
    } else {
      // Match logs where the flow builder's aiResponseValue contains or equals msgText
      rows = await query(
        `SELECT * FROM ai_execution_logs 
         WHERE uid = ? AND flow_builder LIKE ? 
         ORDER BY timestamp DESC LIMIT 1`,
        [req.decode.uid, `%${msgText}%`]
      );
    }

    if (rows.length === 0) {
      return res.json({ success: false, msg: "No matching AI execution found" });
    }

    const log = rows[0];

    // Check permissions
    const viewSources = await hasPermission(userId, "ai.sources");
    const viewChunks = await hasPermission(userId, "ai.chunks");
    const viewExecution = await hasPermission(userId, "ai.execution");
    const viewPayload = await hasPermission(userId, "ai.payload");
    const viewPrompt = await hasPermission(userId, "ai.prompt");

    let llm = {};
    let merged = {};
    let vec = {};
    let kw = {};

    try { llm = JSON.parse(log.llm_call || "{}"); } catch(e) {}
    try { merged = JSON.parse(log.merged_context || "{}"); } catch(e) {}
    try { vec = JSON.parse(log.vector_retrieval || "{}"); } catch(e) {}
    try { kw = JSON.parse(log.keyword_retrieval || "{}"); } catch(e) {}

    // Calculate RAG Confidence dynamically
    let confidencePercentage = 0;
    let confidenceLabel = "Low";

    if (merged.finalChunksSelected && merged.finalChunksSelected.length > 0) {
      // Find max similarity score from vector chunks
      const vectorScores = merged.finalChunksSelected
        .filter(c => c.type === "vector" || c.type === "hybrid")
        .map(c => c.vectorScore || 0);
      const maxVectorScore = vectorScores.length > 0 ? Math.max(...vectorScores) : 0;

      // Find max keyword score
      const keywordScores = merged.finalChunksSelected
        .filter(c => c.type === "keyword" || c.type === "hybrid")
        .map(c => c.keywordScore || 0);
      const maxKeywordScore = keywordScores.length > 0 ? Math.max(...keywordScores) : 0;

      // Calculate overall confidence (weighted: vector 70% + keyword 30%)
      confidencePercentage = Math.round((maxVectorScore * 70) + (Math.min(1, maxKeywordScore / 2) * 30));
      confidencePercentage = Math.max(10, Math.min(100, confidencePercentage));

      if (confidencePercentage >= 70) {
        confidenceLabel = "High";
      } else if (confidencePercentage >= 40) {
        confidenceLabel = "Medium";
      }
    }

    // Build sanitized response object
    const resultDetails = {
      execution_id: log.execution_id,
      flow_id: log.flow_id,
      node_id: log.node_id,
      timestamp: log.timestamp
    };

    if (viewExecution) {
      resultDetails.confidence_percentage = confidencePercentage;
      resultDetails.confidence_label = confidenceLabel;
      resultDetails.latency = llm.latency || 0;
      resultDetails.tokenEstimate = llm.tokenEstimate || 0;
    }

    if (viewPayload) {
      resultDetails.model = llm.model || "gemini-embedding-001";
      resultDetails.provider = llm.provider || "gemini";
    }

    if (viewSources && merged.finalChunksSelected) {
      resultDetails.sources = merged.finalChunksSelected.map(c => c.title).filter(Boolean);
      // Deduplicate sources
      resultDetails.sources = [...new Set(resultDetails.sources)];
    }

    if (viewChunks && merged.finalChunksSelected) {
      resultDetails.chunks = merged.finalChunksSelected.map(c => ({
        chunk_id: c.chunk_id,
        title: viewSources ? c.title : "Document",
        content: c.content || c.text,
        vectorScore: c.vectorScore,
        keywordScore: c.keywordScore,
        freshnessScore: c.freshnessScore,
        finalScore: c.finalScore,
        type: c.type
      }));
    }

    // Audit logs for prompt views/payload views
    if (viewPrompt) {
      await logActivity(req, "AI", "ai_view_prompt", log.execution_id, null, log.execution_id);
    }
    if (viewPayload) {
      await logActivity(req, "AI", "ai_view_payload", log.execution_id, null, log.execution_id);
    }

    await logActivity(req, "AI", "ai_view_detail", log.execution_id, null, log.execution_id);

    res.json({ success: true, data: resultDetails });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to load execution details" });
  }
});

// POST /api/chatbot-automation/suggest-response
router.post("/suggest-response", validateUserOrAgent, async (req, res) => {
  try {
    const { chatId } = req.body;
    if (!chatId) {
      return res.status(400).json({ success: false, msg: "chatId parameter is required" });
    }

    const userId = req.decode.agentUid || req.decode.uid;
    const canExecute = await hasPermission(userId, "ai.execution");

    if (!canExecute) {
      return res.status(403).json({ success: false, msg: "Permission denied", code: "PERMISSION_DENIED" });
    }

    // 1. Fetch last incoming message from the conversation json on disk
    const path = require("path");
    const fs = require("fs");
    const conversationPath = path.join(__dirname, `../conversations/inbox/${req.decode.uid}/${chatId}.json`);
    let lastIncomingMsg = "hello";
    if (fs.existsSync(conversationPath)) {
      try {
        const messages = JSON.parse(fs.readFileSync(conversationPath, "utf8"));
        if (Array.isArray(messages)) {
          const incoming = [...messages].reverse().find(m => m.route === "INCOMING");
          if (incoming) {
            lastIncomingMsg = incoming.msgContext?.text?.body || incoming.content || "hello";
          }
        }
      } catch (e) {
        console.error("Failed to parse conversation json", e);
      }
    }

    // 2. Locate active flow id for workspace
    const [chatbot] = await query("SELECT flow_id FROM chatbot WHERE uid = ? AND active = 1 LIMIT 1", [req.decode.uid]);
    let flowId = chatbot?.flow_id;
    if (!flowId) {
      const [latestFlow] = await query("SELECT flow_id FROM automation_flows WHERE uid = ? ORDER BY updated_at DESC LIMIT 1", [req.decode.uid]);
      flowId = latestFlow?.flow_id;
    }

    if (!flowId) {
      return res.json({ success: false, msg: "No active automation flow found for this workspace." });
    }

    // 3. Trigger flow runner in test mode to generate suggestion
    const { startFlow } = require("../functions/chatbotAutomationEngine");
    const executionId = await startFlow(
      flowId,
      lastIncomingMsg,
      chatId, // senderNumber
      "Inbox Suggestion", // name
      req.decode.uid, // tenant uid
      null, // chatbot
      true // isTest = true
    );

    if (!executionId) {
      return res.json({ success: false, msg: "Failed to generate suggestion." });
    }

    // 4. Fetch the generated execution log
    const rows = await query(
      `SELECT * FROM ai_execution_logs WHERE uid = ? AND flow_id = ? ORDER BY timestamp DESC LIMIT 1`,
      [req.decode.uid, String(flowId)]
    );

    if (rows.length === 0) {
      return res.json({ success: false, msg: "No suggestion execution details found" });
    }

    const log = rows[0];

    // Check granular permissions for response details sanitization
    const viewSources = await hasPermission(userId, "ai.sources");
    const viewChunks = await hasPermission(userId, "ai.chunks");
    const viewExecution = await hasPermission(userId, "ai.execution");
    const viewPayload = await hasPermission(userId, "ai.payload");
    const viewPrompt = await hasPermission(userId, "ai.prompt");

    let llm = {};
    let merged = {};
    let vec = {};
    let kw = {};

    try { llm = JSON.parse(log.llm_call || "{}"); } catch(e) {}
    try { merged = JSON.parse(log.merged_context || "{}"); } catch(e) {}
    try { vec = JSON.parse(log.vector_retrieval || "{}"); } catch(e) {}
    try { kw = JSON.parse(log.keyword_retrieval || "{}"); } catch(e) {}

    // Calculate RAG Confidence dynamically
    let confidencePercentage = 0;
    let confidenceLabel = "Low";

    if (merged.finalChunksSelected && merged.finalChunksSelected.length > 0) {
      const vectorScores = merged.finalChunksSelected
        .filter(c => c.type === "vector" || c.type === "hybrid")
        .map(c => c.vectorScore || 0);
      const maxVectorScore = vectorScores.length > 0 ? Math.max(...vectorScores) : 0;

      const keywordScores = merged.finalChunksSelected
        .filter(c => c.type === "keyword" || c.type === "hybrid")
        .map(c => c.keywordScore || 0);
      const maxKeywordScore = keywordScores.length > 0 ? Math.max(...keywordScores) : 0;

      confidencePercentage = Math.round((maxVectorScore * 70) + (Math.min(1, maxKeywordScore / 2) * 30));
      confidencePercentage = Math.max(10, Math.min(100, confidencePercentage));

      if (confidencePercentage >= 70) {
        confidenceLabel = "High";
      } else if (confidencePercentage >= 40) {
        confidenceLabel = "Medium";
      }
    }

    const resultDetails = {
      execution_id: log.execution_id,
      flow_id: log.flow_id,
      node_id: log.node_id,
      timestamp: log.timestamp,
      suggestedResponse: llm.responsePayload?.choices?.[0]?.message?.content || llm.responsePayload?.candidates?.[0]?.content?.parts?.[0]?.text || ""
    };

    if (!resultDetails.suggestedResponse && log.result) {
      try {
        resultDetails.suggestedResponse = JSON.parse(log.result)?.response || "";
      } catch(e) {}
    }

    if (!resultDetails.suggestedResponse) {
      let flowBuilderData = {};
      try { flowBuilderData = JSON.parse(log.flow_builder || "{}"); } catch(e) {}
      resultDetails.suggestedResponse = flowBuilderData.aiResponseValue || "";
    }

    if (viewExecution) {
      resultDetails.confidence_percentage = confidencePercentage;
      resultDetails.confidence_label = confidenceLabel;
      resultDetails.latency = llm.latency || 0;
      resultDetails.tokenEstimate = llm.tokenEstimate || 0;
    }

    if (viewPayload) {
      resultDetails.model = llm.model || "gemini-1.5-flash";
      resultDetails.provider = llm.provider || "gemini";
      resultDetails.systemPrompt = viewPrompt ? (llm.systemPrompt || "") : undefined;
      resultDetails.userPrompt = viewPrompt ? (llm.userPrompt || "") : undefined;
      resultDetails.rawPayload = llm;
    }

    if (viewSources && merged.finalChunksSelected) {
      resultDetails.sources = merged.finalChunksSelected.map(c => c.title).filter(Boolean);
      resultDetails.sources = [...new Set(resultDetails.sources)];
    }

    if (viewChunks && merged.finalChunksSelected) {
      resultDetails.chunks = merged.finalChunksSelected.map(c => ({
        chunk_id: c.chunk_id,
        title: viewSources ? c.title : "Document",
        content: c.content || c.text,
        vectorScore: c.vectorScore,
        keywordScore: c.keywordScore,
        freshnessScore: c.freshnessScore,
        finalScore: c.finalScore,
        type: c.type
      }));
    }

    await logActivity(req, "AI", "ai_suggest_response", chatId, { executionId });

    res.json({ success: true, data: resultDetails });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to generate AI suggestion response" });
  }
});

// POST /api/chatbot-automation/toggle-autopilot
router.post("/toggle-autopilot", validateUserOrAgent, async (req, res) => {
  try {
    const { chatId, paused } = req.body;
    if (!chatId) {
      return res.status(400).json({ success: false, msg: "chatId parameter is required" });
    }

    const userId = req.decode.agentUid || req.decode.uid;
    const canReply = await hasPermission(userId, "inbox.reply");

    if (!canReply) {
      return res.status(403).json({ success: false, msg: "Permission denied", code: "PERMISSION_DENIED" });
    }

    const disabledUntil = paused ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;

    const [existing] = await query("SELECT id FROM contact WHERE uid = ? AND mobile = ? LIMIT 1", [req.decode.uid, chatId]);
    if (existing) {
      await query("UPDATE contact SET auto_reply_disabled_until = ? WHERE uid = ? AND mobile = ?", [disabledUntil, req.decode.uid, chatId]);
    } else {
      await query("INSERT INTO contact (uid, mobile, name, auto_reply_disabled_until) VALUES (?, ?, ?, ?)", [req.decode.uid, chatId, "WhatsApp User", disabledUntil]);
    }

    await logActivity(req, "AI", paused ? "ai_autopilot_pause" : "ai_autopilot_resume", chatId, { disabledUntil });

    res.json({ success: true, msg: paused ? "Autopilot paused for 24 hours" : "Autopilot resumed successfully" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to toggle autopilot status" });
  }
});

// POST /api/chatbot-automation/ai-feedback
router.post("/ai-feedback", validateUserOrAgent, async (req, res) => {
  try {
    const { executionId, rating, comment, model, flowId, conversationId } = req.body;
    if (!executionId || !rating) {
      return res.status(400).json({ success: false, msg: "executionId and rating are required" });
    }

    const userId = req.decode.agentUid || req.decode.uid;

    await query(
      `INSERT INTO ai_feedback (uid, user_id, execution_id, rating, comment, model, flow_id, conversation_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.decode.uid, userId, executionId, rating, comment || null, model || null, flowId || null, conversationId || null]
    );

    await logActivity(req, "AI", "ai_feedback_submit", executionId, { rating, comment });

    res.json({ success: true, msg: "Feedback stored successfully" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to save feedback" });
  }
});

module.exports = router;

