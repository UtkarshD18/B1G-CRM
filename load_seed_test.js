const { Client } = require("pg");
const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs");

const BASE_URL = "http://localhost:3010/api";
const USER_UID = "local-user-uid";

async function login() {
  const res = await axios.post(`${BASE_URL}/user/login`, {
    email: "user@example.com",
    password: process.env.TEST_USER_PASSWORD || "CHANGE_ME",
  });
  return res.data.token;
}

async function runLoadTest() {
  console.log("=== Starting Load Testing Audit ===");
  const token = await login();
  const headers = { Authorization: `Bearer ${token}` };

  const client = new Client({
    host: "127.0.0.1",
    port: 5432,
    user: "b1gcrm",
    password: process.env.PGPASSWORD || "CHANGE_ME",
    database: "b1gcrm",
  });
  await client.connect();

  console.log("1. Seeding database with load test data...");

  // A. Create a dummy phonebook
  const pbRes = await client.query(
    "INSERT INTO phonebook (name, uid) VALUES ($1, $2) RETURNING id",
    ["Load Test Phonebook", USER_UID]
  );
  const pbId = pbRes.rows[0].id;

  // B. Seed 1000 contacts
  console.log("- Seeding 1000 contacts...");
  const contactValues = [];
  for (let i = 1; i <= 1000; i++) {
    contactValues.push(`('${USER_UID}', ${pbId}, 'Load Test Phonebook', 'Contact ${i}', '999990${String(i).padStart(4, "0")}')`);
  }
  await client.query(`INSERT INTO contact (uid, phonebook_id, phonebook_name, name, mobile) VALUES ${contactValues.join(",")}`);

  // C. Seed 1000 chats
  console.log("- Seeding 100 chats...");
  const chatValues = [];
  for (let i = 1; i <= 100; i++) {
    chatValues.push(`('chat_id_${i}', '${USER_UID}', ${Date.now()}, 'User ${i}', '999991${String(i).padStart(4, "0")}', '{"body":"Hello chat ${i}"}')`);
  }
  await client.query(`INSERT INTO chats (chat_id, uid, last_message_came, sender_name, sender_mobile, last_message) VALUES ${chatValues.join(",")}`);

  // D. Seed 50 campaigns
  console.log("- Seeding 50 campaigns...");
  const broadcastValues = [];
  for (let i = 1; i <= 50; i++) {
    broadcastValues.push(`('broad_id_${i}', '${USER_UID}', 'Campaign ${i}', 'templet_${i}', 'pb_${i}', 'FINISHED')`);
  }
  await client.query(`INSERT INTO broadcast (broadcast_id, uid, title, templet, phonebook, status) VALUES ${broadcastValues.join(",")}`);

  // E. Seed 20 flows
  console.log("- Seeding 20 flows...");
  const flowValues = [];
  for (let i = 1; i <= 20; i++) {
    flowValues.push(`('${USER_UID}', 'flow_id_${i}', 'Flow ${i}')`);
  }
  await client.query(`INSERT INTO flow (uid, flow_id, title) VALUES ${flowValues.join(",")}`);

  // F. Seed 20 chatbots
  console.log("- Seeding 20 chatbots...");
  const chatbotValues = [];
  for (let i = 1; i <= 20; i++) {
    chatbotValues.push(`('${USER_UID}', 'Chatbot ${i}', 'flow_id_${i}', 1)`);
  }
  await client.query(`INSERT INTO chatbot (uid, title, flow_id, active) VALUES ${chatbotValues.join(",")}`);

  console.log("Database seeded successfully.");

  // Measure API Response Times
  console.log("\n2. Measuring API response times...");
  const apiMetrics = {};

  const endpoints = [
    { name: "get_phonebooks", path: "/phonebook/get_by_uid", method: "GET" },
    { name: "get_chats", path: "/inbox/get_chats", method: "GET" },
    { name: "get_campaigns", path: "/broadcast/get_broadcast", method: "GET" },
    { name: "get_flows", path: "/chat_flow/get_mine", method: "GET" },
    { name: "get_chatbots", path: "/chatbot/get_chatbot", method: "GET" }
  ];

  for (const ep of endpoints) {
    const start = performance.now();
    let res;
    if (ep.method === "GET") {
      res = await axios.get(`${BASE_URL}${ep.path}`, { headers });
    }
    const end = performance.now();
    apiMetrics[ep.name] = {
      responseTimeMs: Math.round(end - start),
      count: res.data.data?.length || 0,
      success: res.data.success
    };
    console.log(`- API ${ep.path} -> Response Time: ${apiMetrics[ep.name].responseTimeMs} ms, Records: ${apiMetrics[ep.name].count}`);
  }

  // Measure Frontend Page Load Times
  console.log("\n3. Measuring frontend page load times via Puppeteer...");
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Login via UI first
  await page.goto("http://localhost:3010/user/login", { waitUntil: "networkidle2" });
  await page.evaluate(() => {
    document.querySelector('input[type="email"]').value = "user@example.com";
    document.querySelector('input[type="password"]').value = process.env.TEST_USER_PASSWORD || "CHANGE_ME";
    const btn = document.querySelector('button[type="submit"]') || document.querySelector('button');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  const uiMetrics = {};

  const pagesToTest = [
    { name: "Inbox", url: "http://localhost:3010/user/inbox" },
    { name: "Contacts", url: "http://localhost:3010/user/contacts" },
    { name: "Campaigns", url: "http://localhost:3010/user/campaigns" },
    { name: "Chatbots", url: "http://localhost:3010/user/wa-chatbot" },
    { name: "Flows", url: "http://localhost:3010/user/automation-flows" }
  ];

  for (const p of pagesToTest) {
    const start = performance.now();
    await page.goto(p.url, { waitUntil: "networkidle2" });
    const end = performance.now();
    uiMetrics[p.name] = {
      loadTimeMs: Math.round(end - start)
    };
    console.log(`- Page ${p.name} -> UI Load Time: ${uiMetrics[p.name].loadTimeMs} ms`);
  }

  await browser.close();

  // Cleanup seeded data
  console.log("\n4. Cleaning up seeded load test data...");
  await client.query("DELETE FROM contact WHERE phonebook_id = $1", [pbId]);
  await client.query("DELETE FROM phonebook WHERE id = $1", [pbId]);
  await client.query("DELETE FROM chats WHERE chat_id LIKE 'chat_id_%'");
  await client.query("DELETE FROM broadcast WHERE broadcast_id LIKE 'broad_id_%'");
  await client.query("DELETE FROM flow WHERE flow_id LIKE 'flow_id_%'");
  await client.query("DELETE FROM chatbot WHERE title LIKE 'Chatbot %'");
  await client.end();

  console.log("Cleanup complete.");

  const finalReport = {
    apiMetrics,
    uiMetrics
  };

  fs.writeFileSync("load_test_results.json", JSON.stringify(finalReport, null, 2));
  console.log("Saved performance results to load_test_results.json");
}

runLoadTest().catch(err => {
  console.error("Load test run error:", err);
  process.exit(1);
});
