const router = require("express").Router();
const { query } = require("../database/dbpromise.js");
const {
  createSession,
  sendMessage,
  getSession,
  deleteSession,
} = require("../helper/addon/qr/index.js");
const { checkPlan } = require("../middlewares/plan.js");
const { validateUserOrAgent, verifyPermission } = require("../middlewares/auth.js");

router.post("/gen_qr", validateUserOrAgent, verifyPermission("settings_access"), checkPlan, async (req, res) => {
  try {
    const { title, uniqueId } = req.body;
    if (!title || !uniqueId) {
      return res.json({
        success: false,
        msg: "Please provide the all fields! title is required",
      });
    }

    if (!/^[A-Za-z0-9_-]{1,100}$/.test(uniqueId)) {
      return res.status(400).json({ success: false, msg: "Invalid instance ID" });
    }
    const [existing] = await query("SELECT * FROM instance WHERE uniqueId = ?", [uniqueId]);
    if (existing) {
      if (existing.uid !== req.decode.uid) {
        return res.status(403).json({
          success: false,
          msg: "This instance ID is already in use by another user.",
        });
      }
      await query(
        "UPDATE instance SET title = ?, status = ? WHERE uniqueId = ?",
        [title, "GENERATING", uniqueId]
      );
    } else {
      await query(
        `INSERT INTO instance (uid, title, uniqueId, status) VALUES (?,?,?,?)`,
        [req.decode.uid, title, uniqueId, "GENERATING"]
      );
    }

    await createSession(
      uniqueId,
      title?.length > 20 ? title.slice(0, 20) : title
    );

    res.json({
      success: true,
      msg: "Qr code is generating",
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      msg: "Something went wrong",
      err: err.message,
    });
  }
});

// get all instances
router.get("/get_all", validateUserOrAgent, verifyPermission("settings_access"), async (req, res) => {
  try {
    const instances = await query(`SELECT * FROM instance WHERE uid = ?`, [
      req.decode.uid,
    ]);

    if (!instances.length) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // Process each instance
    for (let instance of instances) {
      const instId = instance.uniqueid || instance.uniqueId;
      const check = getSession(instId);

      if (!check && instance.status === "CONNECTED") {
        // If no session and status was CONNECTED, update status to "INACTIVE"
        const result = await query(`UPDATE instance SET status = ? WHERE uniqueId = ? AND uid = ? RETURNING id`, [
          "INACTIVE",
          instId,
          req.decode.uid
        ]);
        if (result.length > 0) {
          instance.status = "INACTIVE"; // Update status in response as well
        }
      }
    }

    res.json({
      success: true,
      data: instances,
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      msg: "Something went wrong",
      err: err.message,
    });
  }
});

// del an instance
router.post("/del_instance", validateUserOrAgent, verifyPermission("settings_access"), async (req, res) => {
  try {
    const { uniqueId } = req.body;
    if (!uniqueId) {
      return res.json({
        success: false,
        msg: "Please provide the all fields! uniqueId is required",
      });
    }

    const [owned] = await query(`SELECT id FROM instance WHERE uniqueId = ? AND uid = ?`, [
      uniqueId,
      req.decode.uid,
    ]);
    if (!owned) return res.status(404).json({ success: false, msg: "QR instance not found" });

    const session = getSession(uniqueId);

    if (session) {
      try {
        session.end();
      } catch {
      } finally {
        deleteSession(uniqueId);
      }
    }

    await query(`DELETE FROM instance WHERE uniqueId = ? AND uid = ?`, [
      uniqueId,
      req.decode.uid,
    ]);

    res.json({
      success: true,
      msg: "QR instance was deleted",
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      msg: "Something went wrong",
      err: err.message,
    });
  }
});

// change instance status
router.post("/change_instance_status", validateUserOrAgent, verifyPermission("settings_access"), async (req, res) => {
  try {
    const statuses = [
      "unavailable",
      "available",
      // "composing",
      // "recording",
      // "paused",
    ];

    const { insId, status, jid } = req.body;

    const [existing] = await query(`SELECT * FROM instance WHERE uniqueId = ? AND uid = ?`, [insId, req.decode.uid]);
    if (!existing) {
      return res.json({ success: false, msg: "Instance was not found or unauthorized" });
    }

    const session = await getSession(insId);

    if (!session) {
      return res.json({
        msg: "Unable to change status right now WA is busy",
      });
    }

    if (!statuses.includes(status)) {
      return res.json({
        msg: "Invalid status found",
      });
    }

    const finalUpdate = { onlineStatus: status };

    await session.sendPresenceUpdate(status);
    await query(`UPDATE instance SET other = ? WHERE uniqueId = ? AND uid = ?`, [
      JSON.stringify(finalUpdate),
      insId,
      req.decode.uid
    ]);

    res.json({
      success: true,
      msg: "Online status update request sent",
    });
  } catch (err) {
    res.json({ success: false, msg: "something went wrong" });
    console.log(err);
  }
});

module.exports = router;
