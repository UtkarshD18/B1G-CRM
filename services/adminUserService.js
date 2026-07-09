const { query, withTransaction } = require('../database/dbpromise.js');
const bcrypt = require('bcrypt');
const { sign } = require('jsonwebtoken');
const env = require('../env.js');
const billingHelper = require('../functions/helpers/billingHelper.js');
const { getUserSignupsByMonth, getUserOrderssByMonth } = require('../functions/function.js');

async function getUsers() {
  const data = await query(`SELECT * FROM user`, []);
  return { success: true, data };
}

async function updateUser({ newPassword, name, email, mobile_with_country_code, uid }) {
  if (!uid || !name || !email || !mobile_with_country_code) {
    return {
      success: false,
      msg: 'You forgot to enter some field(s)',
    };
  }

  const findUserByEmail = await query(`SELECT * FROM user WHERE email = ?`, [email]);
  if (findUserByEmail.length > 0 && findUserByEmail[0].uid !== uid) {
    return { success: false, msg: 'This email is already taken by another user' };
  }

  const findUserByUid = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);
  if (findUserByUid.length === 0) {
    return { success: false, msg: 'User not found' };
  }

  if (newPassword) {
    const hashpass = await bcrypt.hash(newPassword, 10);
    await query(
      `UPDATE user SET name = ?, email = ?, password = ?, mobile_with_country_code = ? WHERE uid = ?`,
      [name, email, hashpass, mobile_with_country_code, uid],
    );
  } else {
    await query(`UPDATE user SET name = ?, email = ?, mobile_with_country_code = ? WHERE uid = ?`, [
      name,
      email,
      mobile_with_country_code,
      uid,
    ]);
  }

  return { success: true, msg: 'User was updated' };
}

async function updateUserPlan({ plan, uid }) {
  if (!plan || !uid) {
    return { success: false, msg: 'Invalid input provided' };
  }

  const getPlan = await query(`SELECT * FROM plan WHERE id = ?`, [plan?.id]);
  if (getPlan.length < 1) {
    return { success: false, msg: 'Invalid plan found' };
  }

  await billingHelper.updateUserPlan(getPlan[0], uid);

  return { success: true, msg: 'User plan was updated' };
}

async function autoLogin(uid) {
  if (!uid) {
    return { success: false, msg: 'Invalid input' };
  }

  const user = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);
  if (user.length < 1) {
    return { success: false, msg: 'User not found' };
  }

  const token = sign(
    {
      uid: user[0].uid,
      role: 'user',
      email: user[0].email,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRY },
  );

  return { success: true, token };
}

async function getDashboardForUser() {
  const getUsers = await query(`SELECT * FROM user`, []);
  const { paidSignupsByMonth, unpaidSignupsByMonth } = getUserSignupsByMonth(getUsers);

  const getOrders = await query(`SELECT * FROM orders`, []);
  const orders = getUserOrderssByMonth(getOrders);

  const getContactForm = await query(`SELECT * FROM contact_form`, []);

  return {
    success: true,
    data: {
      paid: paidSignupsByMonth,
      unpaid: unpaidSignupsByMonth,
      orders,
      userLength: getUsers.length,
      orderLength: getOrders.length,
      contactLength: getContactForm.length,
    },
  };
}

async function deleteUser(id) {
  if (!id) {
    return { success: false, msg: 'User ID is required' };
  }

  const user = await query(`SELECT uid FROM "user" WHERE id = ?`, [id]);
  if (user.length > 0) {
    const userUid = user[0].uid;
    await withTransaction(async (tx) => {
      await tx(`DELETE FROM agents WHERE owner_uid = ?`, [userUid]);
      await tx(`DELETE FROM phonebook WHERE uid = ?`, [userUid]);
      await tx(`DELETE FROM contact WHERE uid = ?`, [userUid]);
      await tx(`DELETE FROM broadcast WHERE uid = ?`, [userUid]);
      await tx(`DELETE FROM broadcast_log WHERE uid = ?`, [userUid]);
      await tx(`DELETE FROM orders WHERE uid = ?`, [userUid]);
      await tx(`DELETE FROM meta_api WHERE uid = ?`, [userUid]);
      await tx(`DELETE FROM meta_templet_media WHERE uid = ?`, [userUid]);
      await tx(`DELETE FROM chats WHERE uid = ?`, [userUid]);
      await tx(`DELETE FROM rooms WHERE uid = ?`, [userUid]);
      await tx(`DELETE FROM agent_chats WHERE owner_uid = ?`, [userUid]);
      await tx(`DELETE FROM chat_tags WHERE uid = ?`, [userUid]);
      await tx(`DELETE FROM chatbot WHERE uid = ?`, [userUid]);
      await tx(`DELETE FROM flow WHERE uid = ?`, [userUid]);
      await tx(`DELETE FROM flow_data WHERE uid = ?`, [userUid]);
      await tx(`DELETE FROM templets WHERE uid = ?`, [userUid]);
      await tx(`DELETE FROM instance WHERE uid = ?`, [userUid]);
      await tx(`DELETE FROM agent_task WHERE owner_uid = ?`, [userUid]);
      await tx(`DELETE FROM chat_widget WHERE uid = ?`, [userUid]);
      await tx(`DELETE FROM chatbot_log WHERE uid = ?`, [userUid]);
      await tx(`DELETE FROM webhook_rules WHERE uid = ?`, [userUid]);
      await tx(`DELETE FROM webhook_logs WHERE uid = ?`, [userUid]);
      await tx(`DELETE FROM "user" WHERE id = ?`, [id]);
    });
  } else {
    await query(`DELETE FROM "user" WHERE id = ?`, [id]);
  }

  return { success: true, msg: 'User was deleted' };
}

module.exports = {
  getUsers,
  updateUser,
  updateUserPlan,
  autoLogin,
  getDashboardForUser,
  deleteUser,
};
