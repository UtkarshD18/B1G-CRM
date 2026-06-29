const router = require('express').Router();
const { query, withTransaction } = require('../database/dbpromise');
const { validateUserOrAgent, verifyPermission } = require('../middlewares/auth');
const { checkPlan } = require('../middlewares/plan');
const { startFlow } = require('../functions/chatbotAutomationEngine');
const { encryptKey, decryptKey } = require('../utils/crypto');
const { testAIProviderConnection } = require('../functions/aiProviders');
const { logActivity } = require('../utils/activityLogger');
const { hasPermission } = require('../utils/permissionResolver');
const { validateFlow } = require('../utils/validators');
const { compareFlows } = require('../utils/comparators');
const crypto = require('crypto');

// GET /api/chatbot-automation/flows
// Helper to warm active runtime tables
async function warmRuntimeCache(flowId, flowJson) {
  await withTransaction(async (tx) => {
    await tx(`DELETE FROM automation_nodes WHERE flow_id = ?`, [flowId]);
    await tx(`DELETE FROM automation_edges WHERE flow_id = ?`, [flowId]);

    const nodes = flowJson.nodes || [];
    for (const n of nodes) {
      let nodeDataToSave = { ...(n.data || {}) };
      if ((n.type === 'AI Transfer' || n.type === 'ai-transfer') && nodeDataToSave.apiKey) {
        if (nodeDataToSave.apiKey !== '••••••••••••••••') {
          nodeDataToSave.apiKey = encryptKey(nodeDataToSave.apiKey);
        }
      }
      await tx(
        `INSERT INTO automation_nodes (flow_id, node_id, type, position_x, position_y, data) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          flowId,
          n.id,
          n.type || 'Send Message',
          n.position?.x || 0,
          n.position?.y || 0,
          JSON.stringify(nodeDataToSave),
        ],
      );
    }

    const edges = flowJson.edges || [];
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
          e.targetHandle || null,
        ],
      );
    }
  });
}

// GET /api/chatbot-automation/flows
router.get('/flows', validateUserOrAgent, verifyPermission('automation.read'), async (req, res) => {
  try {
    const flows = await query(
      `SELECT * FROM automation_flows WHERE uid = ? ORDER BY updated_at DESC`,
      [req.decode.uid],
    );

    // Supplement with node count from latest version
    for (const flow of flows) {
      const [latestVer] = await query(
        `SELECT flow_json FROM automation_flow_versions WHERE flow_id = ? AND uid = ? ORDER BY version DESC LIMIT 1`,
        [flow.flow_id, req.decode.uid],
      );
      if (latestVer && latestVer.flow_json) {
        try {
          const flowJson =
            typeof latestVer.flow_json === 'string'
              ? JSON.parse(latestVer.flow_json)
              : latestVer.flow_json;
          flow.nodeCount = (flowJson.nodes || []).length;
        } catch (e) {
          flow.nodeCount = 0;
        }
      } else {
        const [{ count }] = await query(
          `SELECT COUNT(*) as count FROM automation_nodes WHERE flow_id = ?`,
          [flow.flow_id],
        );
        flow.nodeCount = parseInt(count || 0, 10);
      }
    }

    res.json({ success: true, data: flows });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: 'Something went wrong' });
  }
});

// GET /api/chatbot-automation/flows/templates
router.get(
  '/flows/templates',
  validateUserOrAgent,
  verifyPermission('automation.template'),
  async (req, res) => {
    try {
      const uid = req.decode.uid;
      const templates = await query(
        `SELECT t.*, v.version, v.flow_id FROM flow_templates t
       JOIN automation_flow_versions v ON t.version_id = v.id
       WHERE t.uid = ? OR t.visibility = 'public'
       ORDER BY t.created_at DESC`,
        [uid],
      );
      res.json({ success: true, data: templates });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to load flow templates' });
    }
  },
);

// GET /api/chatbot-automation/flows/:flowId
router.get(
  '/flows/:flowId',
  validateUserOrAgent,
  verifyPermission('automation.read'),
  async (req, res) => {
    try {
      const { flowId } = req.params;
      const uid = req.decode.uid;

      const [flow] = await query(`SELECT * FROM automation_flows WHERE uid = ? AND flow_id = ?`, [
        uid,
        flowId,
      ]);

      if (!flow) {
        return res.json({ success: false, msg: 'Flow not found' });
      }

      // Lock Expiration config loading
      const lockTimeout = require('../env').FLOW_LOCK_TIMEOUT || 15;
      const userId = req.decode.agentUid || req.decode.uid;

      // Check locking status
      let isLocked = false;
      let lockOwner = null;

      if (flow.locked_by) {
        const lockExpired =
          new Date(flow.locked_at).getTime() + lockTimeout * 60 * 1000 < Date.now();
        if (!lockExpired) {
          isLocked = flow.locked_by !== userId;
          lockOwner = flow.locked_by;
        }
      }

      // Refresh lock if not locked by someone else
      if (!isLocked) {
        await query(
          `UPDATE automation_flows SET locked_by = ?, locked_at = CURRENT_TIMESTAMP WHERE flow_id = ? AND uid = ?`,
          [userId, flowId, uid],
        );
      }

      // Fetch latest flow version (prioritize draft, fallback to published, fallback to cache tables)
      const [latestVer] = await query(
        `SELECT * FROM automation_flow_versions WHERE flow_id = ? AND uid = ? ORDER BY version DESC LIMIT 1`,
        [flowId, uid],
      );

      let formattedNodes = [];
      let formattedEdges = [];
      let version = null;

      if (latestVer) {
        version = latestVer.version;
        const flowJson =
          typeof latestVer.flow_json === 'string'
            ? JSON.parse(latestVer.flow_json)
            : latestVer.flow_json;
        const nodes = flowJson.nodes || [];
        const edges = flowJson.edges || [];

        formattedNodes = nodes.map((n) => {
          let nodeData = n.data || {};
          if ((n.type === 'AI Transfer' || n.type === 'ai-transfer') && nodeData.apiKey) {
            nodeData.apiKey = '••••••••••••••••';
          }
          return {
            id: n.id,
            type: n.type,
            position: n.position || { x: 0, y: 0 },
            data: nodeData,
          };
        });

        formattedEdges = edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
        }));
      } else {
        // Legacy Fallback
        const nodes = await query(`SELECT * FROM automation_nodes WHERE flow_id = ?`, [flowId]);
        const edges = await query(`SELECT * FROM automation_edges WHERE flow_id = ?`, [flowId]);

        formattedNodes = nodes.map((n) => {
          let nodeData = JSON.parse(n.data || '{}');
          if ((n.type === 'AI Transfer' || n.type === 'ai-transfer') && nodeData.apiKey) {
            nodeData.apiKey = '••••••••••••••••';
          }
          return {
            id: n.node_id,
            type: n.type,
            position: { x: parseFloat(n.position_x), y: parseFloat(n.position_y) },
            data: nodeData,
          };
        });

        formattedEdges = edges.map((e) => ({
          id: e.edge_id,
          source: e.source,
          target: e.target,
          sourceHandle: e.source_handle,
          targetHandle: e.target_handle,
        }));
      }

      res.json({
        success: true,
        flow: {
          id: flow.flow_id,
          flow_id: flow.flow_id,
          title: flow.name,
          name: flow.name,
          isPublished: flow.is_published > 0,
          createdAt: flow.created_at,
          updatedAt: flow.updated_at,
          revision: flow.revision,
          isLocked,
          lockedBy: lockOwner,
          lockedAt: flow.locked_at,
        },
        version,
        nodes: formattedNodes,
        edges: formattedEdges,
      });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Something went wrong' });
    }
  },
);

// POST /api/chatbot-automation/flows
router.post(
  '/flows',
  validateUserOrAgent,
  verifyPermission('automation.edit'),
  checkPlan,
  async (req, res) => {
    try {
      const { flowId, name, nodes, edges, revision, versionNotes, releaseTag } = req.body;
      const uid = req.decode.uid;
      const userId = req.decode.agentUid || req.decode.uid;

      if (!flowId || !name) {
        return res.json({ success: false, msg: 'Flow ID and name are required' });
      }

      // 1. Fetch flow and verify locks
      const [flow] = await query(`SELECT * FROM automation_flows WHERE flow_id = ? AND uid = ?`, [
        flowId,
        uid,
      ]);

      if (flow) {
        // Optimistic Locking Check
        if (revision !== undefined && flow.revision > revision) {
          return res.json({
            success: false,
            conflict: true,
            msg: 'This flow changed while you were editing. Please reload or force save.',
          });
        }

        // Draft Locking Check
        const lockTimeout = require('../env').FLOW_LOCK_TIMEOUT || 15;
        if (flow.locked_by && flow.locked_by !== userId) {
          const lockExpired =
            new Date(flow.locked_at).getTime() + lockTimeout * 60 * 1000 < Date.now();
          if (!lockExpired) {
            return res.json({
              success: false,
              locked: true,
              msg: `Flow is currently locked by another operator.`,
            });
          }
        }
      }

      // Construct Canonical flow_json
      const flowJson = {
        nodes: nodes || [],
        edges: edges || [],
        viewport: req.body.viewport || {},
        variables: req.body.variables || {},
        settings: req.body.settings || {},
        metadata: req.body.metadata || {},
      };

      // Calculate Checksum (SHA-256)
      const checksum = crypto.createHash('sha256').update(JSON.stringify(flowJson)).digest('hex');

      await withTransaction(async (tx) => {
        // 2. Insert or update flow header properties
        let newRevision = 1;
        if (flow) {
          newRevision = flow.revision + 1;
          await tx(
            `UPDATE automation_flows 
           SET name = ?, revision = ?, last_saved_at = CURRENT_TIMESTAMP, last_saved_by = ?, locked_by = ?, locked_at = CURRENT_TIMESTAMP
           WHERE flow_id = ? AND uid = ?`,
            [name, newRevision, userId, userId, flowId, uid],
          );
        } else {
          await tx(
            `INSERT INTO automation_flows (uid, flow_id, name, revision, last_saved_by, locked_by, locked_at) 
           VALUES (?, ?, ?, 1, ?, ?, CURRENT_TIMESTAMP)`,
            [uid, flowId, name, userId, userId],
          );
        }

        // 3. Versioning Insertion/Update
        const [latestVer] = await tx(
          `SELECT * FROM automation_flow_versions WHERE flow_id = ? AND uid = ? ORDER BY version DESC LIMIT 1`,
          [flowId, uid],
        );

        if (latestVer && latestVer.status === 'draft') {
          // Update existing Draft in-place
          await tx(
            `UPDATE automation_flow_versions 
           SET flow_json = ?, name = ?, version_notes = ?, checksum = ?, created_at = CURRENT_TIMESTAMP, revision = ?
           WHERE id = ?`,
            [
              JSON.stringify(flowJson),
              name,
              versionNotes || latestVer.version_notes,
              checksum,
              newRevision,
              latestVer.id,
            ],
          );
        } else {
          // Create new Draft version
          const nextVersionNum = latestVer ? latestVer.version + 1 : 1;
          await tx(
            `INSERT INTO automation_flow_versions (
            uid, flow_id, version, status, name, flow_json, created_by, version_notes, checksum, release_tag, revision
          ) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?)`,
            [
              uid,
              flowId,
              nextVersionNum,
              name,
              JSON.stringify(flowJson),
              userId,
              versionNotes || 'Draft auto-save',
              checksum,
              releaseTag || 'Draft',
              newRevision,
            ],
          );
        }

        // 4. Update Main Tables for backward-compatibility test mode
        if (!flow || flow.is_published === 0) {
          await tx(`DELETE FROM automation_nodes WHERE flow_id = ?`, [flowId]);
          await tx(`DELETE FROM automation_edges WHERE flow_id = ?`, [flowId]);

          for (const n of nodes || []) {
            let nodeDataToSave = { ...(n.data || {}) };
            if ((n.type === 'AI Transfer' || n.type === 'ai-transfer') && nodeDataToSave.apiKey) {
              if (nodeDataToSave.apiKey !== '••••••••••••••••') {
                nodeDataToSave.apiKey = encryptKey(nodeDataToSave.apiKey);
              }
            }
            await tx(
              `INSERT INTO automation_nodes (flow_id, node_id, type, position_x, position_y, data) 
             VALUES (?, ?, ?, ?, ?, ?)`,
              [
                flowId,
                n.id,
                n.type || 'Send Message',
                n.position?.x || 0,
                n.position?.y || 0,
                JSON.stringify(nodeDataToSave),
              ],
            );
          }

          for (const e of edges || []) {
            await tx(
              `INSERT INTO automation_edges (flow_id, edge_id, source, target, source_handle, target_handle) 
             VALUES (?, ?, ?, ?, ?, ?)`,
              [
                flowId,
                e.id || `edge-${e.source}-${e.target}`,
                e.source,
                e.target,
                e.sourceHandle || null,
                e.targetHandle || null,
              ],
            );
          }
        }
      });

      await logActivity(req, 'Automation', 'flow_save', name, { flowId });
      res.json({
        success: true,
        revision: flow ? flow.revision + 1 : 1,
        msg: 'Flow saved successfully',
      });
    } catch (err) {
      console.error('FLOW_SAVE_ERROR:', err);
      res.json({ success: false, msg: 'Failed to save flow: ' + err.message });
    }
  },
);

// POST /api/chatbot-automation/flows/unlock
router.post(
  '/flows/unlock',
  validateUserOrAgent,
  verifyPermission('automation.edit'),
  async (req, res) => {
    try {
      const { flowId } = req.body;
      const uid = req.decode.uid;

      await query(
        `UPDATE automation_flows SET locked_by = NULL, locked_at = NULL WHERE flow_id = ? AND uid = ?`,
        [flowId, uid],
      );

      await logActivity(req, 'Automation', 'flow_unlock', flowId);
      res.json({ success: true, msg: 'Flow unlocked successfully' });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to unlock flow' });
    }
  },
);

// POST /api/chatbot-automation/flows/publish
router.post(
  '/flows/publish',
  validateUserOrAgent,
  verifyPermission('automation.publish'),
  async (req, res) => {
    try {
      const { flowId, versionNotes, releaseTag, isPublished } = req.body;
      const uid = req.decode.uid;
      const userId = req.decode.agentUid || req.decode.uid;

      if (isPublished === false || isPublished === 0) {
        await withTransaction(async (tx) => {
          await tx(
            `UPDATE automation_flow_versions SET status = 'historical' WHERE flow_id = ? AND uid = ? AND status = 'published'`,
            [flowId, uid],
          );
          await tx(
            `UPDATE automation_flows SET is_published = 0, updated_at = CURRENT_TIMESTAMP WHERE flow_id = ? AND uid = ?`,
            [flowId, uid],
          );
        });
        await logActivity(req, 'Automation', 'flow_unpublish', flowId);
        return res.json({ success: true, msg: 'Flow unpublished successfully' });
      }

      // 1. Fetch latest draft
      const [latestVer] = await query(
        `SELECT * FROM automation_flow_versions WHERE flow_id = ? AND uid = ? ORDER BY version DESC LIMIT 1`,
        [flowId, uid],
      );

      if (!latestVer) {
        return res.json({
          success: false,
          msg: 'No versions found for this flow. Please save first.',
        });
      }

      const flowJson =
        typeof latestVer.flow_json === 'string'
          ? JSON.parse(latestVer.flow_json)
          : latestVer.flow_json;

      // 2. Validate Flow JSON
      const validationResult = validateFlow(flowJson);
      if (!validationResult.success) {
        await logActivity(req, 'Automation', 'validation_failed', flowId, { validationResult });
        return res.json({
          success: false,
          msg: 'Flow validation failed. Severe errors block publication.',
          validationResult,
        });
      }

      // 3. Check for checksum duplicate of current published
      const [currPublished] = await query(
        `SELECT * FROM automation_flow_versions WHERE flow_id = ? AND uid = ? AND status = 'published' LIMIT 1`,
        [flowId, uid],
      );

      if (currPublished && currPublished.checksum === latestVer.checksum) {
        // Reuse current published
        await logActivity(req, 'Automation', 'flow_publish_reused', flowId, {
          version: currPublished.version,
        });
        return res.json({
          success: true,
          msg: 'Flow published (no changes detected, reused existing published version)',
          reused: true,
          version: currPublished.version,
        });
      }

      // 4. Update status to published
      await withTransaction(async (tx) => {
        // Archive previous published
        await tx(
          `UPDATE automation_flow_versions SET status = 'historical' WHERE flow_id = ? AND uid = ? AND status = 'published'`,
          [flowId, uid],
        );

        if (latestVer.status === 'draft') {
          // Upgrade latest draft to published
          await tx(
            `UPDATE automation_flow_versions 
           SET status = 'published', published_at = CURRENT_TIMESTAMP, published_by = ?, release_tag = ?, version_notes = ?
           WHERE id = ?`,
            [
              userId,
              releaseTag || 'Production',
              versionNotes || latestVer.version_notes,
              latestVer.id,
            ],
          );
        } else {
          // Create new version cloning the latest draft/historical
          const nextVersionNum = latestVer.version + 1;
          await tx(
            `INSERT INTO automation_flow_versions (
            uid, flow_id, version, status, name, flow_json, created_by, published_by, 
            version_notes, checksum, release_tag, published_at
          ) VALUES (?, ?, ?, 'published', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [
              uid,
              flowId,
              nextVersionNum,
              latestVer.name,
              JSON.stringify(flowJson),
              latestVer.created_by,
              userId,
              versionNotes || 'Published release',
              latestVer.checksum,
              releaseTag || 'Production',
            ],
          );
        }

        await tx(
          `UPDATE automation_flows SET is_published = 1, updated_at = CURRENT_TIMESTAMP WHERE flow_id = ? AND uid = ?`,
          [flowId, uid],
        );
      });

      // 5. Background cache warming
      setImmediate(async () => {
        try {
          await warmRuntimeCache(flowId, flowJson);
        } catch (e) {
          console.error('[Warm Cache Error]:', e);
        }
      });

      await logActivity(req, 'Automation', 'flow_publish', flowId, { releaseTag });
      res.json({ success: true, msg: 'Flow published successfully' });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to publish flow' });
    }
  },
);

