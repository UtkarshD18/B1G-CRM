const Razorpay = require('razorpay');
const crypto = require('crypto');
const env = require('../env');
const { query } = require('../database/dbpromise');
const billingHelper = require('../functions/helpers/billingHelper');
const logger = require('../utils/logger');

/**
 * Retrieve Razorpay credentials. An enabled, complete Admin configuration takes
 * precedence; deployment environment variables remain the secure fallback.
 */
async function getRazorpayCredentials() {
  let keyId = env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '';
  let keySecret = env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || '';

  try {
    const rows = await query('SELECT rz_id, rz_key, rz_active FROM web_private LIMIT 1', []);
    const configured = rows?.[0];
    if (Number(configured?.rz_active || 0) > 0 && configured?.rz_id && configured?.rz_key) {
      keyId = configured.rz_id;
      keySecret = configured.rz_key;
    }
  } catch (err) {
    logger.warn('Failed to read Razorpay credentials from web_private database table', {
      error: err.message,
    });
  }

  return { keyId, keySecret };
}

async function validateCredentials(keyId, keySecret) {
  if (!keyId || !keySecret) {
    const error = new Error('Razorpay Key ID and Key Secret are required');
    error.statusCode = 400;
    error.code = 'MISSING_CREDENTIALS';
    throw error;
  }

  if (!/^rzp_(test|live)_[A-Za-z0-9]+$/.test(keyId)) {
    const error = new Error('Invalid Razorpay Key ID format');
    error.statusCode = 400;
    error.code = 'INVALID_KEY_ID';
    throw error;
  }

  try {
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    await client.orders.all({ count: 1 });
    return true;
  } catch (err) {
    const error = new Error('Razorpay rejected the supplied credentials');
    error.statusCode = err.statusCode === 401 || err.status === 401 ? 400 : 502;
    error.code = 'INVALID_RAZORPAY_CREDENTIALS';
    throw error;
  }
}

/**
 * Create a Razorpay client instance.
 */
async function getRazorpayInstance() {
  const { keyId, keySecret } = await getRazorpayCredentials();

  if (!keyId || !keySecret) {
    const error = new Error('Razorpay credentials not configured');
    error.statusCode = 401;
    error.code = 'AUTHENTICATION_REQUIRED';
    throw error;
  }

  return {
    client: new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    }),
    keyId,
    keySecret,
  };
}

/**
 * STEP 1: Create a new Razorpay order
 *
 * @param {Object} params
 * @param {number|string} params.amount Amount in paise (minimum 100 paise)
 * @param {string} [params.currency='INR'] Currency code
 * @param {string} [params.receipt] Receipt identifier
 * @param {Object} [params.notes] Optional metadata
 */
async function createOrder({ amount, currency = 'INR', receipt, notes = {}, uid, plan_id }) {
  let numAmount = Number(amount);
  let trustedNotes = notes && typeof notes === 'object' && !Array.isArray(notes) ? notes : {};

  if (uid && plan_id) {
    const plans = await query('SELECT * FROM plan WHERE id = ?', [plan_id]);
    if (!plans?.length) {
      const error = new Error('Invalid plan found');
      error.statusCode = 400;
      error.code = 'INVALID_PLAN';
      throw error;
    }

    numAmount = Math.max(100, Math.round(Number(plans[0].price || 0) * 100));
    currency = 'INR';
    trustedNotes = {
      plan_id: String(plans[0].id),
      uid: String(uid),
    };
  }

  // Validate amount >= 100 paise
  if (!Number.isSafeInteger(numAmount) || numAmount < 100) {
    const error = new Error('Amount must be at least 100 paise (₹1)');
    error.statusCode = 400;
    error.code = 'INVALID_AMOUNT';
    throw error;
  }

  const { client, keyId } = await getRazorpayInstance();

  const options = {
    amount: numAmount,
    currency: (currency || 'INR').toUpperCase(),
    receipt: receipt || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    notes: trustedNotes,
  };

  try {
    const order = await client.orders.create(options);
    return {
      order_id: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      key_id: keyId,
    };
  } catch (err) {
    logger.error('Razorpay order creation failed', {
      error: err.message,
      statusCode: err.statusCode,
      details: err.error,
    });

    const error = new Error(
      err.error?.description || err.message || 'Razorpay order creation failed',
    );
    // Handle auth failures (401) vs Razorpay API errors (500)
    error.statusCode = err.statusCode === 401 || err.status === 401 ? 401 : 500;
    error.details = err.error || null;
    throw error;
  }
}

