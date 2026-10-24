const fs = require('fs');
const path = require('path');
const { query } = require('../database/dbpromise');
const env = require('../env.js');
const metaHelper = require('../functions/helpers/metaHelper');
const { decrypt } = require('../utils/channels/encryption');

async function syncMetaApiKeys(uid) {
  const existing = await query(`SELECT * FROM meta_api WHERE uid = ?`, [uid]);
  if (existing.length > 0) {
    if (existing[0].app_id) {
      return existing;
    }
    const [credRow] = await query(
      `SELECT credentials FROM channel_credentials WHERE uid = ? AND channel_type = ?`,
      [uid, 'whatsapp_cloud'],
    );
    if (credRow?.credentials) {
      const creds = JSON.parse(decrypt(credRow.credentials));
      if (creds.access_token) {
        try {
          const debugUrl = `https://graph.facebook.com/debug_token?input_token=${creds.access_token}&access_token=${creds.access_token}`;
          const res = await fetch(debugUrl);
          const data = await res.json();
          if (data?.data?.app_id) {
            await query(`UPDATE meta_api SET app_id = ? WHERE uid = ?`, [data.data.app_id, uid]);
            return await query(`SELECT * FROM meta_api WHERE uid = ?`, [uid]);
          }
        } catch (debugErr) {
          console.error('Failed to repair App ID:', debugErr);
        }
      }
    }
    return existing;
  }

  const [credRow] = await query(
    `SELECT credentials FROM channel_credentials WHERE uid = ? AND channel_type = ?`,
    [uid, 'whatsapp_cloud'],
  );
  if (credRow?.credentials) {
    const creds = JSON.parse(decrypt(credRow.credentials));
    if (creds.access_token && creds.phone_number_id) {
      let appId = creds.app_id || '';
      if (!appId) {
        try {
          const debugUrl = `https://graph.facebook.com/debug_token?input_token=${creds.access_token}&access_token=${creds.access_token}`;
          const res = await fetch(debugUrl);
          const data = await res.json();
          if (data?.data?.app_id) {
            appId = data.data.app_id;
          }
        } catch (debugErr) {
          console.error('Failed to automatically retrieve App ID from debug_token:', debugErr);
        }
      }

      await query(
        `INSERT INTO meta_api (uid, business_phone_number_id, access_token, waba_id, app_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [uid, creds.phone_number_id, creds.access_token, creds.business_account_id || '', appId],
      );
      return await query(`SELECT * FROM meta_api WHERE uid = ?`, [uid]);
    }
  }
  return [];
}

async function updateMetaKeys({
  uid,
  waba_id,
  business_account_id,
  access_token,
  business_phone_number_id,
  app_id,
}) {
  if (!waba_id || !business_account_id || !access_token || !business_phone_number_id || !app_id) {
    return { success: false, msg: 'Please fill all the fields' };
  }

  const resp = await metaHelper.getBusinessPhoneNumber(
    'v18.0',
    business_phone_number_id,
    access_token,
  );
  if (resp?.error) {
    return {
      success: false,
      msg: resp?.error?.message || 'Please check your details',
    };
  }

  const findOne = await query(`SELECT * FROM meta_api WHERE uid = ?`, [uid]);
  if (findOne.length > 0) {
    await query(
      `UPDATE meta_api SET waba_id = ?, business_account_id = ?, access_token = ?, business_phone_number_id = ?, app_id = ? WHERE uid = ?`,
      [waba_id, business_account_id, access_token, business_phone_number_id, app_id, uid],
    );
  } else {
    await query(
      `INSERT INTO meta_api (uid, waba_id, business_account_id, access_token, business_phone_number_id, app_id) VALUES (?,?,?,?,?,?)`,
      [uid, waba_id, business_account_id, access_token, business_phone_number_id, app_id],
    );
  }

  return {
    success: true,
    msg: 'Your meta settings were updated successfully!',
  };
}

async function getMetaKeys(uid) {
  const data = await query(`SELECT * FROM meta_api WHERE uid = ?`, [uid]);
  if (data.length < 1) {
    return { success: true, data: {} };
  } else {
    return { success: true, data: data[0] };
  }
}

async function getBusinessProfile(uid) {
  const metaKeys = await query('SELECT * FROM meta_api WHERE uid = ?', [uid]);

  if (!metaKeys[0]?.access_token || !metaKeys[0]?.business_phone_number_id) {
    return {
      success: false,
      msg: 'Please fill the meta token and mobile id',
    };
  }

  const fetchProfile = await metaHelper.fetchProfileFun(
    metaKeys[0]?.business_phone_number_id,
    metaKeys[0]?.access_token,
  );

  return {
    success: true,
    data: fetchProfile,
  };
}

async function addTemplate({ uid, templateData }) {
  if (env.MOCK_META_DELIVERY) {
    const mockFilePath = path.join(
      __dirname,
      '../conversations',
      `mock_meta_templates_${uid}.json`,
    );
    let mockTemplates = [];
    if (fs.existsSync(mockFilePath)) {
      mockTemplates = JSON.parse(fs.readFileSync(mockFilePath, 'utf8'));
    }
    const newTemplate = {
      name: templateData.name,
      language: templateData.language || 'en_US',
      category: templateData.category || 'UTILITY',
      status: 'APPROVED',
      components: templateData.components || [],
    };
    const idx = mockTemplates.findIndex((t) => t.name === newTemplate.name);
    if (idx >= 0) {
      mockTemplates[idx] = newTemplate;
    } else {
      mockTemplates.push(newTemplate);
    }
    fs.writeFileSync(mockFilePath, JSON.stringify(mockTemplates, null, 2), 'utf8');
    return {
      success: true,
      msg: 'Templet was added and waiting for the review',
    };
  }

  const getAPIKEYS = await syncMetaApiKeys(uid);

  if (getAPIKEYS.length < 1) {
    return {
      success: false,
      msg: 'Please fill your meta API keys',
    };
  }

  const resp = await metaHelper.createMetaTemplet(
    'v18.0',
    getAPIKEYS[0]?.waba_id,
    getAPIKEYS[0]?.access_token,
    templateData,
  );

  if (resp.error) {
    return {
      success: false,
      msg: resp?.error?.error_user_msg || resp?.error?.message,
    };
  } else {
    return {
      success: true,
      msg: 'Templet was added and waiting for the review',
    };
  }
}

async function getMyTemplates(uid) {
  if (env.MOCK_META_DELIVERY) {
    const mockFilePath = path.join(
      __dirname,
      '../conversations',
      `mock_meta_templates_${uid}.json`,
    );
    let mockTemplates = [];
    if (fs.existsSync(mockFilePath)) {
      mockTemplates = JSON.parse(fs.readFileSync(mockFilePath, 'utf8'));
    } else {
      mockTemplates = [
        {
          name: 'order_update',
          language: 'en_US',
          category: 'UTILITY',
          status: 'APPROVED',
          components: [{ type: 'BODY', text: 'Hello {{1}}, your order {{2}} has been shipped.' }],
        },
      ];
      fs.writeFileSync(mockFilePath, JSON.stringify(mockTemplates, null, 2), 'utf8');
    }
    return { success: true, data: mockTemplates };
  }

  const getMETA = await syncMetaApiKeys(uid);
  if (getMETA.length < 1) {
    return {
      success: false,
      msg: 'Please check your meta API keys',
    };
  }

  const resp = await metaHelper.getAllTempletsMeta(
    'v18.0',
    getMETA[0]?.waba_id,
    getMETA[0]?.access_token,
  );

  if (resp?.error) {
    return {
      success: false,
      msg: resp?.error?.message || 'Please check your API',
    };
  } else {
    return { success: true, data: resp?.data || [] };
  }
}

async function deleteTemplate({ uid, name }) {
  if (env.MOCK_META_DELIVERY) {
    const mockFilePath = path.join(
      __dirname,
      '../conversations',
      `mock_meta_templates_${uid}.json`,
    );
    let mockTemplates = [];
    if (fs.existsSync(mockFilePath)) {
      mockTemplates = JSON.parse(fs.readFileSync(mockFilePath, 'utf8'));
    }
    mockTemplates = mockTemplates.filter((t) => t.name !== name);
    fs.writeFileSync(mockFilePath, JSON.stringify(mockTemplates, null, 2), 'utf8');
    return {
      success: true,
      data: mockTemplates,
      msg: 'Templet was deleted',
    };
  }

  const getMETA = await syncMetaApiKeys(uid);
  if (getMETA.length < 1) {
    return {
      success: false,
      msg: 'Please check your meta API keys',
    };
  }

  const resp = await metaHelper.delMetaTemplet(
    'v18.0',
    getMETA[0]?.waba_id,
    getMETA[0]?.access_token,
    name,
  );

  if (resp.error) {
    return {
      success: false,
      msg: resp?.error?.error_user_title || 'Please check your API',
    };
  } else {
    return {
      success: true,
      data: resp?.data || [],
      msg: 'Templet was deleted',
    };
  }
}

async function updateTemplate({ uid, name, language, category, components }) {
  if (env.MOCK_META_DELIVERY) {
    const mockFilePath = path.join(
      __dirname,
      '../conversations',
      `mock_meta_templates_${uid}.json`,
    );
    let mockTemplates = [];
    if (fs.existsSync(mockFilePath)) {
      mockTemplates = JSON.parse(fs.readFileSync(mockFilePath, 'utf8'));
    }
    const idx = mockTemplates.findIndex((t) => t.name === name);
    if (idx < 0) {
      return { success: false, msg: 'Template not found' };
    }
    mockTemplates[idx] = {
      ...mockTemplates[idx],
      language: language || mockTemplates[idx].language,
      category: category || mockTemplates[idx].category,
      components: components || mockTemplates[idx].components,
    };
    fs.writeFileSync(mockFilePath, JSON.stringify(mockTemplates, null, 2), 'utf8');
    return { success: true, msg: 'Template was updated successfully' };
  }

  return {
    success: false,
    msg: 'Direct template updates are not supported by the Meta API. Please delete and recreate the template.',
  };
}

async function uploadTemplateMedia({ uid, templet_name, filename, filePath }) {
  const getMETA = await syncMetaApiKeys(uid);
  if (getMETA.length < 1) {
    return {
      success: false,
      msg: 'Please check your meta API keys',
    };
  }

  const { fileSizeInBytes, mimeType } = await metaHelper.getFileInfo(filePath);

  const getSession = await metaHelper.getSessionUploadMediaMeta(
    'v18.0',
    getMETA[0]?.app_id,
    getMETA[0]?.access_token,
    fileSizeInBytes,
    mimeType,
  );

  const uploadFile = await metaHelper.uploadFileMeta(
    getSession?.id,
    filePath,
    'v18.0',
    getMETA[0]?.access_token,
  );

  if (!uploadFile?.success) {
    return { success: false, msg: 'Please check your meta API' };
  }

  await query(
    `INSERT INTO meta_templet_media (uid, templet_name, meta_hash, file_name) VALUES (?,?,?,?)`,
    [uid, templet_name, uploadFile?.data?.h, filename],
  );

  return {
    success: true,
    hash: uploadFile?.data?.h,
  };
}

module.exports = {
  syncMetaApiKeys,
  updateMetaKeys,
  getMetaKeys,
  getBusinessProfile,
  addTemplate,
  getMyTemplates,
  deleteTemplate,
  updateTemplate,
  uploadTemplateMedia,
};