// POST /api/chatbot-automation/flows/rollback
router.post(
  '/flows/rollback',
  validateUserOrAgent,
  verifyPermission('automation.rollback'),
  async (req, res) => {
    try {
      const { flowId, version, versionNotes } = req.body;
      const uid = req.decode.uid;
      const userId = req.decode.agentUid || req.decode.uid;

      if (!flowId || !version) {
        return res.json({ success: false, msg: 'Flow ID and version number are required' });
      }

      // 1. Fetch target version
      const [targetVer] = await query(
        `SELECT * FROM automation_flow_versions WHERE flow_id = ? AND uid = ? AND version = ?`,
        [flowId, uid, version],
      );

      if (!targetVer) {
        return res.json({ success: false, msg: `Version ${version} not found.` });
      }

      const flowJson =
        typeof targetVer.flow_json === 'string'
          ? JSON.parse(targetVer.flow_json)
          : targetVer.flow_json;

      // 2. Fetch latest version number to increment
      const [latestVer] = await query(
        `SELECT version FROM automation_flow_versions WHERE flow_id = ? AND uid = ? ORDER BY version DESC LIMIT 1`,
        [flowId, uid],
      );
      const nextVersion = latestVer.version + 1;

      // 3. Rollback Database updates
      await withTransaction(async (tx) => {
        // Archive current published
        await tx(
          `UPDATE automation_flow_versions SET status = 'historical' WHERE flow_id = ? AND uid = ? AND status = 'published'`,
          [flowId, uid],
        );

        // Create new published version cloned from target rollback version
        await tx(
          `INSERT INTO automation_flow_versions (
          uid, flow_id, version, status, name, flow_json, created_by, published_by, 
          rollback_source_version, version_notes, checksum, release_tag, published_at
        ) VALUES (?, ?, ?, 'published', ?, ?, ?, ?, ?, ?, ?, 'Rollback Point', CURRENT_TIMESTAMP)`,
          [
            uid,
            flowId,
            nextVersion,
            targetVer.name,
            JSON.stringify(flowJson),
            targetVer.created_by,
            userId,
            version,
            versionNotes || `Rollback to version ${version}`,
            targetVer.checksum,
          ],
        );

        await tx(
          `UPDATE automation_flows SET is_published = 1, updated_at = CURRENT_TIMESTAMP WHERE flow_id = ? AND uid = ?`,
          [flowId, uid],
        );
      });

      // 4. Background Cache Warming
      setImmediate(async () => {
        try {
          await warmRuntimeCache(flowId, flowJson);
        } catch (e) {
          console.error('[Rollback Warm Cache Error]:', e);
        }
      });

      await logActivity(req, 'Automation', 'flow_rollback', flowId, {
        fromVersion: version,
        toVersion: nextVersion,
      });
      res.json({ success: true, msg: `Successfully rolled back to version ${version}` });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to execute rollback' });
    }
  },
);

