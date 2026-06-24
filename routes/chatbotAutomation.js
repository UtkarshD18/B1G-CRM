const router = require("express").Router();
const { query, withTransaction } = require("../database/dbpromise");
const { validateUserOrAgent, verifyPermission } = require("../middlewares/auth");
const { checkPlan } = require("../middlewares/plan");
const { startFlow } = require("../functions/chatbotAutomationEngine");
const { encryptKey, decryptKey } = require("../utils/crypto");
const { testAIProviderConnection } = require("../functions/aiProviders");

// GET /api/chatbot-automation/flows
router.get("/flows", validateUserOrAgent, verifyPermission("chatbot_access"), async (req, res) => {
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
router.get("/flows/:flowId", validateUserOrAgent, verifyPermission("chatbot_access"), async (req, res) => {
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
router.post("/flows", validateUserOrAgent, verifyPermission("chatbot_access"), checkPlan, async (req, res) => {
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
              // Retrieve the old encrypted API key from existing nodes
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

    res.json({ success: true, msg: "Flow saved successfully" });
  } catch (err) {
    console.error("FLOW_SAVE_ERROR:", err);
    res.json({ success: false, msg: "Failed to save flow: " + err.message });
  }
});

// POST /api/chatbot-automation/ai/test
router.post("/ai/test", validateUserOrAgent, verifyPermission("chatbot_access"), async (req, res) => {
  try {
    const { provider, model, apiKey, prompt, flowId, nodeId } = req.body;
    let actualApiKey = apiKey;
    
    // If the apiKey is masked, retrieve the actual key from the database
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

    const result = await testAIProviderConnection(provider, model, actualApiKey, prompt || "Hello!");
    res.json(result);
  } catch (error) {
    console.error("AI Test Error:", error);
    res.json({ success: false, msg: error.message || "Connection failed" });
  }
});



// POST /api/chatbot-automation/flows/publish
router.post("/flows/publish", validateUserOrAgent, verifyPermission("chatbot_access"), async (req, res) => {
  try {
    const { flowId, isPublished } = req.body;
    await query(
      `UPDATE automation_flows SET is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE flow_id = ? AND uid = ?`,
      [isPublished ? 1 : 0, flowId, req.decode.uid]
    );
    res.json({ success: true, msg: isPublished ? "Flow published" : "Flow unpublished" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to update status" });
  }
});

// POST /api/chatbot-automation/flows/delete
router.post("/flows/delete", validateUserOrAgent, verifyPermission("chatbot_access"), async (req, res) => {
  try {
    const { flowId } = req.body;
    await query(
      `DELETE FROM automation_flows WHERE flow_id = ? AND uid = ?`,
      [flowId, req.decode.uid]
    );
    res.json({ success: true, msg: "Flow deleted successfully" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to delete flow" });
  }
});

// POST /api/chatbot-automation/flows/duplicate
router.post("/flows/duplicate", validateUserOrAgent, verifyPermission("chatbot_access"), async (req, res) => {
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

    res.json({ success: true, msg: "Flow duplicated successfully", flowId: newFlowId });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to duplicate flow" });
  }
});

// POST /api/chatbot-automation/flows/test
router.post("/flows/test", validateUserOrAgent, verifyPermission("chatbot_access"), async (req, res) => {
  try {
    const { flowId, message, phone, variables, name } = req.body;
    const uid = req.decode.uid;

    // Execute flow in simulation mode
    const executionId = await startFlow(
      flowId,
      message || "hi",
      phone || "+15550001111",
      name || "Test User",
      uid,
      null, // No live chatbot meta object (is test)
      true,  // isTest = true
      variables || {}
    );

    if (!executionId) {
      return res.json({ success: false, msg: "Simulation failed to start" });
    }

    // Retrieve execution log
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
router.get("/logs", validateUserOrAgent, verifyPermission("chatbot_access"), async (req, res) => {
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
router.get("/forms", validateUserOrAgent, verifyPermission("chatbot_access"), async (req, res) => {
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
router.get("/labels", validateUserOrAgent, verifyPermission("chatbot_access"), async (req, res) => {
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
router.get("/templates", validateUserOrAgent, verifyPermission("chatbot_access"), async (req, res) => {
  try {
    const data = await query(
      `SELECT * FROM templets WHERE uid = ? ORDER BY id DESC`,
      [req.decode.uid]
    );
    // Parse content JSON for each template
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

module.exports = router;
