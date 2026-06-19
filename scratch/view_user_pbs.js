const { query } = require("../database/dbpromise.js");

async function run() {
  const pbs = await query("SELECT * FROM phonebook WHERE uid = 'local-user-uid'");
  console.log("=== USER PHONEBOOKS ===");
  console.log(pbs);

  const contacts = await query("SELECT id, name, mobile, phonebook_id, phonebook_name FROM contact WHERE uid = 'local-user-uid'");
  console.log("=== USER CONTACTS ===");
  console.log(contacts);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