// POST /api/chatbot-automation/flows/validate
router.post(
  '/flows/validate',
  validateUserOrAgent,
  verifyPermission('automation.edit'),
  async (req, res) => {
    try {
      const { nodes, edges } = req.body;
      const validationResult = validateFlow({ nodes: nodes || [], edges: edges || [] });
      res.json({ success: true, validationResult });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to validate flow' });
    }
  },
);

// GET /api/chatbot-automation/flows/:flowId/compare
router.get(
  '/flows/:flowId/compare',
  validateUserOrAgent,
  verifyPermission('automation.compare'),
  async (req, res) => {
    try {
      const { flowId } = req.params;
      const { v1, v2 } = req.query;
      const uid = req.decode.uid;

      if (!v1 || !v2) {
        return res
          .status(400)
          .json({ success: false, msg: 'v1 and v2 query parameters are required' });
      }

      const [ver1] = await query(
        `SELECT flow_json FROM automation_flow_versions WHERE flow_id = ? AND uid = ? AND version = ?`,
        [flowId, uid, v1],
      );

      const [ver2] = await query(
        `SELECT flow_json FROM automation_flow_versions WHERE flow_id = ? AND uid = ? AND version = ?`,
        [flowId, uid, v2],
      );

      if (!ver1 || !ver2) {
        return res
          .status(404)
          .json({ success: false, msg: 'One or both specified versions could not be found' });
      }

      const j1 = typeof ver1.flow_json === 'string' ? JSON.parse(ver1.flow_json) : ver1.flow_json;
      const j2 = typeof ver2.flow_json === 'string' ? JSON.parse(ver2.flow_json) : ver2.flow_json;

      const diff = compareFlows(j1, j2);

      await logActivity(req, 'Automation', 'version_compare', flowId, { v1, v2 });
      res.json({ success: true, diff });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to compare versions' });
    }
  },
);

