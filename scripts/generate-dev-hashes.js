/**
 * One-time script: Generate bcrypt hashes for dev credentials.
 *
 * Run inside the app container:
 *   docker exec b1g-crm-app-1 node scripts/generate-dev-hashes.js
 *
 * Copy the output hashes and paste them back so the schema files
 * can be updated. Delete this file afterwards.
 */
const bcrypt = require('bcrypt');

async function main() {
  const adminHash = await bcrypt.hash(process.env.TEST_ADMIN_PASSWORD || 'CHANGE_ME', 10);
  const userHash  = await bcrypt.hash(process.env.TEST_USER_PASSWORD || 'CHANGE_ME', 10);

  // Round-trip verification
  const adminOk = await bcrypt.compare(process.env.TEST_ADMIN_PASSWORD || 'CHANGE_ME', adminHash);
  const userOk  = await bcrypt.compare(process.env.TEST_USER_PASSWORD || 'CHANGE_ME', userHash);

  console.log('');
  console.log('=== B1G-CRM Dev Credential Hashes ===');
  console.log('');
  console.log('ADMIN_HASH=' + adminHash);
  console.log('USER_HASH=' + userHash);
  console.log('');
  console.log('ADMIN_VERIFY=' + adminOk);
  console.log('USER_VERIFY=' + userOk);
  console.log('');
}

main().catch(err => { console.error(err); process.exit(1); });
