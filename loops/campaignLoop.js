// Import necessary modules
const moment = require("moment-timezone");
const { query } = require("../database/dbpromise");
const { getUserPlayDays } = require("../functions/function");
const { sendMessage } = require("./loopFunctions");

function delayRandom(fromSeconds, toSeconds) {
  const randomSeconds = Math.random() * (toSeconds - fromSeconds) + fromSeconds;

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, randomSeconds * 1000);
  });
}

// Function to check if a date has passed in a given timezone
function hasDatePassedInTimezone(timezone, date) {
  const momentDate = moment.tz(date, timezone);
  const currentMoment = moment.tz(timezone);
  return momentDate.isBefore(currentMoment);
}

// Function to update the broadcast status in the database
async function updateBroadcastDatabase(status, broadcastId) {
  await query("UPDATE broadcast SET status = ? WHERE broadcast_id = ?", [
    status,
    broadcastId,
  ]);
}

// Function to process a broadcast campaign in batches with SKIP LOCKED queue safety
async function processBroadcast(campaign) {
  const planDays = await getUserPlayDays(campaign?.uid);

  if (planDays < 1) {
    await updateBroadcastDatabase(
      "ACTIVE PLAN NOT FOUND",
      campaign?.broadcast_id
    );
    return;
  }

  const metaKeys = await query("SELECT * FROM meta_api WHERE uid = ?", [
    campaign?.uid,
  ]);

  if (metaKeys.length < 1) {
    await updateBroadcastDatabase("META API NOT FOUND", campaign?.broadcast_id);
    return;
  }

  const batchSize = 50;
  const messages = await query(
    `UPDATE broadcast_log
     SET delivery_status = 'PROCESSING'
     WHERE id IN (
       SELECT id
       FROM broadcast_log
       WHERE broadcast_id = ? AND delivery_status = 'PENDING'
       LIMIT ?
       FOR UPDATE SKIP LOCKED
     )
     RETURNING *`,
    [campaign?.broadcast_id, batchSize]
  );

  if (messages.length < 1) {
    // Check if there are any remaining pending or active processing logs
    const activeCount = await query(
      `SELECT COUNT(id)::int as count FROM broadcast_log 
       WHERE broadcast_id = ? AND delivery_status IN ('PENDING', 'PROCESSING')`,
      [campaign?.broadcast_id]
    );
    if (activeCount[0].count === 0) {
      await updateBroadcastDatabase("FINISHED", campaign?.broadcast_id);
    }
    return;
  }

  for (const message of messages) {
    try {
      const getObj = await sendMessage(message, metaKeys[0]);
      const curTime = Date.now();

      if (getObj.success) {
        await query(
          `UPDATE broadcast_log SET meta_msg_id = ?, delivery_status = ?, delivery_time = ? WHERE id = ?`,
          [getObj?.msgId, getObj.msg, curTime, message?.id]
        );
      } else {
        console.log({ getObj: JSON.stringify(getObj) });
        await query(`UPDATE broadcast_log SET delivery_status = ?, err = ? WHERE id = ?`, [
          getObj.msg || "FAILED",
          JSON.stringify(getObj),
          message?.id,
        ]);
      }
    } catch (err) {
      console.error(`Failed to process message ID ${message?.id}:`, err);
      await query(`UPDATE broadcast_log SET delivery_status = 'FAILED', err = ? WHERE id = ?`, [
        err.message,
        message?.id,
      ]);
    }
    // Respect rate limits with a small throttle delay
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

// Function to retrieve and process broadcast campaigns
async function processBroadcasts() {
  const broadcasts = await query("SELECT * FROM broadcast WHERE status = ?", [
    "QUEUE",
  ]);

  for (const campaign of broadcasts) {
    if (
      campaign.schedule &&
      hasDatePassedInTimezone(campaign?.timezone, campaign?.schedule)
    ) {
      await processBroadcast(campaign);
    }
  }
}

// Function to run the campaign processing engine in a safe daemon loop
async function runCampaign() {
  while (true) {
    try {
      await processBroadcasts();
    } catch (err) {
      console.error("Error in campaign run loop:", err.message);
    }
    await delayRandom(3, 5);
  }
}

module.exports = { runCampaign };
