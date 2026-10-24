const userService = require('../services/userService');
const { logActivity } = require('../utils/activityLogger.js');

async function getMe(req, res, next) {
  try {
    const result = await userService.getMeData(req.decode.uid);
    return res.json({
      data: result.data,
      success: result.success,
      addon: result.addon,
    });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong', err });
  }
}

async function updateProfile(req, res, next) {
  try {
    const { newPassword, name, mobile_with_country_code, email, timezone } = req.body;
    const result = await userService.updateProfileData({
      uid: req.decode.uid,
      newPassword,
      name,
      mobile_with_country_code,
      email,
      timezone,
    });

    if (!result.success) {
      return res.json({ msg: result.msg }); // Note: original /update_profile returns { msg: ... } without success: false on validation error
    }

    await logActivity(req, 'Users', 'update_profile', email, { name, timezone });

    return res.json({ success: true, msg: result.msg });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'Something went wrong', err, success: false });
  }
}

module.exports = {
  getMe,
  updateProfile,
};
