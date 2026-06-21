const { query } = require("../database/dbpromise.js");

async function run() {
  const phonebooks = await query("SELECT * FROM phonebook");
  console.log("=== PHONEBOOKS ===");
  console.log(phonebooks);

  const contacts = await query("SELECT * FROM contact");
  console.log("=== CONTACTS ===");
  console.log(contacts.map(c => ({ id: c.id, uid: c.uid, name: c.name, mobile: c.mobile, phonebook_id: c.phonebook_id })));

  const chats = await query("SELECT * FROM chats");
  console.log("=== CHATS ===");
  console.log(chats.map(c => ({ id: c.id, chat_id: c.chat_id, uid: c.uid, sender_name: c.sender_name, sender_mobile: c.sender_mobile })));
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
