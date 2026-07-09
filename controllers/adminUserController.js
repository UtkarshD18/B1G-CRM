const adminUserService = require('../services/adminUserService.js');

async function getUsers(req, res, next) {
  try {
    const result = await adminUserService.getUsers();
    return res.json({ data: result.data, success: true });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong' });
  }
}

async function updateUser(req, res, next) {
  try {
    const { newPassword, name, email, mobile_with_country_code, uid } = req.body;
    const result = await adminUserService.updateUser({
      newPassword,
      name,
      email,
      mobile_with_country_code,
      uid,
    });
    if (!result.success) {
      if (result.msg === 'This email is already taken by another user') {
        return res.json({ msg: result.msg }); // Match exact legacy behavior of returning { msg } on conflicts
      }
      return res.json({ success: false, msg: result.msg });
    }
    return res.json({ msg: result.msg, success: true });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong' });
  }
}

async function autoLogin(req, res, next) {
  try {
    const { uid } = req.body;
    const result = await adminUserService.autoLogin(uid);
    if (!result.success) {
      if (result.msg === 'User not found') {
        // Match exact legacy behavior: query user[0].uid will throw an error, caught by catch and return server error
        throw new Error('User not found');
      }
      return res.json({ success: false, msg: result.msg });
    }
    return res.json({ success: true, token: result.token });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'server error', err });
  }
}

async function getDashboardForUser(req, res, next) {
  try {
    const result = await adminUserService.getDashboardForUser();
    return res.json({ data: result.data, success: true });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'server error', err });
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.body;
    const result = await adminUserService.deleteUser(id);
    if (!result.success) {
      return res.json({ success: false, msg: result.msg });
    }
    return res.json({ success: true, msg: result.msg });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong' });
  }
}

module.exports = {
  getUsers,
  updateUser,
  autoLogin,
  getDashboardForUser,
  deleteUser,
};
