const { query } = require("../database/dbpromise");

async function run() {
  try {
    const res = await query("SELECT * FROM automation_flows LIMIT 1");
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}

run();
