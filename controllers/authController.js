const authService = require('../services/authService');

async function signup(req, res, next) {
  try {
    const result = await authService.signupUser(req.body);
    // Note: original signup returned different JSON keys/status depending on conditions:
    // e.g. success: false, msg: ...
    // Let's return the exact result returned from service
    if (result.success === false) {
      // In original: if user already exists, it returns { msg: '...' } without success: false. Wait, let's make sure we match it exactly.
      // Let's check original: return res.json({ msg: 'Please enter a valid email', success: false });
      // e.g. return res.json({ msg: 'A user already exist with this email' }); (Notice no success key!)
      // Let's align response payload keys exactly to what was returned or match original.
      const payload = { msg: result.msg };
      if (
        result.msg.includes('fill') ||
        result.msg.includes('checkbox') ||
        result.msg.includes('valid')
      ) {
        payload.success = false;
      }
      return res.json(payload);
    }
    return res.json({ msg: result.msg, success: true });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong', err });
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.loginUser(req.body);
    if (!result.success) {
      if (result.msg.includes('provide')) {
        return res.json({ success: false, msg: result.msg });
      }
      return res.json({ msg: result.msg }); // Note: original userFind.length < 1 or compare fail returns { msg: 'Invalid credentials' } without success: false
    }
    return res.json({
      success: true,
      token: result.token,
    });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong', err });
  }
}

async function sendRecovery(req, res, next) {
  try {
    const result = await authService.sendRecoveryLink(req.body);
    if (!result.success) {
      return res.json({ success: false, msg: result.msg });
    }
    if (result.msg.includes('We have sent a recovery link if this email')) {
      return res.json({
        success: true,
        msg: result.msg,
      });
    }
    return res.json({
      success: true,
      msg: result.msg,
    });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'Something went wrong', err, success: false });
  }
}

async function modifyRecoveryPassword(req, res, next) {
  try {
    const result = await authService.modifyPassword({
      pass: req.query.pass,
      decodedUser: req.decode,
    });
    if (!result.success) {
      return res.json({ success: false, msg: result.msg });
    }
    return res.json({
      success: true,
      msg: result.msg,
      data: result.data,
    });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'Something went wrong', err, success: false });
  }
}

module.exports = {
  signup,
  login,
  sendRecovery,
  modifyRecoveryPassword,
};
