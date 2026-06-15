const router = require("express").Router();
const { query } = require("../database/dbpromise.js");
const randomstring = require("randomstring");
const bcrypt = require("bcrypt");
const {
  isValidEmail,
  getFileExtension,
  makeRequest,
  readJsonFromFile,
} = require("../functions/function.js");
const { sign } = require("jsonwebtoken");
const validateUser = require("../middlewares/user.js");
const { checkPlan } = require("../middlewares/plan.js");

function hasPropertyWithValue(arr, property, value) {
  return Array.isArray(arr) && arr.some((item) => item[property] === value);
}

function normalizeOrigin(originRaw = {}) {
  const code = String(originRaw.code || "META").toUpperCase();
  return {
    title: code === "QR" ? "QR" : "Meta",
    code: code === "QR" ? "QR" : "META",
    data: originRaw.data || {},
  };
}

function normalizeChats(chats) {
  return Array.isArray(chats) ? chats.filter(Boolean) : [];
}

async function getOwnedFlow(uid, flow = {}) {
  const flowId = flow.flow_id || flow.flowId || "";
  const numericId = Number(flow.id);
  const clauses = [];
  const params = [uid];

  if (flowId) {
    clauses.push("flow_id = ?");
    params.push(flowId);
  }

  if (Number.isInteger(numericId) && numericId > 0) {
    clauses.push("id = ?");
    params.push(numericId);
  }

  if (!clauses.length) {
    return null;
  }

  const rows = await query(
    `SELECT * FROM flow WHERE uid = ? AND (${clauses.join(" OR ")}) LIMIT 1`,
    params
  );

  return rows[0] || null;
}

async function validateChatTargets(uid, chats, forAll) {
  if (forAll || chats.length < 1) {
    return true;
  }

  const rows = await query(
    `SELECT chat_id FROM chats WHERE uid = ? AND chat_id IN (?)`,
    [uid, chats]
  );

  return rows.length === new Set(chats).size;
}

function flowHasUnsupportedQrNodes(uid, flowId) {
  const flowPath = `${__dirname}/../flow-json/nodes/${uid}/${flowId}.json`;
  const nodeData = readJsonFromFile(flowPath);
  const checkBtn = hasPropertyWithValue(nodeData, "type", "BUTTON");
  const checkList = hasPropertyWithValue(nodeData, "type", "LIST");
  return checkBtn || checkList;
}

async function prepareChatbotPayload(req) {
  const { title, flow, origin: originRaw = {} } = req.body;
  const origin = normalizeOrigin(originRaw);
  const chats = normalizeChats(req.body.chats);
  const forAll = Boolean(req.body.for_all);

  if (!title || !String(title).trim()) {
    return { error: "Please provide a chatbot title" };
  }

  const ownedFlow = await getOwnedFlow(req.decode.uid, flow);
  if (!ownedFlow) {
    return { error: "Select a saved flow first." };
  }

  if (!forAll && chats.length < 1) {
    return {
      error: "Select at least one chat target or enable all incoming chats.",
    };
  }

  const validTargets = await validateChatTargets(req.decode.uid, chats, forAll);
  if (!validTargets) {
    return { error: "One or more selected chats were not found." };
  }

  if (origin.code !== "META" && flowHasUnsupportedQrNodes(req.decode.uid, ownedFlow.flow_id)) {
    return {
      error: "Please select another flow which does not contain interactive buttons",
    };
  }

  return {
    title: String(title).trim(),
    chats,
    forAll,
    origin,
    flow: ownedFlow,
  };
}

