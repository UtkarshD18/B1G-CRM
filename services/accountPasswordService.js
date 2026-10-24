const bcrypt = require('bcrypt');
const { query } = require('../database/dbpromise');

const statements = {
  admin: 'UPDATE admin SET password = ? WHERE uid = ? RETURNING uid',
  user: 'UPDATE "user" SET password = ? WHERE uid = ? RETURNING uid',
  agent: 'UPDATE agents SET password = ? WHERE uid = ? RETURNING uid',
};

async function resetAccountPassword({role, uid, password}) {
  if (!Object.prototype.hasOwnProperty.call(statements, role)
      || typeof uid !== 'string' || !uid.trim()
      || typeof password !== 'string' || password.length < 6) {
    return {success:false, status:400, msg:'A valid role, account UID, and password of at least 6 characters are required'};
  }
  const hash = await bcrypt.hash(password, 12);
  const rows = await query(statements[role], [hash, uid]);
  if (!rows.length) return {success:false, status:404, msg:'Account not found'};
  return {success:true, status:200, msg:'Password updated'};
}

module.exports = {resetAccountPassword};