// GET /api/chatbot-automation/flows/:flowId/versions
router.get(
  '/flows/:flowId/versions',
  validateUserOrAgent,
  verifyPermission('automation.history'),
  async (req, res) => {
    try {
      const { flowId } = req.params;
      const uid = req.decode.uid;

      const versions = await query(
        `SELECT v.id, v.version, v.status, v.name, v.created_at, v.published_at, v.created_by, v.published_by, 
              v.release_tag, v.version_notes, v.rollback_source_version, v.checksum,
              m.conversation_count, m.success_rate, m.fallback_rate, m.ai_calls, m.average_latency, m.average_cost
       FROM automation_flow_versions v
       LEFT JOIN automation_flow_version_metrics m ON m.version_id = v.id
       WHERE v.flow_id = ? AND v.uid = ? 
       ORDER BY v.version DESC`,
        [flowId, uid],
      );

      await logActivity(req, 'Automation', 'history_view', flowId);
      res.json({ success: true, data: versions });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to load flow versions' });
    }
  },
);

// GET /api/chatbot-automation/flows/:flowId/versions/:version
router.get(
  '/flows/:flowId/versions/:version',
  validateUserOrAgent,
  verifyPermission('automation.history'),
  async (req, res) => {
    try {
      const { flowId, version } = req.params;
      const uid = req.decode.uid;

      const [ver] = await query(
        `SELECT * FROM automation_flow_versions WHERE flow_id = ? AND uid = ? AND version = ?`,
        [flowId, uid, version],
      );

      if (!ver) {
        return res.status(404).json({ success: false, msg: 'Version not found' });
      }

      const [metrics] = await query(
        `SELECT * FROM automation_flow_version_metrics WHERE version_id = ?`,
        [ver.id],
      );

      const flowJson =
        typeof ver.flow_json === 'string' ? JSON.parse(ver.flow_json) : ver.flow_json;
      const nodes = flowJson.nodes || [];
      const edges = flowJson.edges || [];

      const formattedNodes = nodes.map((n) => {
        let nodeData = n.data || {};
        if ((n.type === 'AI Transfer' || n.type === 'ai-transfer') && nodeData.apiKey) {
          nodeData.apiKey = '••••••••••••••••';
        }
        return {
          id: n.id,
          type: n.type,
          position: n.position || { x: 0, y: 0 },
          data: nodeData,
        };
      });

      const formattedEdges = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      }));

      await logActivity(req, 'Automation', 'version_view', flowId, { version });

      res.json({
        success: true,
        version: {
          id: ver.flow_id,
          version: ver.version,
          title: ver.name,
          name: ver.name,
          status: ver.status,
          createdAt: ver.created_at,
          publishedAt: ver.published_at,
          createdBy: ver.created_by,
          publishedBy: ver.published_by,
          releaseTag: ver.release_tag,
          versionNotes: ver.version_notes,
          checksum: ver.checksum,
          rollbackSource: ver.rollback_source_version,
          metrics: metrics || {
            conversation_count: 0,
            success_rate: 0.0,
            fallback_rate: 0.0,
            ai_calls: 0,
            average_latency: 0,
            average_cost: 0.0,
          },
        },
        nodes: formattedNodes,
        edges: formattedEdges,
      });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to load version details' });
    }
  },
);

