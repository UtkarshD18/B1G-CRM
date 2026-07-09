const metaService = require('../services/metaService');
const randomstring = require('randomstring');
const { validateMagicBytes, getFileExtension } = require('../functions/function.js');
const env = require('../env.js');

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

async function addTemplate(req, res, next) {
  try {
    const result = await metaService.addTemplate({
      uid: req.decode.uid,
      templateData: req.body,
    });
    if (!result.success) {
      return res.json({ msg: result.msg }); // Note: original /add_meta_templet returns { msg: ... } without success: false on error
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

async function getMyTemplates(req, res, next) {
  try {
    const result = await metaService.getMyTemplates(req.decode.uid);
    if (!result.success) {
      return res.json({
        success: false,
        msg: result.msg,
      });
    }
    return res.json({ success: true, data: result.data });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong', err });
  }
}

async function deleteTemplate(req, res, next) {
  try {
    const result = await metaService.deleteTemplate({
      uid: req.decode.uid,
      name: req.body.name,
    });
    if (!result.success) {
      return res.json({
        success: false,
        msg: result.msg,
      });
    }
    return res.json({
      success: true,
      data: result.data,
      msg: result.msg,
    });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong', err });
  }
}

async function updateTemplate(req, res, next) {
  try {
    const { name, language, category, components } = req.body;
    const result = await metaService.updateTemplate({
      uid: req.decode.uid,
      name,
      language,
      category,
      components,
    });
    if (!result.success) {
      return res.json({ success: false, msg: result.msg });
    }
    return res.json({ success: true, msg: result.msg });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong', err });
  }
}

async function uploadMedia(req, res, next) {
  try {
    if (!req.body?.templet_name) {
      return res.json({
        success: false,
        msg: 'Please give a templet name first ',
      });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.json({ success: false, msg: 'No files were uploaded' });
    }

    const randomString = randomstring.generate();
    const file = req.files.file;

    if (!validateMagicBytes(file.data, file.name)) {
      return res.json({ success: false, msg: 'File type does not match the file extension' });
    }

    const filename = `${randomString}.${getFileExtension(file.name)}`;
    const filePath = `${__dirname}/../client/public/media/${filename}`;

    // Move the file and wait for it to complete
    await new Promise((resolve, reject) => {
      file.mv(filePath, (err) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    setTimeout(async () => {
      try {
        const result = await metaService.uploadTemplateMedia({
          uid: req.decode.uid,
          templet_name: req.body.templet_name,
          filename,
          filePath,
        });

        if (!result.success) {
          return res.json({ success: false, msg: result.msg });
        }

        const url = `${env.FRONTEND_URL}/media/${filename}`;
        return res.json({ success: true, url, hash: result.hash });
      } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: 'something went wrong', err });
      }
    }, 1000);
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong', err });
  }
}

module.exports = {
  updateMeta,
  getMetaKeys,
  fetchProfile,
  addTemplate,
  getMyTemplates,
  deleteTemplate,
  updateTemplate,
  uploadMedia,
};
