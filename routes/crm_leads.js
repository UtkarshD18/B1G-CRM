const router = require('express').Router();
const { query, withTransaction } = require('../database/dbpromise.js');
const { validateUserOrAgent, verifyPermission } = require('../middlewares/auth.js');

async function syncLeadToContact(uid, name, mobile, oldMobile = null) {
  try {
    const pbName = 'CRM Leads';
    let pbId;

    // Get or create the phonebook 'CRM Leads'
    const existingPb = await query(`SELECT id FROM phonebook WHERE uid = ? AND name = ?`, [
      uid,
      pbName,
    ]);
    if (existingPb.length > 0) {
      pbId = existingPb[0].id;
    } else {
      const insertPb = await query(`INSERT INTO phonebook (uid, name) VALUES (?, ?) RETURNING id`, [
        uid,
        pbName,
      ]);
      pbId = insertPb[0]?.id;
    }

    if (!pbId) return;

    // If we are updating and the mobile number changed
    if (oldMobile && oldMobile !== mobile) {
      const checkOldContact = await query(`SELECT id FROM contact WHERE uid = ? AND mobile = ?`, [
        uid,
        oldMobile,
      ]);
      if (checkOldContact.length > 0) {
        await query(`UPDATE contact SET name = ?, mobile = ? WHERE uid = ? AND mobile = ?`, [
          name,
          mobile,
          uid,
          oldMobile,
        ]);
        return;
      }
    }

    // Check if contact with new mobile exists
    const checkContact = await query(`SELECT id FROM contact WHERE uid = ? AND mobile = ?`, [
      uid,
      mobile,
    ]);
    if (checkContact.length > 0) {
      await query(`UPDATE contact SET name = ? WHERE uid = ? AND mobile = ?`, [name, uid, mobile]);
    } else {
      await query(
        `INSERT INTO contact (uid, phonebook_id, phonebook_name, name, mobile) VALUES (?, ?, ?, ?, ?)`,
        [uid, pbId, pbName, name, mobile],
      );
    }
  } catch (err) {
    console.error('Failed to sync lead to contact:', err);
  }
}

async function deleteLeadContact(uid, mobile) {
  try {
    await query(`DELETE FROM contact WHERE uid = ? AND mobile = ?`, [uid, mobile]);
  } catch (err) {
    console.error('Failed to delete lead contact:', err);
  }
}

// GET all leads grouped by stage or in list
router.get('/leads', validateUserOrAgent, verifyPermission('leads_access'), async (req, res) => {
  try {
    const { stage, limit, offset } = req.query;

    let queryStr = `
      SELECT cl.*, a.name as owner_name 
      FROM crm_leads cl
      LEFT JOIN agents a ON cl.owner_agent_uid = a.uid
      WHERE cl.uid = ?
    `;
    const params = [req.decode.uid];

    if (stage) {
      queryStr += ` AND cl.stage = ?`;
      params.push(stage);
    }

    queryStr += ` ORDER BY cl.pipeline_order ASC, cl.updated_at DESC`;

    if (limit) {
      queryStr += ` LIMIT ?`;
      params.push(parseInt(limit));
    }
    if (offset) {
      queryStr += ` OFFSET ?`;
      params.push(parseInt(offset));
    }

    const leads = await query(queryStr, params);
    res.json({ success: true, data: leads });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: 'Failed to fetch CRM leads' });
  }
});

