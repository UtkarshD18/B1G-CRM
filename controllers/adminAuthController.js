const adminAuthService = require('../services/adminAuthService.js');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await adminAuthService.loginAdmin({ email, password });

    if (!result.success) {
      if (result.status === 400) {
        return res.status(400).json({ success: false, msg: result.msg });
      }
      return res.json({ msg: result.msg }); // Match exact legacy behavior of returning { msg } on invalid credentials
    }

    return res.json({
      success: true,
      token: result.token,
    });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong' });
  }
}

async function getAdmin(req, res, next) {
  try {
    const result = await adminAuthService.getAdminProfile();
    return res.json({ data: result.data, success: true });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'server error', err });
  }
}

async function updateAdmin(req, res, next) {
  try {
    const { email, newpass } = req.body;
    const result = await adminAuthService.updateAdminProfile({
      uid: req.decode.uid,
      email,
      newpass,
    });
    return res.json(result);
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'server error', err });
  }
}

async function sendRecovery(req, res, next) {
  try {
    const { email } = req.body;
    const result = await adminAuthService.sendRecoveryLink({ email });
    if (!result.success) {
      return res.json({ msg: result.msg }); // Match exact legacy behavior of returning { msg } on invalid email/smtp config
    }
    return res.json(result);
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'Something went wrong', err, success: false });
  }
}

async function modifyPassword(req, res, next) {
  try {
    const { pass } = req.query;
    const result = await adminAuthService.modifyPassword({
      pass,
      decoded: req.decode,
    });
    if (!result.success) {
      return res.json({ success: false, msg: result.msg });
    }
    return res.json(result);
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'Something went wrong', err, success: false });
  }
}

module.exports = {
  login,
  getAdmin,
  updateAdmin,
  sendRecovery,
  modifyPassword,
};
