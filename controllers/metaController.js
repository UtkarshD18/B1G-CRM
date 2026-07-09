const metaService = require('../services/metaService');

async function updateMeta(req, res, next) {
  try {
    const { waba_id, business_account_id, access_token, business_phone_number_id, app_id } =
      req.body;
    const result = await metaService.updateMetaKeys({
      uid: req.decode.uid,
      waba_id,
      business_account_id,
      access_token,
      business_phone_number_id,
      app_id,
    });

    if (!result.success) {
      return res.json({
        success: false,
        msg: result.msg,
      });
    }

    return res.json({
      success: true,
      msg: result.msg,
    });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong', err });
  }
}

async function getMetaKeys(req, res, next) {
  try {
    const result = await metaService.getMetaKeys(req.decode.uid);
    return res.json(result);
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong', err });
  }
}

async function fetchProfile(req, res, next) {
  try {
    const result = await metaService.getBusinessProfile(req.decode.uid);
    if (!result.success) {
      return res.json({
        success: false,
        msg: result.msg,
      });
    }
    // Note: original router.get('/fetch_profile') returns res.json(fetchProfile) directly
    // which is the data inside result.data
    return res.json(result.data);
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'something went wrong', err });
  }
}

module.exports = {
  updateMeta,
  getMetaKeys,
  fetchProfile,
};
