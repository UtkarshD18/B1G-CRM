const razorpayService = require('../services/razorpayService');
const logger = require('../utils/logger');

/**
 * Handle POST /api/create-order
 * Request: { amount (paise), currency, receipt, notes }
 * Return: { order_id, amount, currency }
 * Minimum amount: 100 paise
 */
async function createOrder(req, res) {
  try {
    const { amount, currency, receipt, notes } = req.body || {};

    const order = await razorpayService.createOrder({
      amount,
      currency,
      receipt,
      notes,
    });

    return res.status(200).json({
      success: true,
      order_id: order.order_id,
      id: order.order_id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      key_id: order.key_id,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    logger.error('createOrder controller error', {
      message: err.message,
      statusCode: status,
      code: err.code,
    });

    return res.status(status).json({
      success: false,
      error: err.message || 'Failed to create Razorpay order',
      code: err.code || 'ORDER_CREATION_FAILED',
      details: err.details || null,
    });
  }
}

/**
 * Handle POST /api/verify-payment
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * Compare generated signature with razorpay_signature
 * Return success only if signatures match
 */
async function verifyPayment(req, res) {
  try {
    const {
      razorpay_order_id,
      order_id,
      razorpay_payment_id,
      payment_id,
      razorpay_signature,
      signature,
      plan,
    } = req.body || {};

    const finalOrderId = razorpay_order_id || order_id;
    const finalPaymentId = razorpay_payment_id || payment_id;
    const finalSignature = razorpay_signature || signature;

    // Only an authenticated token may associate a payment with an account.
    const uid = req.decode?.uid;

    const result = await razorpayService.verifyPayment({
      order_id: finalOrderId,
      payment_id: finalPaymentId,
      signature: finalSignature,
      uid,
      plan_id: plan?.id || plan,
    });

    return res.status(200).json({
      success: true,
      message: result.message || 'Payment verified successfully',
      order_id: result.order_id,
      payment_id: result.payment_id,
      orderSaved: result.orderSaved,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    logger.warn('verifyPayment controller error', {
      message: err.message,
      statusCode: status,
      code: err.code,
    });

    return res.status(status).json({
      success: false,
      error: err.message || 'Payment verification failed',
      code: err.code || 'VERIFICATION_FAILED',
    });
  }
}

/**
 * Handle GET /api/razorpay/config (or public key config)
 * Returns public Key ID ONLY. Never returns Key Secret!
 */
async function getConfig(req, res) {
  try {
    const { keyId } = await razorpayService.getRazorpayCredentials();
    if (!keyId) {
      return res.status(401).json({
        success: false,
        error: 'Razorpay credentials not configured',
      });
    }
    return res.status(200).json({
      success: true,
      key_id: keyId,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Unable to get Razorpay configuration',
    });
  }
}

module.exports = {
  createOrder,
  verifyPayment,
  getConfig,
};