router.post("/add_chatbot", validateUser, checkPlan, async (req, res) => {
  try {
    if (req.plan?.allow_chatbot < 1) {
      return res.json({
        success: false,
        msg: "Your plan does not allow you to set a chatbot",
      });
    }

    const prepared = await prepareChatbotPayload(req);
    if (prepared.error) {
      return res.json({ success: false, msg: prepared.error });
    }

    await query(
      `INSERT INTO chatbot (uid, title, for_all, chats, flow, flow_id, active, origin) VALUES (?,?,?,?,?,?,?,?)`,
      [
        req.decode.uid,
        prepared.title,
        prepared.forAll ? 1 : 0,
        JSON.stringify(prepared.chats),
        JSON.stringify(prepared.flow),
        prepared.flow.flow_id,
        1,
        JSON.stringify(prepared.origin),
      ]
    );

    res.json({ success: true, msg: "Chatbot was added" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", err });
  }
});

// update chatbot
router.post("/update_chatbot", validateUser, checkPlan, async (req, res) => {
  try {
    const { id } = req.body;

    if (req.plan?.allow_chatbot < 1) {
      return res.json({
        success: false,
        msg: "Your plan does not allow you to set a chatbot",
      });
    }

    const prepared = await prepareChatbotPayload(req);
    if (prepared.error) {
      return res.json({ success: false, msg: prepared.error });
    }

    const result = await query(
      `UPDATE chatbot SET title = ?, for_all = ?, chats = ?, flow = ?, flow_id = ?, origin = ? WHERE id = ? AND uid = ? RETURNING id`,
      [
        prepared.title,
        prepared.forAll ? 1 : 0,
        JSON.stringify(prepared.chats),
        JSON.stringify(prepared.flow),
        prepared.flow.flow_id,
        JSON.stringify(prepared.origin),
        id,
        req.decode.uid,
      ]
    );

    if (result.length < 1) {
      return res.json({ success: false, msg: "Chatbot was not found" });
    }

    res.json({ success: true, msg: "Chatbot was updated" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", err });
  }
});

// get my chatbots
router.get("/get_chatbot", validateUser, async (req, res) => {
  try {
    const data = await query(`SELECT * FROM chatbot WHERE uid = ?`, [
      req.decode.uid,
    ]);
    res.json({ data, success: true });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", err });
  }
});

// get recent chatbot diagnostics
router.get("/get_logs", validateUser, async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit || "25", 10) || 25, 1),
      100
    );
    const where = ["uid = ?"];
    const params = [req.decode.uid];
    const chatbotId = Number.parseInt(req.query.chatbot_id || "", 10);
    const allowedStatuses = ["matched", "no_match", "skipped", "error"];

    if (Number.isInteger(chatbotId) && chatbotId > 0) {
      where.push("chatbot_id = ?");
      params.push(chatbotId);
    }

    if (allowedStatuses.includes(req.query.status)) {
      where.push("status = ?");
      params.push(req.query.status);
    }

    params.push(limit);

    const data = await query(
      `SELECT * FROM chatbot_log WHERE ${where.join(
        " AND "
      )} ORDER BY created_at DESC LIMIT ?`,
      params
    );

    res.json({ data, success: true });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", err });
  }
});

// change bot status
router.post("/change_bot_status", validateUser, checkPlan, async (req, res) => {
  try {
    const { id, status } = req.body;

    if (req.plan?.allow_chatbot < 1) {
      return res.json({
        success: false,
        msg: "Your plan does not allow you to set a chatbot",
      });
    }

    await query(`UPDATE chatbot SET active = ? WHERE uid = ? AND id = ?`, [
      status ? 1 : 0,
      req.decode.uid,
      id,
    ]);

    res.json({ success: true, msg: "Chatbot was updated" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", err });
  }
});

// del chatbot
router.post("/del_chatbot", validateUser, async (req, res) => {
  try {
    const { id } = req.body;
    await query(`DELETE FROM chatbot WHERE id = ? AND uid = ?`, [
      id,
      req.decode.uid,
    ]);
    res.json({ success: true, msg: "Chatbot was deleted" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", err });
  }
});

// try to make a request
router.post("/make_request_api", validateUser, checkPlan, async (req, res) => {
  try {
    const { url, body, headers, type } = req.body;

    if (!url || !type) {
      return res.json({ msg: "Url is required" });
    }

    const resp = await makeRequest({
      method: type,
      url,
      body,
      headers,
    });

    res.json(resp);
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", err });
  }
});

module.exports = router;
