const Razorpay = require('razorpay');
const crypto = require('crypto');
const env = require('../env');
const { query } = require('../database/dbpromise');
const billingHelper = require('../functions/helpers/billingHelper');
const logger = require('../utils/logger');

/**
 * Retrieve Razorpay credentials from environment variables or database fallback.
 */
async function getRazorpayCredentials() {
  let keyId = env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '';
  let keySecret = env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || '';

  if (!keyId || !keySecret) {
    try {
      const rows = await query('SELECT rz_id, rz_key FROM web_private LIMIT 1', []);
      if (rows && rows.length > 0) {
        if (!keyId) keyId = rows[0]?.rz_id || '';
        if (!keySecret) keySecret = rows[0]?.rz_key || '';
      }
    } catch (err) {
      logger.warn('Failed to read Razorpay credentials from web_private database table', {
        error: err.message,
      });
    }
  }

  return { keyId, keySecret };
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
async function createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  const numAmount = Number(amount);

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
    notes: notes || {},
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

/**
 * STEP 3: Verify payment signature using HMAC-SHA256
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 *
 * @param {Object} params
 * @param {string} params.order_id Razorpay order ID
 * @param {string} params.payment_id Razorpay payment ID
 * @param {string} params.signature Razorpay signature
 * @param {string} [params.uid] Optional user ID to associate payment with
 * @param {string|number} [params.plan_id] Optional plan to upgrade/activate
 */
async function verifyPayment({ order_id, payment_id, signature, uid, plan_id }) {
  // Missing fields check
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

  // Compare generated signature with razorpay_signature safely
  let isValid = false;
  if (generatedSignature.length === signature.length) {
    try {
      isValid = crypto.timingSafeEqual(
        Buffer.from(generatedSignature, 'utf-8'),
        Buffer.from(signature, 'utf-8'),
      );
    } catch {
      isValid = false;
    }
  }

  if (!isValid) {
    const error = new Error('Payment signature verification failed');
    error.statusCode = 400;
    error.code = 'SIGNATURE_MISMATCH';
    throw error;
  }

  // A valid signature proves the response came from Razorpay, but it does not
  // prove that the order amount matches the selected subscription plan.
  let orderSaved = false;
  if (uid && plan_id) {
    try {
      const plans = await query('SELECT * FROM plan WHERE id = ?', [plan_id]);
      if (!plans || plans.length === 0) {
        const error = new Error('Invalid plan found');
        error.statusCode = 400;
        error.code = 'INVALID_PLAN';
        throw error;
      }

      const plan = plans[0];
      const expectedAmount = Math.max(100, Math.round(Number(plan.price || 0) * 100));
      const { client } = await getRazorpayInstance();
      const razorpayOrder = await client.orders.fetch(order_id);

      if (
        !razorpayOrder ||
        Number(razorpayOrder.amount) !== expectedAmount ||
        String(razorpayOrder.currency || '').toUpperCase() !== 'INR'
      ) {
        const error = new Error('Paid order amount does not match the selected plan');
        error.statusCode = 400;
        error.code = 'PLAN_AMOUNT_MISMATCH';
        throw error;
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
          timestamp: new Date().toISOString(),
        }),
      ]);
      orderSaved = true;
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

module.exports = {
  getRazorpayCredentials,
  getRazorpayInstance,
  createOrder,
  verifyPayment,
};
