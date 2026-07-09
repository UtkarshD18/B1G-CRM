const adminSettingsService = require('../services/adminSettingsService.js');

// ─── Web Configuration ────────────────────────────────────────────────────────

async function getWebPublic(req, res, next) {
  try {
    const result = await adminSettingsService.getWebPublic();
    return res.json({ data: result.data, success: true });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong' });
  }
}

// ─── Payment Gateway Configuration ───────────────────────────────────────────

async function getPaymentGateway(req, res, next) {
  try {
    const result = await adminSettingsService.getPaymentGateway();
    return res.json({ data: result.data, success: true });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong' });
  }
}

async function updatePaymentGateway(req, res, next) {
  try {
    const result = await adminSettingsService.updatePaymentGateway(req.body);
    return res.json({ success: true, msg: result.msg });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong' });
  }
}

// ─── Social Login Configuration ───────────────────────────────────────────────

async function getSocialLogin(req, res, next) {
  try {
    const result = await adminSettingsService.getSocialLogin();
    return res.json({ data: result.data, success: true });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'Something went wrong', err, success: false });
  }
}

async function updateSocialLogin(req, res, next) {
  try {
    const {
      google_client_id,
      google_login_active,
      fb_login_app_id,
      fb_login_app_sec,
      fb_login_active,
    } = req.body;
    const result = await adminSettingsService.updateSocialLogin({
      google_client_id,
      google_login_active,
      fb_login_app_id,
      fb_login_app_sec,
      fb_login_active,
    });
    return res.json({ msg: result.msg, success: true });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'Something went wrong', err, success: false });
  }
}

async function updateRtl(req, res, next) {
  try {
    const { rtl } = req.body;
    const result = await adminSettingsService.updateRtl(rtl);
    return res.json({ success: true, msg: result.msg });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'Something went wrong', err, success: false });
  }
}

// ─── SMTP Configuration ───────────────────────────────────────────────────────

async function getSmtp(req, res, next) {
  try {
    const result = await adminSettingsService.getSmtp();
    return res.json({ data: result.data, success: true });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'server error', err });
  }
}

async function updateSmtp(req, res, next) {
  try {
    const { email, port, password, host } = req.body;
    const result = await adminSettingsService.updateSmtp({ email, port, password, host });
    if (!result.success) {
      return res.json({ msg: result.msg });
    }
    return res.json({ success: true, msg: result.msg });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'server error', err });
  }
}

async function sendTestEmail(req, res, next) {
  try {
    const { email, port, password, host, to } = req.body;
    const result = await adminSettingsService.sendTestEmail({ email, port, password, host, to });
    if (result.success) {
      return res.json({ msg: result.msg, success: true });
    }
    return res.json({ msg: result.msg });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'server error', err });
  }
}

// ─── WhatsApp Link Generator ──────────────────────────────────────────────────

async function getWaGenLinks(req, res, next) {
  try {
    const result = await adminSettingsService.getWaGenLinks();
    return res.json({ data: result.data, success: true });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'Something went wrong', err, success: false });
  }
}

async function deleteWaGenLink(req, res, next) {
  try {
    const { id } = req.body;
    const result = await adminSettingsService.deleteWaGenLink(id);
    return res.json({ msg: result.msg, success: true });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'Something went wrong', err, success: false });
  }
}

// ─── Deployment Configuration ─────────────────────────────────────────────────

async function updateDeploymentSettings(req, res, next) {
  try {
    const result = await adminSettingsService.updateDeploymentSettings(req.body);
    return res.json({ success: true, msg: result.msg });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, msg: 'something went wrong', error: err.message });
  }
}

// ─── Infrastructure Metrics (read-only monitoring) ────────────────────────────

async function getTransportMetrics(req, res, next) {
  try {
    const result = await adminSettingsService.getTransportMetrics();
    return res.json({ success: true, data: result.data });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, msg: 'failed to fetch metrics' });
  }
}

module.exports = {
  // Web Configuration
  getWebPublic,
  // Payment Gateway Configuration
  getPaymentGateway,
  updatePaymentGateway,
  // Social Login Configuration
  getSocialLogin,
  updateSocialLogin,
  updateRtl,
  // SMTP Configuration
  getSmtp,
  updateSmtp,
  sendTestEmail,
  // WhatsApp Link Generator
  getWaGenLinks,
  deleteWaGenLink,
  // Deployment Configuration
  updateDeploymentSettings,
  // Infrastructure Metrics (read-only)
  getTransportMetrics,
};
