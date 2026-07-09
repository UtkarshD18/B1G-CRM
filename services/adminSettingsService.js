const { query } = require('../database/dbpromise.js');
const { sendEmail } = require('../functions/helpers/notificationHelper.js');

// ─── Web Configuration ────────────────────────────────────────────────────────

async function getWebPublic() {
  const data = await query(`SELECT * FROM web_public`, []);
  return { success: true, data: data[0] };
}

// ─── Payment Gateway Configuration ───────────────────────────────────────────

async function getPaymentGateway() {
  const data = await query(`SELECT * FROM web_private`, []);
  if (data.length < 1) {
    return { success: true, data: {} };
  }
  return { success: true, data: data[0] };
}

async function updatePaymentGateway({
  pay_offline_id,
  pay_offline_key,
  offline_active,
  pay_stripe_id,
  pay_stripe_key,
  stripe_active,
  pay_paypal_id,
  pay_paypal_key,
  paypal_active,
  rz_id,
  rz_key,
  rz_active,
  pay_paystack_id,
  pay_paystack_key,
  paystack_active,
  pay_mercadopago_id,
  pay_mercadopago_key,
  mercadopago_active,
}) {
  await query(
    `UPDATE web_private SET  
            pay_offline_id = ?, 
            pay_offline_key = ?, 
            offline_active = ?,
            pay_stripe_id = ?, 
            pay_stripe_key = ?, 
            stripe_active = ?,
            pay_paypal_id = ?,
            pay_paypal_key = ?,
            paypal_active = ?,
            rz_id = ?,
            rz_key = ?,
            rz_active = ?,
            pay_paystack_id = ?,
            pay_paystack_key = ?,
            paystack_active = ?,
            pay_mercadopago_id = ?,
            pay_mercadopago_key = ?,
            mercadopago_active = ?
            `,
    [
      pay_offline_id,
      pay_offline_key,
      offline_active,
      pay_stripe_id,
      pay_stripe_key,
      stripe_active,
      pay_paypal_id,
      pay_paypal_key,
      paypal_active,
      rz_id,
      rz_key,
      rz_active,
      pay_paystack_id,
      pay_paystack_key,
      paystack_active,
      pay_mercadopago_id,
      pay_mercadopago_key,
      mercadopago_active,
    ],
  );

  return { success: true, msg: 'Payment gateway updated' };
}

// ─── Social Login Configuration ───────────────────────────────────────────────

async function getSocialLogin() {
  const data = await query(`SELECT * FROM web_public`, []);
  return { success: true, data: data[0] };
}

async function updateSocialLogin({
  google_client_id,
  google_login_active,
  fb_login_app_id,
  fb_login_app_sec,
  fb_login_active,
}) {
  await query(
    `UPDATE web_public SET google_client_id = ?, google_login_active = ?, fb_login_app_id = ?, fb_login_app_sec = ?, fb_login_active = ?`,
    [google_client_id, google_login_active, fb_login_app_id, fb_login_app_sec, fb_login_active],
  );

  return { success: true, msg: 'Settings updated' };
}

async function updateRtl(rtl) {
  await query(`UPDATE web_public SET rtl = ?`, [rtl ? 1 : 0]);
  return { success: true, msg: 'RTL was updated' };
}

// ─── SMTP Configuration ───────────────────────────────────────────────────────

async function getSmtp() {
  const data = await query(`SELECT * FROM smtp`, []);
  if (data.length < 1) {
    return { success: true, data: { id: 'ID' } };
  }
  return { success: true, data: data[0] };
}

async function updateSmtp({ email, port, password, host }) {
  if (!email || !port || !password || !host) {
    return { success: false, msg: 'Please fill all the fields' };
  }

  const getOne = await query(`SELECT * FROM smtp`, []);
  if (getOne.length < 1) {
    await query(`INSERT INTO smtp (email, host, port, password) VALUES (?,?,?,?)`, [
      email,
      host,
      port,
      password,
    ]);
  } else {
    await query(`UPDATE smtp SET email = ?, host = ?, port = ?, password = ?`, [
      email,
      host,
      port,
      password,
    ]);
  }

  return { success: true, msg: 'Email settings was updated' };
}