// POST to create a lead
router.post(
  '/leads/add',
  validateUserOrAgent,
  verifyPermission('leads_access'),
  async (req, res) => {
    try {
      const { name, mobile, stage, owner_agent_uid, notes, value } = req.body;
      if (!name || !mobile) {
        return res.json({ success: false, msg: 'Name and Mobile are required' });
      }

      if (req.decode.role === 'agent' && owner_agent_uid) {
        return res.json({
          success: false,
          msg: 'Only workspace owners can assign lead ownership.',
        });
      }

      const result = await withTransaction(async (tx) => {
        const resLead = await tx(
          `INSERT INTO crm_leads (uid, name, mobile, stage, owner_agent_uid, notes, value) 
         VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
          [
            req.decode.uid,
            name,
            mobile,
            stage || 'Lead',
            owner_agent_uid || null,
            notes || '',
            value || 0.0,
          ],
        );

        // Log initial activity
        await tx(
          "INSERT INTO crm_lead_activities (uid, lead_id, activity_type, description, agent_uid) VALUES (?, ?, 'note', ?, ?)",
          [req.decode.uid, resLead[0].id, 'Lead created in system', owner_agent_uid || null],
        );

        return resLead;
      });

      // Sync to contact table
      await syncLeadToContact(req.decode.uid, name, mobile);

      res.json({ success: true, msg: 'Lead created successfully.', data: result[0] });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to create lead' });
    }
  },
);

// POST to move/change lead stage
router.post(
  '/leads/move',
  validateUserOrAgent,
  verifyPermission('kanban_access'),
  async (req, res) => {
    try {
      const { id, stage } = req.body;
      if (!id || !stage) {
        return res.json({ success: false, msg: 'Lead ID and target stage are required' });
      }

      const previous = await query('SELECT stage FROM crm_leads WHERE id = ? AND uid = ?', [
        id,
        req.decode.uid,
      ]);
      if (previous.length === 0) {
        return res.json({ success: false, msg: 'Lead record not found' });
      }

      await withTransaction(async (tx) => {
        await tx(
          'UPDATE crm_leads SET stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND uid = ?',
          [stage, id, req.decode.uid],
        );

        // Log activity
        await tx(
          "INSERT INTO crm_lead_activities (uid, lead_id, activity_type, description) VALUES (?, ?, 'note', ?)",
          [req.decode.uid, id, `Stage shifted from '${previous[0].stage}' to '${stage}'`],
        );
      });

      res.json({ success: true, msg: 'Lead moved successfully.' });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to move lead' });
    }
  },
);

// POST to update full lead details
router.post(
  '/leads/update',
  validateUserOrAgent,
  verifyPermission('leads_access'),
  async (req, res) => {
    try {
      const { id, name, mobile, stage, owner_agent_uid, notes, value } = req.body;
      if (!id) {
        return res.json({ success: false, msg: 'Lead ID is required' });
      }

      // Fetch the old lead to get the old mobile number and ownership
      const oldLeads = await query(
        'SELECT mobile, owner_agent_uid FROM crm_leads WHERE id = ? AND uid = ?',
        [id, req.decode.uid],
      );
      const oldMobile = oldLeads.length > 0 ? oldLeads[0].mobile : null;
      const oldOwner = oldLeads.length > 0 ? oldLeads[0].owner_agent_uid : null;

      if (req.decode.role === 'agent' && oldOwner !== owner_agent_uid) {
        return res.json({
          success: false,
          msg: 'Only workspace owners can change lead ownership.',
        });
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
            notes || '',
            value || 0.0,
            id,
            req.decode.uid,
          ],
        );

        if (resLead.length === 0) {
          throw new Error('Lead not found');
        }

        // Log update activity
        await tx(
          "INSERT INTO crm_lead_activities (uid, lead_id, activity_type, description, agent_uid) VALUES (?, ?, 'note', ?, ?)",
          [req.decode.uid, id, 'Lead info details updated', owner_agent_uid || null],
        );

        return resLead;
      });

      // Sync to contact table
      await syncLeadToContact(req.decode.uid, name, mobile, oldMobile);

      res.json({ success: true, msg: 'Lead details updated.', data: result[0] });
    } catch (err) {
      console.error(err);
      res.json({
        success: false,
        msg: err.message === 'Lead not found' ? 'Lead not found' : 'Failed to update lead',
      });
    }
  },
);

// POST to permanently delete a lead and its tenant-owned history
router.post(
  '/leads/delete',
  validateUserOrAgent,
  verifyPermission('leads_access'),
  async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        return res.json({ success: false, msg: 'Lead ID is required' });
      }

      // Fetch the lead's mobile first so we can remove it from contacts
      const leadCheck = await query('SELECT mobile FROM crm_leads WHERE id = ? AND uid = ?', [
        id,
        req.decode.uid,
      ]);
      const mobile = leadCheck.length > 0 ? leadCheck[0].mobile : null;

      const deletedLead = await withTransaction(async (tx) => {
        // Explicit child cleanup keeps this route safe on databases created
        // before the cascade constraints were introduced.
        await tx('DELETE FROM crm_lead_reminders WHERE lead_id = ? AND uid = ?', [
          id,
          req.decode.uid,
        ]);
        await tx('DELETE FROM crm_lead_activities WHERE lead_id = ? AND uid = ?', [
          id,
          req.decode.uid,
        ]);
        const rows = await tx('DELETE FROM crm_leads WHERE id = ? AND uid = ? RETURNING id', [
          id,
          req.decode.uid,
        ]);

        if (rows.length === 0) {
          throw new Error('Lead not found');
        }

        return rows[0];
      });

      if (mobile) {
        await deleteLeadContact(req.decode.uid, mobile);
      }

      res.json({ success: true, msg: 'Lead deleted successfully.', data: deletedLead });
    } catch (err) {
      console.error(err);
      res.json({
        success: false,
        msg: err.message === 'Lead not found' ? 'Lead not found' : 'Failed to delete lead',
      });
    }
  },
);

// REMINDERS API

// GET reminders for a lead
router.get(
  '/leads/reminders/:leadId',
  validateUserOrAgent,
  verifyPermission('leads_access'),
  async (req, res) => {
    try {
      const leadCheck = await query('SELECT id FROM crm_leads WHERE id = ? AND uid = ?', [
        req.params.leadId,
        req.decode.uid,
      ]);
      if (leadCheck.length === 0) {
        return res.json({ success: false, msg: 'Lead not found or unauthorized' });
      }

      const data = await query(
        'SELECT * FROM crm_lead_reminders WHERE lead_id = ? AND uid = ? ORDER BY remind_at ASC',
        [req.params.leadId, req.decode.uid],
      );
      res.json({ success: true, data });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to retrieve reminders' });
    }
  },
);

// POST to add a reminder
router.post(
  '/leads/add_reminder',
  validateUserOrAgent,
  verifyPermission('leads_access'),
  async (req, res) => {
    try {
      const { lead_id, title, remind_at } = req.body;
      if (!lead_id || !title || !remind_at) {
        return res.json({ success: false, msg: 'Missing reminder parameters' });
      }

      const leadCheck = await query('SELECT id FROM crm_leads WHERE id = ? AND uid = ?', [
        lead_id,
        req.decode.uid,
      ]);
      if (leadCheck.length === 0) {
        return res.json({ success: false, msg: 'Lead not found or unauthorized' });
      }

      const result = await withTransaction(async (tx) => {
        const resRem = await tx(
          "INSERT INTO crm_lead_reminders (uid, lead_id, title, remind_at, status) VALUES (?, ?, ?, ?, 'PENDING') RETURNING *",
          [req.decode.uid, lead_id, title, remind_at],
        );

        // Log activity
        await tx(
          "INSERT INTO crm_lead_activities (uid, lead_id, activity_type, description) VALUES (?, ?, 'reminder', ?)",
          [
            req.decode.uid,
            lead_id,
            `Reminder scheduled: '${title}' at ${new Date(remind_at).toLocaleString()}`,
          ],
        );

        return resRem;
      });

      res.json({ success: true, msg: 'Reminder scheduled successfully.', data: result[0] });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to schedule reminder' });
    }
  },
);

// ACTIVITIES API

// GET activities logs for a lead
router.get(
  '/leads/activities/:leadId',
  validateUserOrAgent,
  verifyPermission('leads_access'),
  async (req, res) => {
    try {
      const leadCheck = await query('SELECT id FROM crm_leads WHERE id = ? AND uid = ?', [
        req.params.leadId,
        req.decode.uid,
      ]);
      if (leadCheck.length === 0) {
        return res.json({ success: false, msg: 'Lead not found or unauthorized' });
      }

      const data = await query(
        `SELECT cla.*, a.name as agent_name 
       FROM crm_lead_activities cla
       LEFT JOIN agents a ON cla.agent_uid = a.uid
       WHERE cla.lead_id = ? AND cla.uid = ? ORDER BY cla.created_at DESC`,
        [req.params.leadId, req.decode.uid],
      );
      res.json({ success: true, data });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to retrieve activities' });
    }
  },
);

// POST to add raw activity/note log
router.post(
  '/leads/add_activity',
  validateUserOrAgent,
  verifyPermission('leads_access'),
  async (req, res) => {
    try {
      const { lead_id, activity_type, description, agent_uid } = req.body;
      if (!lead_id || !description) {
        return res.json({ success: false, msg: 'Lead ID and description are required' });
      }

      const leadCheck = await query('SELECT id FROM crm_leads WHERE id = ? AND uid = ?', [
        lead_id,
        req.decode.uid,
      ]);
      if (leadCheck.length === 0) {
        return res.json({ success: false, msg: 'Lead not found or unauthorized' });
      }

      const result = await query(
        'INSERT INTO crm_lead_activities (uid, lead_id, activity_type, description, agent_uid) VALUES (?, ?, ?, ?, ?) RETURNING *',
        [req.decode.uid, lead_id, activity_type || 'note', description, agent_uid || null],
      );

      res.json({ success: true, msg: 'Activity logged.', data: result[0] });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to log activity' });
    }
  },
);

// update custom CRM pipeline ordering for leads
router.post(
  '/leads/update_pipeline_order',
  validateUserOrAgent,
  verifyPermission('kanban_access'),
  async (req, res) => {
    try {
      const { orderedLeadIds } = req.body;
      if (!Array.isArray(orderedLeadIds)) {
        return res.json({ success: false, msg: 'orderedLeadIds must be an array' });
      }
      if (orderedLeadIds.length > 1000) {
        return res.json({ success: false, msg: 'orderedLeadIds exceeds maximum allowed limit' });
      }

      await withTransaction(async (txQuery) => {
        for (let i = 0; i < orderedLeadIds.length; i++) {
          await txQuery(
            `UPDATE crm_leads SET pipeline_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND uid = ?`,
            [i, orderedLeadIds[i], req.decode.uid],
          );
        }
      });

      res.json({ success: true, msg: 'CRM Pipeline order updated' });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to update pipeline order' });
    }
  },
);

module.exports = router;