function signaturesMatch(expected, received) {
  if (typeof received !== 'string' || expected.length !== received.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(received, 'utf8'));
  } catch {
    return false;
  }
}

async function fulfillPlanPayment({
  uid,
  plan_id,
  order_id,
  payment_id,
  signature = null,
  source,
  razorpayOrder,
}) {
  const plans = await query('SELECT * FROM plan WHERE id = ?', [plan_id]);
  if (!plans?.length) {
    const error = new Error('Invalid plan found');
    error.statusCode = 400;
    error.code = 'INVALID_PLAN';
    throw error;
  }

  const plan = plans[0];
  const expectedAmount = Math.max(100, Math.round(Number(plan.price || 0) * 100));
  if (!razorpayOrder) {
    const { client } = await getRazorpayInstance();
    razorpayOrder = await client.orders.fetch(order_id);
  }

  if (
    !razorpayOrder ||
    Number(razorpayOrder.amount) !== expectedAmount ||
    String(razorpayOrder.currency || '').toUpperCase() !== 'INR' ||
    String(razorpayOrder.status || '').toLowerCase() !== 'paid'
  ) {
    const error = new Error('Paid order does not match the selected plan or is not captured');
    error.statusCode = 400;
    error.code = 'PLAN_PAYMENT_MISMATCH';
    throw error;
  }

  const existing = await query(
    `SELECT id FROM orders
     WHERE payment_mode = ? AND data LIKE ?
     LIMIT 1`,
    ['RAZORPAY', `%"payment_id":"${payment_id}"%`],
  );
  if (existing?.length) {
    return { orderSaved: false, duplicate: true };
  }

  await billingHelper.updateUserPlan(plan, uid);
  await query('INSERT INTO orders (uid, payment_mode, amount, data) VALUES (?, ?, ?, ?)', [
    uid,
    'RAZORPAY',
    plan.price || 0,
    JSON.stringify({
      order_id,
      payment_id,
      signature,
      verified: true,
      source,
      timestamp: new Date().toISOString(),
    }),
  ]);

  return { orderSaved: true, duplicate: false };
}

async function verifyPayment({ order_id, payment_id, signature, uid, plan_id }) {
  if (!order_id || !payment_id || !signature) {
    const error = new Error(
      'Missing required fields: order_id, payment_id, and signature are required',
    );
    error.statusCode = 400;
    error.code = 'MISSING_FIELDS';
    throw error;
  }

  if (![order_id, payment_id, signature].every((value) => typeof value === 'string')) {
    const error = new Error('Payment verification fields must be strings');
    error.statusCode = 400;
    error.code = 'INVALID_FIELDS';
    throw error;
  }

  const { keySecret } = await getRazorpayCredentials();
  if (!keySecret) {
    const error = new Error('Razorpay secret not configured');
    error.statusCode = 401;
    error.code = 'AUTHENTICATION_REQUIRED';
    throw error;
  }

  const body = `${order_id}|${payment_id}`;
  const generatedSignature = crypto.createHmac('sha256', keySecret).update(body).digest('hex');

  if (!signaturesMatch(generatedSignature, signature)) {
    const error = new Error('Payment signature verification failed');
    error.statusCode = 400;
    error.code = 'SIGNATURE_MISMATCH';
    throw error;
  }

  let orderSaved = false;
  if (uid && plan_id) {
    try {
      const fulfillment = await fulfillPlanPayment({
        uid,
        plan_id,
        order_id,
        payment_id,
        signature,
        source: 'checkout_callback',
      });
      orderSaved = fulfillment.orderSaved;
    } catch (dbErr) {
      logger.warn('Failed to record verified Razorpay order in database', {
        error: dbErr.message,
        order_id,
        payment_id,
      });
      throw dbErr;
    }
  } else if (uid) {
    // Record standalone payment with uid
    try {
      await query('INSERT INTO orders (uid, payment_mode, amount, data) VALUES (?, ?, ?, ?)', [
        uid,
        'RAZORPAY',
        0,
        JSON.stringify({
          order_id,
          payment_id,
          signature,
          verified: true,
          timestamp: new Date().toISOString(),
        }),
      ]);
      orderSaved = true;
    } catch (dbErr) {
      logger.warn('Failed to record order with uid', { error: dbErr.message });
    }
  }

  return {
    success: true,
    message: 'Payment verified successfully',
    order_id,
    payment_id,
    orderSaved,
  };
}

