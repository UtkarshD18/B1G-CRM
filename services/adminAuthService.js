const { query } = require('../database/dbpromise.js');
const bcrypt = require('bcrypt');
const { sign } = require('jsonwebtoken');
const moment = require('moment');
const { recoverEmail } = require('../emails/returnEmails.js');
const { sendEmail, isValidEmail } = require('../functions/function.js');
const env = require('../env.js');

async function loginAdmin({ email, password }) {
  if (!email || !password) {
    return { success: false, status: 400, msg: 'Please fill email and password' };
  }

  const userFind = await query(`SELECT * FROM admin WHERE email = ?`, [email]);
  if (userFind.length < 1) {
    return { success: false, msg: 'Invalid credentials found' };
  }

  const compare = await bcrypt.compare(password, userFind[0].password);
  if (!compare) {
    return { success: false, msg: 'Invalid credentials' };
  }

  const token = sign(
    {
      uid: userFind[0].uid,
      role: 'admin',
      email: userFind[0].email,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRY },
  );

  return { success: true, token };
}

async function getAdminProfile() {
  const data = await query(`SELECT * FROM admin`, []);
  return { success: true, data: data[0] };
}

async function updateAdminProfile({ uid, email, newpass }) {
  if (newpass) {
    const hash = await bcrypt.hash(newpass, 10);
    await query(`UPDATE admin SET email = ?, password = ? WHERE uid = ?`, [email, hash, uid]);
  } else {
    await query(`UPDATE admin SET email = ? WHERE uid = ?`, [email, uid]);
  }
  return { success: true, msg: 'Admin was updated refresh the page' };
}

async function sendRecoveryLink({ email }) {
  if (!isValidEmail(email)) {
    return { success: false, msg: 'Please enter a valid email' };
  }

  const checkEmailValid = await query(`SELECT * FROM admin WHERE email = ?`, [email]);
  if (checkEmailValid.length < 1) {
    return {
      success: true,
      msg: 'We have sent a recovery link if this email is associated with admin account.',
    };
  }

  const getWeb = await query(`SELECT * FROM web_public`, []);
  const appName = getWeb[0]?.app_name;

  const jsontoken = sign(
    {
      uid: checkEmailValid[0].uid,
      old_email: email,
      email: email,
      time: moment(new Date()),
      role: 'admin',
    },
    env.JWT_SECRET,
    { expiresIn: '1h' },
  );

  const recpveryUrl = `${env.FRONTEND_URL}/recovery-admin/${jsontoken}`;
  const getHtml = recoverEmail(appName, recpveryUrl);

  const smtp = await query(`SELECT * FROM smtp`, []);
  if (!smtp[0]?.email || !smtp[0]?.host || !smtp[0]?.port || !smtp[0]?.password) {
    return {
      success: false,
      msg: 'SMTP connections not found! Unable to send recovery link',
    };
  }

  await sendEmail(
    smtp[0]?.host,
    smtp[0]?.port,
    smtp[0]?.email,
    smtp[0]?.password,
    getHtml,
    `${appName} - Password Recovery`,
    smtp[0]?.email,
    email,
  );

  return {
    success: true,
    msg: 'We have sent your a password recovery link. Please check your email',
  };
}

async function modifyPassword({ pass, decoded }) {
  if (!pass) {
    return { success: false, msg: 'Please provide a password' };
  }

  if (moment(new Date()).diff(moment(decoded.time), 'hours') > 1) {
    return { success: false, msg: 'Token expired' };
  }

  const hashpassword = await bcrypt.hash(pass, 10);
  const result = await query(`UPDATE admin SET password = ? WHERE email = ?`, [
    hashpassword,
    decoded.old_email,
  ]);

  return {
    success: true,
    msg: 'Your password has been changed. You may login now! Redirecting...',
    data: result,
  };
}

module.exports = {
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  sendRecoveryLink,
  modifyPassword,
};
