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

module.exports = {
  syncMetaApiKeys,
  updateMetaKeys,
  getMetaKeys,
};
