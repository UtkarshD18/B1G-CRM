const { query } = require("../database/dbpromise.js");

async function runCleanup() {
  console.log("=== Starting Database Cleanup and Reconciliation ===");

  // 1. Delete all orphan rows where tenant uid does not exist in user table
  const tables = [
    "chats", "chatbot_log", "broadcast_log", "agent_chats", "agent_task",
    "contact", "phonebook", "chatbot", "flow", "flow_data", "webhook_rules", "webhook_logs"
  ];

  for (const table of tables) {
    const ownerField = (table === "agent_chats" || table === "agent_task") ? "owner_uid" : "uid";
    const res = await query(`DELETE FROM "${table}" WHERE "${ownerField}" NOT IN (SELECT uid FROM "user")`);
    console.log(`Deleted orphans from "${table}": ${res?.affectedRows || 0}`);
  }

  // 2. Fetch remaining chats, chatbot logs, and broadcast logs with missing contacts
  const orphanChats = await query(`
    SELECT DISTINCT uid, sender_mobile, sender_name 
    FROM chats 
    WHERE sender_mobile IS NOT NULL 
      AND sender_mobile != ''
      AND sender_mobile NOT IN (SELECT mobile FROM contact WHERE contact.uid = chats.uid)
  `);

  const orphanDiagnostics = await query(`
    SELECT DISTINCT uid, sender_number, sender_name 
    FROM chatbot_log 
    WHERE sender_number IS NOT NULL
      AND sender_number != ''
      AND sender_number NOT IN (SELECT mobile FROM contact WHERE contact.uid = chatbot_log.uid)
  `);

  const orphanBroadcasts = await query(`
    SELECT DISTINCT uid, send_to, contact
    FROM broadcast_log 
    WHERE send_to IS NOT NULL
      AND send_to != ''
      AND send_to NOT IN (SELECT mobile FROM contact WHERE contact.uid = broadcast_log.uid)
  `);

  // Helper to ensure phonebook and contact exist
  async function ensureContact(uid, mobile, name, detailsJson = null) {
    if (!mobile || mobile === "NA") return;
    
    // Get or create a default cleanup phonebook for the user
    const pbName = "Reconciled Contacts";
    let pbId;
    const existingPb = await query(`SELECT * FROM phonebook WHERE uid = ? AND name = ?`, [uid, pbName]);
    if (existingPb.length > 0) {
      pbId = existingPb[0].id;
    } else {
      const insertPb = await query(`INSERT INTO phonebook (uid, name) VALUES (?, ?) RETURNING id`, [uid, pbName]);
      if (insertPb && insertPb.length > 0) {
        pbId = insertPb[0].id;
      } else {
        const getPb = await query(`SELECT id FROM phonebook WHERE uid = ? AND name = ?`, [uid, pbName]);
        pbId = getPb[0]?.id;
      }
    }

    // Verify contact still missing
    const checkContact = await query(`SELECT * FROM contact WHERE uid = ? AND mobile = ?`, [uid, mobile]);
    if (checkContact.length === 0) {
      let var1 = "";
      if (detailsJson) {
        try {
          const parsed = JSON.parse(detailsJson);
          var1 = parsed?.email || parsed?.var1 || "";
        } catch {}
      }
      await query(`INSERT INTO contact (uid, phonebook_id, phonebook_name, name, mobile, var1) VALUES (?, ?, ?, ?, ?, ?)`, [
        uid,
        pbId,
        pbName,
        name || "Reconciled Contact",
        mobile,
        var1 || "Reconciled"
      ]);
      console.log(`Created missing contact for uid: ${uid}, mobile: ${mobile}, name: ${name}`);
    }
  }

  // Run reconciliation
  for (const row of orphanChats) {
    await ensureContact(row.uid, row.sender_mobile, row.sender_name);
  }

  for (const row of orphanDiagnostics) {
    await ensureContact(row.uid, row.sender_number, row.sender_name);
  }

  for (const row of orphanBroadcasts) {
    await ensureContact(row.uid, row.send_to, null, row.contact);
  }

  console.log("=== Cleanup and Reconciliation Complete ===");
}

runCleanup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
