const bcrypt = require('bcrypt');
const { query } = require('../database/dbpromise');
const { checkQr } = require('../helper/addon/qr/index.js');
const env = require('../env.js');
const { addON } = env;
const { invalidatePermissionCache } = require('../utils/permissionResolver.js');

async function getMeData(uid) {
  const data = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);
  const qrCheck = checkQr();
  const finalAddon = qrCheck ? [...addON, 'QR'] : addON;

  // getting phonebook
  const contact = await query(`SELECT * FROM contact WHERE uid = ?`, [uid]);

  return {
    success: true,
    data: { ...data[0], contact: contact.length },
    addon: finalAddon,
  };
}

async function updateProfileData({
  uid,
  newPassword,
  name,
  mobile_with_country_code,
  email,
  timezone,
}) {
  if (!name || !mobile_with_country_code || !email || !timezone) {
    return {
      success: false,
      msg: 'Name, Mobile, Email, Timezone are required fields',
    };
  }

  if (newPassword) {
    const hash = await bcrypt.hash(newPassword, 10);
    await query(
      `UPDATE user SET name = ?, email = ?, password = ?, mobile_with_country_code = ?, timezone = ? WHERE uid = ?`,
      [name, email, hash, mobile_with_country_code, timezone, uid],
    );
  } else {
    await query(
      `UPDATE user SET name = ?, email = ?, mobile_with_country_code = ?, timezone = ? WHERE uid = ?`,
      [name, email, mobile_with_country_code, timezone, uid],
    );
  }

  invalidatePermissionCache(uid);

  return {
    success: true,
    msg: 'Profile was updated',
  };
}

module.exports = {
  getMeData,
  updateProfileData,
};
