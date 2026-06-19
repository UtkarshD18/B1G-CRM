const fetch = require("node-fetch");

async function run() {
  console.log("Logging in...");
  const loginRes = await fetch("http://localhost:3010/api/user/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "user@example.com", password: "User@123" })
  });
  const loginJson = await loginRes.json();
  if (!loginJson.success) {
    throw new Error("Login failed: " + JSON.stringify(loginJson));
  }
  const token = loginJson.token;
  console.log("Logged in successfully. Seeding demo data...");

  const seedRes = await fetch("http://localhost:3010/api/user/seed_demo_data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });
  const seedJson = await seedRes.json();
  console.log("Seed result:", seedJson);
}

run().catch(console.error);
