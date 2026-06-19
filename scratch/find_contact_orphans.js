const { query } = require("../database/dbpromise.js");

async function checkContactConsistency() {
  console.log("=== Contact Consistency Check ===");

  // 1. Missing Contacts (numbers in chats, chatbot_log, or broadcast_log but not in contact)
  const orphanChats = await query(`
    SELECT DISTINCT uid, sender_mobile, sender_name 
    FROM chats 
    WHERE sender_mobile NOT IN (SELECT mobile FROM contact WHERE contact.uid = chats.uid)
  `);

  const orphanDiagnostics = await query(`
    SELECT DISTINCT uid, sender_number, sender_name 
    FROM chatbot_log 
    WHERE sender_number NOT IN (SELECT mobile FROM contact WHERE contact.uid = chatbot_log.uid)
  `);

  const orphanCampaignLogs = await query(`
    SELECT DISTINCT uid, send_to, contact
    FROM broadcast_log 
    WHERE send_to NOT IN (SELECT mobile FROM contact WHERE contact.uid = broadcast_log.uid)
  `);

  console.log(`Orphan Chats found: ${orphanChats.length}`);
  console.log(orphanChats);

  console.log(`Orphan Diagnostics found: ${orphanDiagnostics.length}`);
  console.log(orphanDiagnostics);

  console.log(`Orphan Campaign Logs found: ${orphanCampaignLogs.length}`);
  console.log(orphanCampaignLogs);

  console.log("=== Check Complete ===");
}

checkContactConsistency()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