// GET /api/chatbot-automation/flows/:flowId/versions/:version/export
router.get(
  '/flows/:flowId/versions/:version/export',
  validateUserOrAgent,
  verifyPermission('automation.export'),
  async (req, res) => {
    try {
      const { flowId, version } = req.params;
      const uid = req.decode.uid;

      const [ver] = await query(
        `SELECT * FROM automation_flow_versions WHERE flow_id = ? AND uid = ? AND version = ?`,
        [flowId, uid, version],
      );

      if (!ver) {
        return res.status(404).json({ success: false, msg: 'Version not found' });
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="flow_${flowId}_v${version}.json"`,
      );
      res.json({
        flowId: ver.flow_id,
        version: ver.version,
        name: ver.name,
        flow_json: typeof ver.flow_json === 'string' ? JSON.parse(ver.flow_json) : ver.flow_json,
        checksum: ver.checksum,
        release_tag: ver.release_tag,
      });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to export flow version' });
    }
  },
);

// POST /api/chatbot-automation/flows/import
router.post(
  '/flows/import',
  validateUserOrAgent,
  verifyPermission('automation.import'),
  async (req, res) => {
    try {
      const { flowId, name, flow_json, versionNotes } = req.body;
      const uid = req.decode.uid;
      const userId = req.decode.agentUid || req.decode.uid;

      if (!flowId || !name || !flow_json) {
        return res
          .status(400)
          .json({ success: false, msg: 'flowId, name, and flow_json are required' });
      }

      const checksum = crypto.createHash('sha256').update(JSON.stringify(flow_json)).digest('hex');

      await withTransaction(async (tx) => {
        // Check if flow exists
        const [existing] = await tx(
          `SELECT * FROM automation_flows WHERE flow_id = ? AND uid = ?`,
          [flowId, uid],
        );
        let revision = 1;

        if (existing) {
          revision = existing.revision + 1;
          await tx(
            `UPDATE automation_flows SET name = ?, revision = ?, last_saved_at = CURRENT_TIMESTAMP, last_saved_by = ?
           WHERE flow_id = ? AND uid = ?`,
            [name, revision, userId, flowId, uid],
          );
        } else {
          await tx(
            `INSERT INTO automation_flows (uid, flow_id, name, revision, last_saved_by) 
           VALUES (?, ?, ?, 1, ?)`,
            [uid, flowId, name, userId],
          );
        }

        // Insert new draft version
        const [latest] = await tx(
          `SELECT version FROM automation_flow_versions WHERE flow_id = ? AND uid = ? ORDER BY version DESC LIMIT 1`,
          [flowId, uid],
        );
        const nextVer = latest ? latest.version + 1 : 1;

        await tx(
          `INSERT INTO automation_flow_versions (
          uid, flow_id, version, status, name, flow_json, created_by, version_notes, checksum, release_tag, revision
        ) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, 'Imported', ?)`,
          [
            uid,
            flowId,
            nextVer,
            name,
            JSON.stringify(flow_json),
            userId,
            versionNotes || 'Imported flow schema',
            checksum,
            revision,
          ],
        );
      });

      await logActivity(req, 'Automation', 'flow_import', flowId);
      res.json({ success: true, msg: 'Flow version imported successfully as a new draft' });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to import flow version' });
    }
  },
);

// POST /api/chatbot-automation/flows/:flowId/template
router.post(
  '/flows/:flowId/template',
  validateUserOrAgent,
  verifyPermission('automation.template'),
  async (req, res) => {
    try {
      const { flowId } = req.params;
      const { version, category, description, isTemplate } = req.body;
      const uid = req.decode.uid;

      const [ver] = await query(
        `SELECT id, name FROM automation_flow_versions WHERE flow_id = ? AND uid = ? AND version = ?`,
        [flowId, uid, version],
      );

      if (!ver) {
        return res.status(404).json({ success: false, msg: 'Specified version not found' });
      }

      if (isTemplate) {
        await query(
          `INSERT INTO flow_templates (uid, version_id, name, category, description, author)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (version_id) DO UPDATE SET category = EXCLUDED.category, description = EXCLUDED.description`,
          [uid, ver.id, ver.name, category || 'General', description || '', req.decode.email],
        );
        await logActivity(req, 'Automation', 'template_create', flowId, { version });
        res.json({ success: true, msg: 'Version marked as a reusable template' });
      } else {
        await query(`DELETE FROM flow_templates WHERE version_id = ?`, [ver.id]);
        await logActivity(req, 'Automation', 'template_remove', flowId, { version });
        res.json({ success: true, msg: 'Version removed from templates' });
      }
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to configure template settings' });
    }
  },
);

// POST /api/chatbot-automation/flows/clone-template
router.post(
  '/flows/clone-template',
  validateUserOrAgent,
  verifyPermission('automation.template'),
  async (req, res) => {
    try {
      const { templateId, name } = req.body;
      const uid = req.decode.uid;
      const userId = req.decode.agentUid || req.decode.uid;

      const [template] = await query(
        `SELECT t.*, v.flow_json FROM flow_templates t
       JOIN automation_flow_versions v ON t.version_id = v.id
       WHERE t.id = ?`,
        [templateId],
      );

      if (!template) {
        return res.status(404).json({ success: false, msg: 'Template not found' });
      }

      const newFlowId = `flow-${Date.now()}`;
      const cloneName = name || `${template.name} Clone`;

      const checksum = crypto
        .createHash('sha256')
        .update(JSON.stringify(template.flow_json))
        .digest('hex');

      await withTransaction(async (tx) => {
        // 1. Create flow header
        await tx(
          `INSERT INTO automation_flows (uid, flow_id, name, revision, last_saved_by, locked_by, locked_at) 
         VALUES (?, ?, ?, 1, ?, ?, CURRENT_TIMESTAMP)`,
          [uid, newFlowId, cloneName, userId, userId],
        );

        // 2. Create version 1 draft
        await tx(
          `INSERT INTO automation_flow_versions (
          uid, flow_id, version, status, name, flow_json, created_by, version_notes, checksum, release_tag, revision
        ) VALUES (?, ?, 1, 'draft', ?, ?, ?, 'Cloned from template', ?, 'Initial', 1)`,
          [uid, newFlowId, cloneName, JSON.stringify(template.flow_json), userId, checksum],
        );

        // 3. Increment download counter
        await tx(`UPDATE flow_templates SET downloads = downloads + 1 WHERE id = ?`, [templateId]);
      });

      await logActivity(req, 'Automation', 'template_clone', newFlowId, { templateId });
      res.json({ success: true, msg: 'Template cloned successfully', flowId: newFlowId });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to clone template' });
    }
  },
);

// POST /api/chatbot-automation/flows/delete
router.post(
  '/flows/delete',
  validateUserOrAgent,
  verifyPermission('automation.edit'),
  async (req, res) => {
    try {
      const { flowId } = req.body;
      const uid = req.decode.uid;

      await withTransaction(async (tx) => {
        // Delete versions (which cascade deletes metrics and templates)
        await tx(`DELETE FROM automation_flow_versions WHERE flow_id = ? AND uid = ?`, [
          flowId,
          uid,
        ]);

        // Delete active flow header
        await tx(`DELETE FROM automation_flows WHERE flow_id = ? AND uid = ?`, [flowId, uid]);

        // Invalidate chatbot mapping
        await tx(`UPDATE chatbot SET flow_id = NULL, active = 0 WHERE flow_id = ? AND uid = ?`, [
          flowId,
          uid,
        ]);
      });

      await logActivity(req, 'Automation', 'flow_delete', flowId);
      res.json({ success: true, msg: 'Flow deleted successfully' });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to delete flow' });
    }
  },
);

// POST /api/chatbot-automation/flows/duplicate
router.post(
  '/flows/duplicate',
  validateUserOrAgent,
  verifyPermission('automation.edit'),
  async (req, res) => {
    try {
      const { flowId } = req.body;
      const uid = req.decode.uid;
      const userId = req.decode.agentUid || req.decode.uid;

      const [flow] = await query(`SELECT * FROM automation_flows WHERE flow_id = ? AND uid = ?`, [
        flowId,
        uid,
      ]);
      if (!flow) {
        return res.json({ success: false, msg: 'Flow not found' });
      }

      // Get latest version
      const [latestVer] = await query(
        `SELECT flow_json FROM automation_flow_versions WHERE flow_id = ? AND uid = ? ORDER BY version DESC LIMIT 1`,
        [flowId, uid],
      );

      let flowJson = { nodes: [], edges: [] };
      if (latestVer) {
        flowJson =
          typeof latestVer.flow_json === 'string'
            ? JSON.parse(latestVer.flow_json)
            : latestVer.flow_json;
      } else {
        // Fallback from cache tables
        const nodes = await query(`SELECT * FROM automation_nodes WHERE flow_id = ?`, [flowId]);
        const edges = await query(`SELECT * FROM automation_edges WHERE flow_id = ?`, [flowId]);
        flowJson = {
          nodes: nodes.map((n) => ({
            id: n.node_id,
            type: n.type,
            position: { x: parseFloat(n.position_x), y: parseFloat(n.position_y) },
            data: JSON.parse(n.data || '{}'),
          })),
          edges: edges.map((e) => ({
            id: e.edge_id,
            source: e.source,
            target: e.target,
            sourceHandle: e.source_handle,
            targetHandle: e.target_handle,
          })),
        };
      }

      const newFlowId = `flow-${Date.now()}`;
      const newName = `${flow.name} (Copy)`;
      const checksum = crypto.createHash('sha256').update(JSON.stringify(flowJson)).digest('hex');

      await withTransaction(async (tx) => {
        await tx(
          `INSERT INTO automation_flows (uid, flow_id, name, revision, last_saved_by, locked_by, locked_at) 
         VALUES (?, ?, ?, 1, ?, ?, CURRENT_TIMESTAMP)`,
          [uid, newFlowId, newName, userId, userId],
        );

        await tx(
          `INSERT INTO automation_flow_versions (
          uid, flow_id, version, status, name, flow_json, created_by, version_notes, checksum, release_tag, revision
        ) VALUES (?, ?, 1, 'draft', ?, ?, ?, 'Duplicated from ' || ?, ?, 'Initial', 1)`,
          [uid, newFlowId, newName, JSON.stringify(flowJson), userId, flow.name, checksum],
        );
      });

      // Background cache warming for simulation testing
      setImmediate(async () => {
        try {
          await warmRuntimeCache(newFlowId, flowJson);
        } catch (e) {
          console.error('Duplicate warm cache error:', e);
        }
      });

      await logActivity(req, 'Automation', 'flow_duplicate', flowId, { newFlowId });
      res.json({ success: true, msg: 'Flow duplicated successfully', flowId: newFlowId });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to duplicate flow' });
    }
  },
);

// POST /api/chatbot-automation/flows/test
router.post(
  '/flows/test',
  validateUserOrAgent,
  verifyPermission('automation.edit'),
  async (req, res) => {
    try {
      const { flowId, message, phone, variables, name } = req.body;
      const uid = req.decode.uid;

      const executionId = await startFlow(
        flowId,
        message || 'hi',
        phone || '+15550001111',
        name || 'Test User',
        uid,
        null,
        true,
        variables || {},
      );

      if (!executionId) {
        return res.json({ success: false, msg: 'Simulation failed to start' });
      }

      const [exec] = await query(`SELECT * FROM flow_executions WHERE id = ?`, [executionId]);

      const logs = await query(
        `SELECT * FROM flow_execution_logs WHERE execution_id = ? ORDER BY id ASC`,
        [executionId],
      );

      res.json({
        success: true,
        execution: {
          status: exec.status,
          currentNode: exec.current_node_id,
          variables: JSON.parse(exec.variables || '{}'),
          labels: JSON.parse(exec.labels || '[]'),
          executionPath: JSON.parse(exec.execution_path || '[]'),
        },
        logs: logs.map((l) => ({
          nodeId: l.node_id,
          status: l.status,
          errorMessage: l.error_message,
          executionTime: l.execution_time,
          timestamp: l.created_at,
        })),
      });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to execute simulation' });
    }
  },
);

// GET /api/chatbot-automation/logs
router.get('/logs', validateUserOrAgent, verifyPermission('automation.read'), async (req, res) => {
  try {
    const data = await query(
      `SELECT l.*, f.name as flow_name 
       FROM flow_execution_logs l
       JOIN automation_flows f ON l.flow_id = f.flow_id
       WHERE f.uid = ?
       ORDER BY l.id DESC LIMIT 100`,
      [req.decode.uid],
    );
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: 'Failed to load logs' });
  }
});

// GET /api/chatbot-automation/forms
router.get('/forms', validateUserOrAgent, verifyPermission('automation.read'), async (req, res) => {
  try {
    const data = await query(
      `SELECT * FROM whatsapp_forms WHERE uid = ? ORDER BY created_at DESC`,
      [req.decode.uid],
    );
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: 'Failed to load WhatsApp forms' });
  }
});

// GET /api/chatbot-automation/labels
router.get('/labels', validateUserOrAgent, verifyPermission('inbox.read'), async (req, res) => {
  try {
    const data = await query(`SELECT * FROM chat_tags WHERE uid = ? ORDER BY title ASC`, [
      req.decode.uid,
    ]);
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: 'Failed to load labels' });
  }
});

// GET /api/chatbot-automation/templates
router.get('/templates', validateUserOrAgent, verifyPermission('inbox.read'), async (req, res) => {
  try {
    const data = await query(`SELECT * FROM templets WHERE uid = ? ORDER BY id DESC`, [
      req.decode.uid,
    ]);
    const formatted = data.map((t) => {
      let parsed = {};
      try {
        parsed = JSON.parse(t.content || '{}');
      } catch {
        parsed = {};
      }
      return {
        id: t.id,
        title: t.title,
        category: parsed.category || t.category || 'UTILITY',
        language: parsed.language || t.language || 'en_US',
        status: t.status || 'APPROVED',
        content: t.content,
        components: parsed.components || [],
      };
    });
    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: 'Failed to load templates' });
  }
});

// GET /api/chatbot-automation/ai-execution-logs
router.get('/ai-execution-logs', validateUserOrAgent, async (req, res) => {
  try {
    const userId = req.decode.agentUid || req.decode.uid;
    const canInspect = await hasPermission(userId, 'ai.inspector');
    const canExecute = await hasPermission(userId, 'ai.execution');

    if (!canInspect && !canExecute) {
      return res
        .status(403)
        .json({ success: false, msg: 'Permission denied', code: 'PERMISSION_DENIED' });
    }

    const logs = await query(
      `SELECT * FROM ai_execution_logs WHERE uid = ? ORDER BY timestamp DESC LIMIT 100`,
      [req.decode.uid],
    );

    // Sanitize logs based on permissions
    const viewPrompt = await hasPermission(userId, 'ai.prompt');
    const viewPayload = await hasPermission(userId, 'ai.payload');
    const viewExecution = await hasPermission(userId, 'ai.execution');
    const viewChunks = await hasPermission(userId, 'ai.chunks');
    const viewSources = await hasPermission(userId, 'ai.sources');

    const sanitizedLogs = logs.map((log) => {
      const sanitized = { ...log };

      // Parse JSON columns
      let llm = {};
      let vec = {};
      let kw = {};
      let merged = {};
      let builder = {};

      try {
        llm = JSON.parse(log.llm_call || '{}');
      } catch (e) {}
      try {
        vec = JSON.parse(log.vector_retrieval || '{}');
      } catch (e) {}
      try {
        kw = JSON.parse(log.keyword_retrieval || '{}');
      } catch (e) {}
      try {
        merged = JSON.parse(log.merged_context || '{}');
      } catch (e) {}
      try {
        builder = JSON.parse(log.flow_builder || '{}');
      } catch (e) {}

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
        merged.finalChunksSelected = merged.finalChunksSelected.map((chunk) => {
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

    await logActivity(req, 'AI', 'ai_inspector_open');

    res.json({ success: true, data: sanitizedLogs });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: 'Failed to load AI execution logs' });
  }
});

// GET /api/chatbot-automation/ai-execution-detail
router.get('/ai-execution-detail', validateUserOrAgent, async (req, res) => {
  try {
    const userId = req.decode.agentUid || req.decode.uid;
    const { msgText, executionId } = req.query;

    if (!msgText && !executionId) {
      return res
        .status(400)
        .json({ success: false, msg: 'msgText or executionId parameter is required' });
    }

    let rows;
    if (executionId) {
      rows = await query(
        `SELECT * FROM ai_execution_logs WHERE uid = ? AND execution_id = ? LIMIT 1`,
        [req.decode.uid, executionId],
      );
    } else {
      // Match logs where the flow builder's aiResponseValue contains or equals msgText
      rows = await query(
        `SELECT * FROM ai_execution_logs 
         WHERE uid = ? AND flow_builder LIKE ? 
         ORDER BY timestamp DESC LIMIT 1`,
        [req.decode.uid, `%${msgText}%`],
      );
    }

    if (rows.length === 0) {
      return res.json({ success: false, msg: 'No matching AI execution found' });
    }

    const log = rows[0];

    // Check permissions
    const viewSources = await hasPermission(userId, 'ai.sources');
    const viewChunks = await hasPermission(userId, 'ai.chunks');
    const viewExecution = await hasPermission(userId, 'ai.execution');
    const viewPayload = await hasPermission(userId, 'ai.payload');
    const viewPrompt = await hasPermission(userId, 'ai.prompt');

    let llm = {};
    let merged = {};
    let vec = {};
    let kw = {};

    try {
      llm = JSON.parse(log.llm_call || '{}');
    } catch (e) {}
    try {
      merged = JSON.parse(log.merged_context || '{}');
    } catch (e) {}
    try {
      vec = JSON.parse(log.vector_retrieval || '{}');
    } catch (e) {}
    try {
      kw = JSON.parse(log.keyword_retrieval || '{}');
    } catch (e) {}

    // Calculate RAG Confidence dynamically
    let confidencePercentage = 0;
    let confidenceLabel = 'Low';

    if (merged.finalChunksSelected && merged.finalChunksSelected.length > 0) {
      // Find max similarity score from vector chunks
      const vectorScores = merged.finalChunksSelected
        .filter((c) => c.type === 'vector' || c.type === 'hybrid')
        .map((c) => c.vectorScore || 0);
      const maxVectorScore = vectorScores.length > 0 ? Math.max(...vectorScores) : 0;

      // Find max keyword score
      const keywordScores = merged.finalChunksSelected
        .filter((c) => c.type === 'keyword' || c.type === 'hybrid')
        .map((c) => c.keywordScore || 0);
      const maxKeywordScore = keywordScores.length > 0 ? Math.max(...keywordScores) : 0;

      // Calculate overall confidence (weighted: vector 70% + keyword 30%)
      confidencePercentage = Math.round(
        maxVectorScore * 70 + Math.min(1, maxKeywordScore / 2) * 30,
      );
      confidencePercentage = Math.max(10, Math.min(100, confidencePercentage));

      if (confidencePercentage >= 70) {
        confidenceLabel = 'High';
      } else if (confidencePercentage >= 40) {
        confidenceLabel = 'Medium';
      }
    }

    // Build sanitized response object
    const resultDetails = {
      execution_id: log.execution_id,
      flow_id: log.flow_id,
      node_id: log.node_id,
      timestamp: log.timestamp,
    };

    if (viewExecution) {
      resultDetails.confidence_percentage = confidencePercentage;
      resultDetails.confidence_label = confidenceLabel;
      resultDetails.latency = llm.latency || 0;
      resultDetails.tokenEstimate = llm.tokenEstimate || 0;
    }

    if (viewPayload) {
      resultDetails.model = llm.model || 'gemini-embedding-001';
      resultDetails.provider = llm.provider || 'gemini';
    }

    if (viewSources && merged.finalChunksSelected) {
      resultDetails.sources = merged.finalChunksSelected.map((c) => c.title).filter(Boolean);
      // Deduplicate sources
      resultDetails.sources = [...new Set(resultDetails.sources)];
    }

    if (viewChunks && merged.finalChunksSelected) {
      resultDetails.chunks = merged.finalChunksSelected.map((c) => ({
        chunk_id: c.chunk_id,
        title: viewSources ? c.title : 'Document',
        content: c.content || c.text,
        vectorScore: c.vectorScore,
        keywordScore: c.keywordScore,
        freshnessScore: c.freshnessScore,
        finalScore: c.finalScore,
        type: c.type,
      }));
    }

    // Audit logs for prompt views/payload views
    if (viewPrompt) {
      await logActivity(req, 'AI', 'ai_view_prompt', log.execution_id, null, log.execution_id);
    }
    if (viewPayload) {
      await logActivity(req, 'AI', 'ai_view_payload', log.execution_id, null, log.execution_id);
    }

    await logActivity(req, 'AI', 'ai_view_detail', log.execution_id, null, log.execution_id);

    res.json({ success: true, data: resultDetails });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: 'Failed to load execution details' });
  }
});

// POST /api/chatbot-automation/suggest-response
router.post('/suggest-response', validateUserOrAgent, async (req, res) => {
  try {
    const { chatId } = req.body;
    if (!chatId) {
      return res.status(400).json({ success: false, msg: 'chatId parameter is required' });
    }

    const userId = req.decode.agentUid || req.decode.uid;
    const canExecute = await hasPermission(userId, 'ai.execution');

    if (!canExecute) {
      return res
        .status(403)
        .json({ success: false, msg: 'Permission denied', code: 'PERMISSION_DENIED' });
    }

    const { validatePath } = require('../utils/pathSafe');
    const rootInboxDir = path.resolve(__dirname, '../conversations/inbox');
    const conversationPath = validatePath(rootInboxDir, `${req.decode.uid}/${chatId}.json`);
    if (!conversationPath) {
      return res.status(400).json({ success: false, msg: 'Invalid parameters' });
    }
    let lastIncomingMsg = 'hello';
    if (fs.existsSync(conversationPath)) {
      try {
        const messages = JSON.parse(fs.readFileSync(conversationPath, 'utf8'));
        if (Array.isArray(messages)) {
          const incoming = [...messages].reverse().find((m) => m.route === 'INCOMING');
          if (incoming) {
            lastIncomingMsg = incoming.msgContext?.text?.body || incoming.content || 'hello';
          }
        }
      } catch (e) {
        console.error('Failed to parse conversation json', e);
      }
    }

    // 2. Locate active flow id for workspace
    const [chatbot] = await query(
      'SELECT flow_id FROM chatbot WHERE uid = ? AND active = 1 LIMIT 1',
      [req.decode.uid],
    );
    let flowId = chatbot?.flow_id;
    if (!flowId) {
      const [latestFlow] = await query(
        'SELECT flow_id FROM automation_flows WHERE uid = ? ORDER BY updated_at DESC LIMIT 1',
        [req.decode.uid],
      );
      flowId = latestFlow?.flow_id;
    }

    if (!flowId) {
      return res.json({
        success: false,
        msg: 'No active automation flow found for this workspace.',
      });
    }

    // 3. Trigger flow runner in test mode to generate suggestion
    const { startFlow } = require('../functions/chatbotAutomationEngine');
    const executionId = await startFlow(
      flowId,
      lastIncomingMsg,
      chatId, // senderNumber
      'Inbox Suggestion', // name
      req.decode.uid, // tenant uid
      null, // chatbot
      true, // isTest = true
    );

    if (!executionId) {
      return res.json({ success: false, msg: 'Failed to generate suggestion.' });
    }

    // 4. Fetch the generated execution log
    const rows = await query(
      `SELECT * FROM ai_execution_logs WHERE uid = ? AND flow_id = ? ORDER BY timestamp DESC LIMIT 1`,
      [req.decode.uid, String(flowId)],
    );

    if (rows.length === 0) {
      return res.json({ success: false, msg: 'No suggestion execution details found' });
    }

    const log = rows[0];

    // Check granular permissions for response details sanitization
    const viewSources = await hasPermission(userId, 'ai.sources');
    const viewChunks = await hasPermission(userId, 'ai.chunks');
    const viewExecution = await hasPermission(userId, 'ai.execution');
    const viewPayload = await hasPermission(userId, 'ai.payload');
    const viewPrompt = await hasPermission(userId, 'ai.prompt');

    let llm = {};
    let merged = {};
    let vec = {};
    let kw = {};

    try {
      llm = JSON.parse(log.llm_call || '{}');
    } catch (e) {}
    try {
      merged = JSON.parse(log.merged_context || '{}');
    } catch (e) {}
    try {
      vec = JSON.parse(log.vector_retrieval || '{}');
    } catch (e) {}
    try {
      kw = JSON.parse(log.keyword_retrieval || '{}');
    } catch (e) {}

    // Calculate RAG Confidence dynamically
    let confidencePercentage = 0;
    let confidenceLabel = 'Low';

    if (merged.finalChunksSelected && merged.finalChunksSelected.length > 0) {
      const vectorScores = merged.finalChunksSelected
        .filter((c) => c.type === 'vector' || c.type === 'hybrid')
        .map((c) => c.vectorScore || 0);
      const maxVectorScore = vectorScores.length > 0 ? Math.max(...vectorScores) : 0;

      const keywordScores = merged.finalChunksSelected
        .filter((c) => c.type === 'keyword' || c.type === 'hybrid')
        .map((c) => c.keywordScore || 0);
      const maxKeywordScore = keywordScores.length > 0 ? Math.max(...keywordScores) : 0;

      confidencePercentage = Math.round(
        maxVectorScore * 70 + Math.min(1, maxKeywordScore / 2) * 30,
      );
      confidencePercentage = Math.max(10, Math.min(100, confidencePercentage));

      if (confidencePercentage >= 70) {
        confidenceLabel = 'High';
      } else if (confidencePercentage >= 40) {
        confidenceLabel = 'Medium';
      }
    }

    const resultDetails = {
      execution_id: log.execution_id,
      flow_id: log.flow_id,
      node_id: log.node_id,
      timestamp: log.timestamp,
      suggestedResponse:
        llm.responsePayload?.choices?.[0]?.message?.content ||
        llm.responsePayload?.candidates?.[0]?.content?.parts?.[0]?.text ||
        '',
    };

    if (!resultDetails.suggestedResponse && log.result) {
      try {
        resultDetails.suggestedResponse = JSON.parse(log.result)?.response || '';
      } catch (e) {}
    }

    if (!resultDetails.suggestedResponse) {
      let flowBuilderData = {};
      try {
        flowBuilderData = JSON.parse(log.flow_builder || '{}');
      } catch (e) {}
      resultDetails.suggestedResponse = flowBuilderData.aiResponseValue || '';
    }

    if (viewExecution) {
      resultDetails.confidence_percentage = confidencePercentage;
      resultDetails.confidence_label = confidenceLabel;
      resultDetails.latency = llm.latency || 0;
      resultDetails.tokenEstimate = llm.tokenEstimate || 0;
    }

    if (viewPayload) {
      resultDetails.model = llm.model || 'gemini-1.5-flash';
      resultDetails.provider = llm.provider || 'gemini';
      resultDetails.systemPrompt = viewPrompt ? llm.systemPrompt || '' : undefined;
      resultDetails.userPrompt = viewPrompt ? llm.userPrompt || '' : undefined;
      resultDetails.rawPayload = llm;
    }

    if (viewSources && merged.finalChunksSelected) {
      resultDetails.sources = merged.finalChunksSelected.map((c) => c.title).filter(Boolean);
      resultDetails.sources = [...new Set(resultDetails.sources)];
    }

    if (viewChunks && merged.finalChunksSelected) {
      resultDetails.chunks = merged.finalChunksSelected.map((c) => ({
        chunk_id: c.chunk_id,
        title: viewSources ? c.title : 'Document',
        content: c.content || c.text,
        vectorScore: c.vectorScore,
        keywordScore: c.keywordScore,
        freshnessScore: c.freshnessScore,
        finalScore: c.finalScore,
        type: c.type,
      }));
    }

    await logActivity(req, 'AI', 'ai_suggest_response', chatId, { executionId });

    res.json({ success: true, data: resultDetails });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: 'Failed to generate AI suggestion response' });
  }
});

// POST /api/chatbot-automation/toggle-autopilot
router.post('/toggle-autopilot', validateUserOrAgent, async (req, res) => {
  try {
    const { chatId, paused } = req.body;
    if (!chatId) {
      return res.status(400).json({ success: false, msg: 'chatId parameter is required' });
    }

    const userId = req.decode.agentUid || req.decode.uid;
    const canReply = await hasPermission(userId, 'inbox.reply');

    if (!canReply) {
      return res
        .status(403)
        .json({ success: false, msg: 'Permission denied', code: 'PERMISSION_DENIED' });
    }

    const disabledUntil = paused ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;

    const [existing] = await query('SELECT id FROM contact WHERE uid = ? AND mobile = ? LIMIT 1', [
      req.decode.uid,
      chatId,
    ]);
    if (existing) {
      await query('UPDATE contact SET auto_reply_disabled_until = ? WHERE uid = ? AND mobile = ?', [
        disabledUntil,
        req.decode.uid,
        chatId,
      ]);
    } else {
      await query(
        'INSERT INTO contact (uid, mobile, name, auto_reply_disabled_until) VALUES (?, ?, ?, ?)',
        [req.decode.uid, chatId, 'WhatsApp User', disabledUntil],
      );
    }

    await logActivity(req, 'AI', paused ? 'ai_autopilot_pause' : 'ai_autopilot_resume', chatId, {
      disabledUntil,
    });

    res.json({
      success: true,
      msg: paused ? 'Autopilot paused for 24 hours' : 'Autopilot resumed successfully',
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: 'Failed to toggle autopilot status' });
  }
});

// POST /api/chatbot-automation/ai-feedback
router.post('/ai-feedback', validateUserOrAgent, async (req, res) => {
  try {
    const { executionId, rating, comment, model, flowId, conversationId } = req.body;
    if (!executionId || !rating) {
      return res.status(400).json({ success: false, msg: 'executionId and rating are required' });
    }

    const userId = req.decode.agentUid || req.decode.uid;

    await query(
      `INSERT INTO ai_feedback (uid, user_id, execution_id, rating, comment, model, flow_id, conversation_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.decode.uid,
        userId,
        executionId,
        rating,
        comment || null,
        model || null,
        flowId || null,
        conversationId || null,
      ],
    );

    await logActivity(req, 'AI', 'ai_feedback_submit', executionId, { rating, comment });

    res.json({ success: true, msg: 'Feedback stored successfully' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: 'Failed to save feedback' });
  }
});

module.exports = router;
