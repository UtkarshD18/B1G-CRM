const router = require("express").Router();
const { query, withTransaction } = require("../database/dbpromise.js");
const validateUser = require("../middlewares/user.js");

// GET all leads grouped by stage or in list
router.get("/leads", validateUser, async (req, res) => {
  try {
    const leads = await query(
      `SELECT cl.*, a.name as owner_name 
       FROM crm_leads cl
       LEFT JOIN agents a ON cl.owner_agent_uid = a.uid
       WHERE cl.uid = ? 
       ORDER BY cl.pipeline_order ASC, cl.updated_at DESC`,
      [req.decode.uid]
    );
    res.json({ success: true, data: leads });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to fetch CRM leads" });
  }
});

// POST to create a lead
router.post("/leads/add", validateUser, async (req, res) => {
  try {
    const { name, mobile, stage, owner_agent_uid, notes, value } = req.body;
    if (!name || !mobile) {
      return res.json({ success: false, msg: "Name and Mobile are required" });
    }

    const result = await withTransaction(async (tx) => {
      const resLead = await tx(
        `INSERT INTO crm_leads (uid, name, mobile, stage, owner_agent_uid, notes, value) 
         VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
        [
          req.decode.uid,
          name,
          mobile,
          stage || "Lead",
          owner_agent_uid || null,
          notes || "",
          value || 0.0
        ]
      );

      // Log initial activity
      await tx(
        "INSERT INTO crm_lead_activities (uid, lead_id, activity_type, description, agent_uid) VALUES (?, ?, 'note', ?, ?)",
        [req.decode.uid, resLead[0].id, "Lead created in system", owner_agent_uid || null]
      );

      return resLead;
    });

    res.json({ success: true, msg: "Lead created successfully.", data: result[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to create lead" });
  }
});

// POST to move/change lead stage
router.post("/leads/move", validateUser, async (req, res) => {
  try {
    const { id, stage } = req.body;
    if (!id || !stage) {
      return res.json({ success: false, msg: "Lead ID and target stage are required" });
    }

    const previous = await query("SELECT stage FROM crm_leads WHERE id = ? AND uid = ?", [id, req.decode.uid]);
    if (previous.length === 0) {
      return res.json({ success: false, msg: "Lead record not found" });
    }

    await withTransaction(async (tx) => {
      await tx(
        "UPDATE crm_leads SET stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND uid = ?",
        [stage, id, req.decode.uid]
      );

      // Log activity
      await tx(
        "INSERT INTO crm_lead_activities (uid, lead_id, activity_type, description) VALUES (?, ?, 'note', ?)",
        [req.decode.uid, id, `Stage shifted from '${previous[0].stage}' to '${stage}'`]
      );
    });

    res.json({ success: true, msg: "Lead moved successfully." });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to move lead" });
  }
});

// POST to update full lead details
router.post("/leads/update", validateUser, async (req, res) => {
  try {
    const { id, name, mobile, stage, owner_agent_uid, notes, value } = req.body;
    if (!id) {
      return res.json({ success: false, msg: "Lead ID is required" });
    }

    const result = await withTransaction(async (tx) => {
      const resLead = await tx(
        `UPDATE crm_leads 
         SET name = ?, mobile = ?, stage = ?, owner_agent_uid = ?, notes = ?, value = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ? AND uid = ? RETURNING *`,
        [
          name,
          mobile,
          stage,
          owner_agent_uid || null,
          notes || "",
          value || 0.0,
          id,
          req.decode.uid
        ]
      );

      if (resLead.length === 0) {
        throw new Error("Lead not found");
      }

      // Log update activity
      await tx(
        "INSERT INTO crm_lead_activities (uid, lead_id, activity_type, description, agent_uid) VALUES (?, ?, 'note', ?, ?)",
        [req.decode.uid, id, "Lead info details updated", owner_agent_uid || null]
      );

      return resLead;
    });

    res.json({ success: true, msg: "Lead details updated.", data: result[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: err.message === "Lead not found" ? "Lead not found" : "Failed to update lead" });
  }
});

// REMINDERS API

// GET reminders for a lead
router.get("/leads/reminders/:leadId", validateUser, async (req, res) => {
  try {
    const leadCheck = await query("SELECT id FROM crm_leads WHERE id = ? AND uid = ?", [req.params.leadId, req.decode.uid]);
    if (leadCheck.length === 0) {
      return res.json({ success: false, msg: "Lead not found or unauthorized" });
    }

    const data = await query(
      "SELECT * FROM crm_lead_reminders WHERE lead_id = ? AND uid = ? ORDER BY remind_at ASC",
      [req.params.leadId, req.decode.uid]
    );
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to retrieve reminders" });
  }
});

// POST to add a reminder
router.post("/leads/add_reminder", validateUser, async (req, res) => {
  try {
    const { lead_id, title, remind_at } = req.body;
    if (!lead_id || !title || !remind_at) {
      return res.json({ success: false, msg: "Missing reminder parameters" });
    }

    const leadCheck = await query("SELECT id FROM crm_leads WHERE id = ? AND uid = ?", [lead_id, req.decode.uid]);
    if (leadCheck.length === 0) {
      return res.json({ success: false, msg: "Lead not found or unauthorized" });
    }

    const result = await withTransaction(async (tx) => {
      const resRem = await tx(
        "INSERT INTO crm_lead_reminders (uid, lead_id, title, remind_at, status) VALUES (?, ?, ?, ?, 'PENDING') RETURNING *",
        [req.decode.uid, lead_id, title, remind_at]
      );

      // Log activity
      await tx(
        "INSERT INTO crm_lead_activities (uid, lead_id, activity_type, description) VALUES (?, ?, 'reminder', ?)",
        [req.decode.uid, lead_id, `Reminder scheduled: '${title}' at ${new Date(remind_at).toLocaleString()}`]
      );

      return resRem;
    });

    res.json({ success: true, msg: "Reminder scheduled successfully.", data: result[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to schedule reminder" });
  }
});

// ACTIVITIES API

// GET activities logs for a lead
router.get("/leads/activities/:leadId", validateUser, async (req, res) => {
  try {
    const leadCheck = await query("SELECT id FROM crm_leads WHERE id = ? AND uid = ?", [req.params.leadId, req.decode.uid]);
    if (leadCheck.length === 0) {
      return res.json({ success: false, msg: "Lead not found or unauthorized" });
    }

    const data = await query(
      `SELECT cla.*, a.name as agent_name 
       FROM crm_lead_activities cla
       LEFT JOIN agents a ON cla.agent_uid = a.uid
       WHERE cla.lead_id = ? AND cla.uid = ? ORDER BY cla.created_at DESC`,
      [req.params.leadId, req.decode.uid]
    );
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to retrieve activities" });
  }
});

// POST to add raw activity/note log
router.post("/leads/add_activity", validateUser, async (req, res) => {
  try {
    const { lead_id, activity_type, description, agent_uid } = req.body;
    if (!lead_id || !description) {
      return res.json({ success: false, msg: "Lead ID and description are required" });
    }

    const leadCheck = await query("SELECT id FROM crm_leads WHERE id = ? AND uid = ?", [lead_id, req.decode.uid]);
    if (leadCheck.length === 0) {
      return res.json({ success: false, msg: "Lead not found or unauthorized" });
    }

    const result = await query(
      "INSERT INTO crm_lead_activities (uid, lead_id, activity_type, description, agent_uid) VALUES (?, ?, ?, ?, ?) RETURNING *",
      [req.decode.uid, lead_id, activity_type || "note", description, agent_uid || null]
    );

    res.json({ success: true, msg: "Activity logged.", data: result[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to log activity" });
  }
});

// update custom CRM pipeline ordering for leads
router.post("/leads/update_pipeline_order", validateUser, async (req, res) => {
  try {
    const { orderedLeadIds } = req.body;
    if (!Array.isArray(orderedLeadIds)) {
      return res.json({ success: false, msg: "orderedLeadIds must be an array" });
    }

    await withTransaction(async (conn) => {
      for (let i = 0; i < orderedLeadIds.length; i++) {
        await conn(
          `UPDATE crm_leads SET pipeline_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND uid = ?`,
          [i, orderedLeadIds[i], req.decode.uid]
        );
      }
    });

    res.json({ success: true, msg: "CRM Pipeline order updated" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Failed to update pipeline order" });
  }
});

module.exports = router;