async function sendTestEmail({ email, port, password, host, to }) {
  if (!email || !port || !password || !host) {
    return { success: false, msg: 'Please fill all the fields' };
  }

  // Delegate to notificationHelper — no new mail logic here
  const result = await sendEmail(
    host,
    port,
    email,
    password,
    `<h1>This is a test SMTP email!</h1>`,
    'SMTP Testing',
    'Testing Sender',
    to,
  );

  if (result.success) {
    return { success: true, msg: 'Email sent' };
  }
  return { success: false, msg: result?.err };
}

// ─── WhatsApp Link Generator ──────────────────────────────────────────────────

async function getWaGenLinks() {
  const data = await query(`SELECT * FROM gen_links`, []);
  return { success: true, data };
}

async function deleteWaGenLink(id) {
  await query(`DELETE FROM gen_links WHERE id = ?`, [id]);
  return { success: true, msg: 'Generated link was deleted' };
}

// ─── Deployment Configuration ─────────────────────────────────────────────────

async function updateDeploymentSettings({
  meta_app_id,
  meta_app_secret,
  meta_waba_id,
  meta_business_account_id,
  meta_access_token,
  meta_phone_number_id,
  insta_app_id,
  insta_app_secret,
  insta_business_account_id,
  insta_access_token,
  ai_provider_active,
  ai_openai_key,
  ai_openai_model,
  ai_gemini_key,
  ai_gemini_model,
  ai_claude_key,
  ai_claude_model,
  ai_openrouter_key,
  ai_openrouter_model,
  ai_ollama_url,
  ai_ollama_model,
  ai_custom_url,
  ai_custom_model,
  widget_domains,
}) {
  await query(
    `UPDATE web_private SET 
        meta_app_id = ?,
        meta_app_secret = ?,
        meta_waba_id = ?,
        meta_business_account_id = ?,
        meta_access_token = ?,
        meta_phone_number_id = ?,
        insta_app_id = ?,
        insta_app_secret = ?,
        insta_business_account_id = ?,
        insta_access_token = ?,
        ai_provider_active = ?,
        ai_openai_key = ?,
        ai_openai_model = ?,
        ai_gemini_key = ?,
        ai_gemini_model = ?,
        ai_claude_key = ?,
        ai_claude_model = ?,
        ai_openrouter_key = ?,
        ai_openrouter_model = ?,
        ai_ollama_url = ?,
        ai_ollama_model = ?,
        ai_custom_url = ?,
        ai_custom_model = ?,
        widget_domains = ?`,
    [
      meta_app_id || '',
      meta_app_secret || '',
      meta_waba_id || '',
      meta_business_account_id || '',
      meta_access_token || '',
      meta_phone_number_id || '',
      insta_app_id || '',
      insta_app_secret || '',
      insta_business_account_id || '',
      insta_access_token || '',
      ai_provider_active || '',
      ai_openai_key || '',
      ai_openai_model || '',
      ai_gemini_key || '',
      ai_gemini_model || '',
      ai_claude_key || '',
      ai_claude_model || '',
      ai_openrouter_key || '',
      ai_openrouter_model || '',
      ai_ollama_url || '',
      ai_ollama_model || '',
      ai_custom_url || '',
      ai_custom_model || '',
      widget_domains || '',
    ],
  );

  return { success: true, msg: 'Deployment settings updated successfully' };
}

// ─── Infrastructure Metrics (read-only monitoring) ────────────────────────────

async function getTransportMetrics() {
  const queueMetrics = await query(`
      SELECT 
        (SELECT COUNT(*) FROM channel_outgoing_queue WHERE state = 'pending') as pending_out,
        (SELECT COUNT(*) FROM channel_outgoing_queue WHERE state = 'failed' OR state = 'dead_letter') as failed_out,
        (SELECT COUNT(*) FROM channel_incoming_queue WHERE state = 'pending') as pending_in
    `);

  const channelMetrics = await query(
    `SELECT * FROM channel_metrics ORDER BY updated_at DESC LIMIT 50`,
  );

  const workers = await query(`SELECT * FROM transport_workers ORDER BY last_seen DESC`);

  return {
    success: true,
    data: {
      queue: queueMetrics[0] || { pending_out: 0, failed_out: 0, pending_in: 0 },
      channels: channelMetrics,
      workers,
    },
  };
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
