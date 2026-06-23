const axios = require("axios");
const { Client } = require("pg");

const queryDb = async (sql, params = []) => {
  const client = new Client({
    host: process.env.PGHOST || '127.0.0.1',
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER || 'b1gcrm',
    password: process.env.PGPASSWORD || 'CHANGE_ME',
    database: process.env.PGDATABASE || 'b1gcrm'
  });
  await client.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows;
  } finally {
    await client.end();
  }
};

(async () => {
  console.log("=== Testing Website Widget Integration E2E ===");
  const testSessionId = "session_" + Date.now();
  const testEmail = `widget_visitor_${Date.now()}@example.com`;
  const testName = `Visitor ${Date.now()}`;
  const testMsg = "Hello! I am testing the website integration widget.";
  const testDomain = "test-widget-domain.local";
  const userUid = "local-user-uid";

  try {
    // 1. Post a widget message
    const res = await axios.post("http://localhost:3010/api/website/widget/message", {
      uid: userUid,
      domain: testDomain,
      sessionId: testSessionId,
      message: testMsg,
      name: testName,
      email: testEmail
    });

    console.log("Widget Message Response:", res.data);

    // 2. Verify Chat Thread Created in Database
    const chats = await queryDb("SELECT * FROM chats WHERE chat_id = $1 AND uid = $2", [`widget_${testSessionId}`, userUid]);
    console.log("Verified Chats count:", chats.length);
    if (chats.length !== 1) throw new Error("Chat thread was not created!");
    console.log(`- Chat thread exists: Status=${chats[0].chat_status}, Origin=${chats[0].origin}`);

    // 3. Verify Contact Created in Database
    const contacts = await queryDb("SELECT * FROM contact WHERE mobile = $1 AND uid = $2", [`widget_${testSessionId}`, userUid]);
    console.log("Verified Contacts count:", contacts.length);
    if (contacts.length !== 1) throw new Error("Contact was not created!");
    console.log(`- Contact exists: Name=${contacts[0].name}, Phonebook=${contacts[0].phonebook_name}`);

    // 4. Verify CRM Lead Created in Database
    const leads = await queryDb("SELECT * FROM crm_leads WHERE mobile = $1 AND uid = $2", [`widget_${testSessionId}`, userUid]);
    console.log("Verified CRM Leads count:", leads.length);
    if (leads.length !== 1) throw new Error("CRM Lead was not created!");
    console.log(`- CRM Lead exists: Stage=${leads[0].stage}, Name=${leads[0].name}`);

    console.log("=== E2E Website Widget Integration: ALL PASS ===");
  } catch (err) {
    console.error("Website Widget Integration E2E FAIL:", err.message);
    process.exit(1);
  }
})();
