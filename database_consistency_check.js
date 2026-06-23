const { query } = require("./database/dbpromise.js");
const fs = require("fs");

async function checkOrphans() {
  console.log("=== Starting Database Consistency Audit ===");
  const auditResults = {};

  // 1. Phonebook/Contact consistency
  const contactOrphans = await query(
    `SELECT id, name, mobile, phonebook_id FROM contact WHERE phonebook_id IS NOT NULL AND phonebook_id NOT IN (SELECT id FROM phonebook)`
  );
  auditResults.contactOrphans = contactOrphans;
  console.log(`- Contact orphans (missing phonebook): ${contactOrphans.length}`);

  // 2. Agent assignment consistency (agent_chats)
  const agentChatOrphans = await query(
    `SELECT id, uid, chat_id FROM agent_chats WHERE uid NOT IN (SELECT uid FROM agents)`
  );
  auditResults.agentChatOrphans = agentChatOrphans;
  console.log(`- Agent chats orphans (missing agent): ${agentChatOrphans.length}`);

  // 3. Agent task consistency (agent_task)
  const agentTaskOrphans = await query(
    `SELECT id, uid, title FROM agent_task WHERE uid NOT IN (SELECT uid FROM agents)`
  );
  auditResults.agentTaskOrphans = agentTaskOrphans;
  console.log(`- Agent tasks orphans (missing agent): ${agentTaskOrphans.length}`);

  // 4. Campaign logs consistency (broadcast_log)
  const campaignLogOrphans = await query(
    `SELECT id, broadcast_id FROM broadcast_log WHERE broadcast_id NOT IN (SELECT broadcast_id FROM broadcast)`
  );
  auditResults.campaignLogOrphans = campaignLogOrphans;
  console.log(`- Campaign log orphans (missing broadcast): ${campaignLogOrphans.length}`);

  // 5. Webhook logs consistency (webhook_logs)
  const webhookLogOrphans = await query(
    `SELECT id, rule_id FROM webhook_logs WHERE rule_id IS NOT NULL AND rule_id NOT IN (SELECT id FROM webhook_rules)`
  );
  auditResults.webhookLogOrphans = webhookLogOrphans;
  console.log(`- Webhook log orphans (missing rule): ${webhookLogOrphans.length}`);

  // 6. Chatbot logs consistency (chatbot_log)
  const chatbotLogOrphans = await query(
    `SELECT id, chatbot_id FROM chatbot_log WHERE chatbot_id IS NOT NULL AND chatbot_id NOT IN (SELECT id FROM chatbot)`
  );
  auditResults.chatbotLogOrphans = chatbotLogOrphans;
  console.log(`- Chatbot log orphans (missing chatbot): ${chatbotLogOrphans.length}`);

  // 7. Tenant resource checks (missing owner user)
  const tenantTables = [
    { name: "agents", field: "owner_uid" },
    { name: "phonebook", field: "uid" },
    { name: "contact", field: "uid" },
    { name: "broadcast", field: "uid" },
    { name: "broadcast_log", field: "uid" },
    { name: "orders", field: "uid" },
    { name: "meta_api", field: "uid" },
    { name: "meta_templet_media", field: "uid" },
    { name: "chats", field: "uid" },
    { name: "rooms", field: "uid" },
    { name: "agent_chats", field: "owner_uid" },
    { name: "chat_tags", field: "uid" },
    { name: "chatbot", field: "uid" },
    { name: "flow", field: "uid" },
    { name: "flow_data", field: "uid" },
    { name: "templets", field: "uid" },
    { name: "instance", field: "uid" },
    { name: "agent_task", field: "owner_uid" },
    { name: "chat_widget", field: "uid" },
    { name: "chatbot_log", field: "uid" },
    { name: "webhook_rules", field: "uid" },
    { name: "webhook_logs", field: "uid" }
  ];

  auditResults.tenantOrphans = {};

  for (const table of tenantTables) {
    const tableOrphans = await query(
      `SELECT id FROM "${table.name}" WHERE "${table.field}" NOT IN (SELECT uid FROM "user")`
    );
    if (tableOrphans.length > 0) {
      auditResults.tenantOrphans[table.name] = tableOrphans.length;
      console.log(`- ${table.name} orphans (missing user owner): ${tableOrphans.length}`);
    }
  }

  console.log("=== Audit Complete ===");
  fs.writeFileSync("database_integrity_report.json", JSON.stringify(auditResults, null, 2));
  console.log("Saved report to database_integrity_report.json");
}

checkOrphans()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
