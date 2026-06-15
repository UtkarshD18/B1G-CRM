const router = require("express").Router();
const { query } = require("../database/dbpromise.js");
const randomstring = require("randomstring");
const bcrypt = require("bcrypt");
const {
  createMetaTemplet,
  getMetaNumberDetail,
} = require("../functions/function.js");
const { sign } = require("jsonwebtoken");
const validateUser = require("../middlewares/user.js");
const { checkPlan } = require("../middlewares/plan.js");

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_TREND_DAYS = 31;
const campaignDateExpression = "COALESCE(schedule, created_at)";
const logActivityDateExpression = `(CASE
  WHEN delivery_time IS NULL THEN COALESCE(updated_at, created_at)
  WHEN delivery_time > 1000000000000 THEN to_timestamp((delivery_time::double precision) / 1000.0)
  ELSE to_timestamp(delivery_time::double precision)
END)`;

function normalizeStatus(value) {
  return String(value || "").toUpperCase();
}

function getTimestamp(value) {
  if (!value) {
    return null;
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric > 1000000000000 ? numeric : numeric * 1000;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function parseDateBoundary(value, endOfDay = false) {
  if (!value) {
    return null;
  }

  const input = String(value).trim();
  if (!input) {
    return null;
  }

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(input);
  const date = new Date(
    isDateOnly
      ? `${input}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`
      : input
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function getDashboardDateRange(queryParams = {}) {
  const from = parseDateBoundary(queryParams.from);
  const to = parseDateBoundary(queryParams.to, true);

  if ((queryParams.from && !from) || (queryParams.to && !to)) {
    throw new Error("Use valid dashboard filter dates.");
  }

  if (from && to && from.getTime() > to.getTime()) {
    throw new Error("From date must be before to date.");
  }

  return { from, to };
}

function appendDateFilters(where, params, dateExpression, range) {
  if (range.from) {
    where.push(`${dateExpression} >= ?`);
    params.push(range.from);
  }

  if (range.to) {
    where.push(`${dateExpression} <= ?`);
    params.push(range.to);
  }
}

function serializeDateRange(range) {
  return {
    from: range.from ? range.from.toISOString() : null,
    to: range.to ? range.to.toISOString() : null,
  };
}

function startOfUtcDay(value) {
  const date = value ? new Date(value) : new Date();
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

function formatTrendLabel(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  });
}

function getTrendBounds(range = {}) {
  let end = range.to ? startOfUtcDay(range.to) : startOfUtcDay();
  let start = range.from ? startOfUtcDay(range.from) : new Date(end);

  if (!range.from) {
    start.setUTCDate(end.getUTCDate() - 6);
  }

  if (start.getTime() > end.getTime()) {
    end = new Date(start);
  }

  const dayCount = Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
  if (dayCount > MAX_TREND_DAYS) {
    start = new Date(end);
    start.setUTCDate(end.getUTCDate() - (MAX_TREND_DAYS - 1));
  }

  return { start, end };
}

function buildDeliveryTrend(logs, range) {
  const { start, end } = getTrendBounds(range);
  const dayCount = Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;

  const buckets = Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    return { key, label: formatTrendLabel(date), value: 0 };
  });
  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  logs.forEach((log) => {
    const timestamp =
      getTimestamp(log.delivery_time) ||
      getTimestamp(log.updated_at) ||
      getTimestamp(log.created_at);

    if (!timestamp) {
      return;
    }

    const date = new Date(timestamp);
    const key = date.toISOString().slice(0, 10);
    const bucket = bucketMap.get(key);
    if (bucket) {
      bucket.value += 1;
    }
  });

  return buckets.map(({ label, value }) => ({ label, value }));
}

function buildTopTemplates(logs) {
  const counts = new Map();

  logs.forEach((log) => {
    const template = log.templet_name || "Unknown";
    counts.set(template, (counts.get(template) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 5);
}

function summarizeDashboard(campaigns, logs, range = {}) {
  const now = Date.now();
  const delivery = {
    total: logs.length,
    pending: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
  };
  const campaignStatus = {
    total: campaigns.length,
    queued: 0,
    paused: 0,
    completed: 0,
    scheduled: 0,
  };

  campaigns.forEach((campaign) => {
    const status = normalizeStatus(campaign.status);
    const schedule = getTimestamp(campaign.schedule);

    if (status === "QUEUE" || status === "QUEUED") {
      campaignStatus.queued += 1;
    }
    if (status === "PAUSED") {
      campaignStatus.paused += 1;
    }
    if (status === "COMPLETED" || status === "DONE") {
      campaignStatus.completed += 1;
    }
    if (schedule && schedule > now) {
      campaignStatus.scheduled += 1;
    }
  });

  logs.forEach((log) => {
    const status = normalizeStatus(log.delivery_status);
    if (status === "PENDING") {
      delivery.pending += 1;
    }
    if (status === "SENT") {
      delivery.sent += 1;
    }
    if (status === "DELIVERED") {
      delivery.delivered += 1;
    }
    if (status === "READ") {
      delivery.read += 1;
    }
    if (status === "FAILED") {
      delivery.failed += 1;
    }
  });

  return {
    campaignStatus,
    delivery,
    trend: buildDeliveryTrend(logs, range),
    templates: buildTopTemplates(logs),
    filters: serializeDateRange(range),
  };
}

// adding campaign
router.post("/add_new", validateUser, checkPlan, async (req, res) => {
  try {
    const { title, templet, phonebook, scheduleTimestamp, example } = req.body;

    if (!title || !templet?.name || !phonebook?.id || !scheduleTimestamp) {
      return res.json({ success: false, msg: "Please enter all details" });
    }

    const scheduleDate = new Date(scheduleTimestamp);

    if (Number.isNaN(scheduleDate.getTime())) {
      return res.json({ success: false, msg: "Please select a valid schedule" });
    }

    const getPhonebook = await query(
      `SELECT * FROM phonebook WHERE id = ? AND uid = ?`,
      [phonebook.id, req.decode.uid]
    );

    if (getPhonebook.length < 1) {
      return res.json({ success: false, msg: "Invalid phonebook provided" });
    }

    const getMetaAPI = await query(`SELECT * FROM meta_api WHERE uid = ?`, [
      req.decode.uid,
    ]);

    if (getMetaAPI.length < 1) {
      return res.json({
        success: false,
        msg: "We could not find your meta API keys",
      });
    }

    const getPhonebookContacts = await query(
      `SELECT * FROM contact where phonebook_id = ? AND uid = ?`,
      [getPhonebook[0].id, req.decode.uid]
    );

    if (getPhonebookContacts.length < 1) {
      return res.json({
        success: false,
        msg: "The phonebook you have selected does not have any mobile number in it",
      });
    }

    const getMetaMobileDetails = await getMetaNumberDetail(
      "v18.0",
      getMetaAPI[0]?.business_phone_number_id,
      getMetaAPI[0]?.access_token
    );

    if (getMetaMobileDetails.error) {
      return res.json({
        success: false,
        msg: "Either your meta API are invalid or your access token has been expired",
      });
    }

    const broadcast_id = randomstring.generate();

    const broadcast_logs = getPhonebookContacts.map((i) => [
      req.decode.uid,
      broadcast_id,
      templet?.name || "NA",
      getMetaMobileDetails?.display_phone_number,
      i?.mobile,
      "PENDING",
      JSON.stringify(example),
      JSON.stringify(i),
    ]);

    const getUser = await query(`SELECT * FROM user WHERE uid = ?`, [
      req.decode.uid,
    ]);

    await query(
      `
                INSERT INTO broadcast_log (
                    uid,
                    broadcast_id,
                    templet_name,
                    sender_mobile,
                    send_to,
                    delivery_status,
                    example,
                    contact
                ) VALUES ?`,
      [broadcast_logs]
    );

    await query(
      `INSERT INTO broadcast (broadcast_id, uid, title, templet, phonebook, status, schedule, timezone) VALUES (
            ?,?,?,?,?,?,?,?
        )`,
      [
        broadcast_id,
        req.decode.uid,
        String(title).trim(),
        JSON.stringify(templet),
        JSON.stringify(getPhonebook[0]),
        "QUEUE",
        scheduleDate,
        getUser[0]?.timezone || "Asia/Kolkata",
      ]
    );

    res.json({ success: true, msg: "Your broadcast has been added" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", err });
  }
});

// campaign dashboard summary
router.get("/dashboard_summary", validateUser, async (req, res) => {
  try {
    const range = getDashboardDateRange(req.query);
    const campaignWhere = ["uid = ?"];
    const campaignParams = [req.decode.uid];
    const logWhere = ["uid = ?"];
    const logParams = [req.decode.uid];

    appendDateFilters(
      campaignWhere,
      campaignParams,
      campaignDateExpression,
      range
    );
    appendDateFilters(logWhere, logParams, logActivityDateExpression, range);

    const [campaigns, logs] = await Promise.all([
      query(
        `SELECT * FROM broadcast WHERE ${campaignWhere.join(
          " AND "
        )} ORDER BY schedule DESC NULLS LAST, created_at DESC`,
        campaignParams
      ),
      query(
        `SELECT * FROM broadcast_log WHERE ${logWhere.join(" AND ")}`,
        logParams
      ),
    ]);

    res.json({
      success: true,
      data: summarizeDashboard(campaigns || [], logs || [], range),
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ success: false, msg: err.message });
  }
});

// get all campaign
router.get("/get_broadcast", validateUser, async (req, res) => {
  try {
    const range = getDashboardDateRange(req.query);
    const where = ["uid = ?"];
    const params = [req.decode.uid];

    appendDateFilters(where, params, campaignDateExpression, range);

    const data = await query(
      `SELECT * FROM broadcast WHERE ${where.join(
        " AND "
      )} ORDER BY schedule DESC NULLS LAST, created_at DESC`,
      params
    );
    res.json({ data, success: true });
  } catch (err) {
    console.log(err);
    res.status(400).json({ success: false, msg: err.message });
  }
});

// get broadcast logs by bid
router.post("/get_broadcast_logs", validateUser, async (req, res) => {
  try {
    const { id } = req.body;

    const data = await query(
      `SELECT * FROM broadcast_log WHERE broadcast_id = ? AND uid = ?`,
      [id, req.decode.uid]
    );

    const getSent = data?.filter((i) => i.delivery_status === "sent");

    const totalDelivered = data?.filter(
      (i) => i.delivery_status === "delivered"
    );

    const totalRead = data?.filter((i) => i.delivery_status === "read");
    const totalFailed = data?.filter((i) => i.delivery_status === "failed");

    const totalPending = data?.filter((i) => i.delivery_status === "PENDING");

    console.log({
      totalLogs: data?.length,
      getSent: getSent?.length,
      totalRead: totalRead?.length,
      totalFailed: totalFailed?.length,
      totalPending: totalPending?.length,
      totalDelivered: totalDelivered?.length,
    });

    res.json({
      data,
      success: true,
      totalLogs: data?.length,
      getSent: getSent?.length,
      totalRead: totalRead?.length,
      totalFailed: totalFailed?.length,
      totalPending: totalPending?.length,
      totalDelivered: totalDelivered?.length,
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", err });
  }
});

// change campaign status
router.post("/change_broadcast_status", validateUser, async (req, res) => {
  try {
    console.log(req.body);
    const { status, broadcast_id } = req.body;

    if (!status) {
      return res.json({ msg: "Invalid request" });
    }

    await query(
      `UPDATE broadcast SET status = ? WHERE broadcast_id = ? AND uid = ?`,
      [status, broadcast_id, req.decode.uid]
    );
    res.json({ success: true, msg: "Campaign status updated" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", err });
  }
});

// delete a broad cast
router.post("/del_broadcast", validateUser, async (req, res) => {
  try {
    const { broadcast_id } = req.body;

    await query(`DELETE FROM broadcast WHERE uid = ? AND broadcast_id = ?`, [
      req.decode.uid,
      broadcast_id,
    ]);
    await query(
      `DELETE FROM broadcast_log WHERE uid = ? AND broadcast_id = ?`,
      [req.decode.uid, broadcast_id]
    );

    res.json({ success: true, msg: "Broadcast was deleted" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Something went wrong", err });
  }
});

module.exports = router;