function verifyWebhookSignature(rawBody, signature) {
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET || '';
  if (!webhookSecret) {
    const error = new Error('Razorpay webhook secret not configured');
    error.statusCode = 503;
    error.code = 'WEBHOOK_NOT_CONFIGURED';
    throw error;
  }
  if (!Buffer.isBuffer(rawBody) || !signature) {
    const error = new Error('Missing Razorpay webhook signature or raw request body');
    error.statusCode = 400;
    error.code = 'INVALID_WEBHOOK_REQUEST';
    throw error;
  }

  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  if (!signaturesMatch(expected, signature)) {
    const error = new Error('Razorpay webhook signature verification failed');
    error.statusCode = 400;
    error.code = 'WEBHOOK_SIGNATURE_MISMATCH';
    throw error;
  }
}

async function processWebhook({ rawBody, signature, eventId, payload }) {
  verifyWebhookSignature(rawBody, signature);

  const eventType = String(payload?.event || 'unknown');
  const payment = payload?.payload?.payment?.entity;
  const order = payload?.payload?.order?.entity;
  const refund = payload?.payload?.refund?.entity;
  const paymentId = payment?.id || refund?.payment_id || null;
  const orderId = payment?.order_id || order?.id || null;
  const entityId = payment?.id || order?.id || refund?.id || null;
  const stableEventId = eventId || crypto.createHash('sha256').update(rawBody).digest('hex');

  const eventRows = await query(
    `INSERT INTO razorpay_webhook_events
      (event_id, event_type, entity_id, order_id, payment_id, status, attempts)
     VALUES (?, ?, ?, ?, ?, 'received', 1)
     ON CONFLICT (event_id) DO UPDATE SET
       attempts = razorpay_webhook_events.attempts + 1,
       updated_at = CURRENT_TIMESTAMP
     RETURNING id, status`,
    [`razorpay:${stableEventId}`, eventType, entityId, orderId, paymentId],
  );

  if (eventRows?.[0]?.status === 'processed') {
    return { duplicate: true, event: eventType };
  }

  try {
    if (['order.paid', 'payment.captured'].includes(eventType) && orderId && paymentId) {
      const { client } = await getRazorpayInstance();
      const razorpayOrder = await client.orders.fetch(orderId);
      const uid = razorpayOrder?.notes?.uid;
      const planId = razorpayOrder?.notes?.plan_id;

      if (uid && planId) {
        await fulfillPlanPayment({
          uid,
          plan_id: planId,
          order_id: orderId,
          payment_id: paymentId,
          source: 'webhook',
          razorpayOrder,
        });
      }
    }

    await query(
      `UPDATE razorpay_webhook_events
       SET status = 'processed', processed_at = CURRENT_TIMESTAMP,
           last_error = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE event_id = ?`,
      [`razorpay:${stableEventId}`],
    );
    return { duplicate: false, event: eventType };
  } catch (err) {
    await query(
      `UPDATE razorpay_webhook_events
       SET status = 'failed', last_error = ?, updated_at = CURRENT_TIMESTAMP
       WHERE event_id = ?`,
      [
        String(err.message || 'Webhook processing failed').slice(0, 1000),
        `razorpay:${stableEventId}`,
      ],
    );
    throw err;
  }
}

module.exports = {
  getRazorpayCredentials,
  getRazorpayInstance,
  validateCredentials,
  createOrder,
  verifyPayment,
  verifyWebhookSignature,
  processWebhook,
};
