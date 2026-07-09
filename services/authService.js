const bcrypt = require('bcrypt');
const randomstring = require('randomstring');
const jwt = require('jsonwebtoken');
const moment = require('moment-timezone');
const { query } = require('../database/dbpromise');
const env = require('../env');
const commonHelper = require('../functions/helpers/commonHelper');
const { sendEmail } = require('../functions/helpers/notificationHelper');
const { recoverEmail } = require('../emails/returnEmails.js');

async function signupUser({ email, name, password, mobile_with_country_code, acceptPolicy }) {
  if (!email || !name || !password || !mobile_with_country_code) {
    return { success: false, msg: 'Please fill the details' };
  }

  if (!acceptPolicy) {
    return {
      success: false,
      msg: 'You did not click on checkbox of Privacy & Terms',
    };
  }

  if (!commonHelper.isValidEmail(email)) {
    return { success: false, msg: 'Please enter a valid email' };
  }

  // check if user already has same email
  const findEx = await query(`SELECT * FROM user WHERE email = ?`, [email]);
  if (findEx.length > 0) {
    return { success: false, msg: 'A user already exist with this email' };
  }

  const haspass = await bcrypt.hash(password, 10);
  const uid = randomstring.generate();

  await query(
    `INSERT INTO user (name, uid, email, password, mobile_with_country_code) VALUES (?,?,?,?,?)`,
    [name, uid, email, haspass, mobile_with_country_code],
  );

  return { success: true, msg: 'Signup Success' };
}

async function loginUser({ email, password }) {
  if (!email || !password) {
    return {
      success: false,
      msg: 'Please provide email and password',
    };
  }

  // check for user
  const userFind = await query(`SELECT * FROM user WHERE email = ?`, [email]);
  if (userFind.length < 1) {
    return { success: false, msg: 'Invalid credentials' };
  }

  const compare = await bcrypt.compare(password, userFind[0].password);

  if (!compare) {
    return { success: false, msg: 'Invalid credentials' };
  }

  const token = jwt.sign(
    {
      uid: userFind[0].uid,
      role: 'user',
      email: userFind[0].email,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRY },
  );

  return {
    success: true,
    token,
  };
}

async function sendRecoveryLink({ email }) {
  if (!commonHelper.isValidEmail(email)) {
    return { success: false, msg: 'Please enter a valid email' };
  }

  const checkEmailValid = await query(`SELECT * FROM user WHERE email = ?`, [email]);
  if (checkEmailValid.length < 1) {
    return {
      success: true,
      msg: 'We have sent a recovery link if this email is associated with user account.',
    };
  }

  const getWeb = await query(`SELECT * FROM web_public`, []);
  const appName = getWeb[0]?.app_name;

  const jsontoken = jwt.sign(
    {
      uid: checkEmailValid[0].uid,
      old_email: email,
      email: email,
      time: moment(new Date()),
      role: 'user',
    },
    env.JWT_SECRET,
    { expiresIn: '1h' },
  );

  const recpveryUrl = `${env.FRONTEND_URL}/recovery-user/${jsontoken}`;
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

async function modifyPassword({ pass, decodedUser }) {
  if (!pass) {
    return { success: false, msg: 'Please provide a password' };
  }

  if (moment(new Date()).diff(moment(decodedUser.time), 'hours') > 1) {
    return { success: false, msg: 'Token expired' };
  }

  const hashpassword = await bcrypt.hash(pass, 10);

  const result = await query(`UPDATE user SET password = ? WHERE email = ?`, [
    hashpassword,
    decodedUser.old_email,
  ]);

  return {
    success: true,
    msg: 'Your password has been changed. You may login now! Redirecting...',
    data: result,
  };
}

module.exports = {
  signupUser,
  loginUser,
  sendRecoveryLink,
  modifyPassword,
};
