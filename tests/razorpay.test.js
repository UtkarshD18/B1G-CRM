const crypto = require('crypto');
const express = require('express');
const request = require('supertest');

const mockCreateOrder = jest.fn();
const mockFetchOrder = jest.fn();
const mockQuery = jest.fn();
const mockUpdateUserPlan = jest.fn();

jest.mock('razorpay', () =>
  jest.fn().mockImplementation(() => ({
    orders: {
      create: mockCreateOrder,
      fetch: mockFetchOrder,
    },
  })),
);

jest.mock('../database/dbpromise', () => ({ query: mockQuery }));
jest.mock('../functions/helpers/billingHelper', () => ({
  updateUserPlan: mockUpdateUserPlan,
}));

jest.mock('../env', () => ({
  RAZORPAY_KEY_ID: 'rzp_test_unit_key',
  RAZORPAY_KEY_SECRET: 'unit_test_secret',
}));

const razorpayRoute = require('../routes/razorpay');
const razorpayService = require('../services/razorpayService');

describe('Razorpay Standard Web Checkout Integration Tests', () => {
  let app;
  const testKeyId = 'rzp_test_unit_key';
  const testKeySecret = 'unit_test_secret';

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api', razorpayRoute);
  });

  describe('STEP 1: Backend - Create Order (/api/create-order)', () => {
    beforeEach(() => {
      mockCreateOrder.mockReset();
    });

    it('should reject requests with amount less than 100 paise with status 400', async () => {
      const res = await request(app)
        .post('/api/create-order')
        .send({ amount: 50, currency: 'INR' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Amount must be at least 100 paise');
    });

    it('should reject requests without amount with status 400', async () => {
      const res = await request(app).post('/api/create-order').send({ currency: 'INR' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-numeric amount with status 400', async () => {
      const res = await request(app).post('/api/create-order').send({ amount: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should successfully create an order via Razorpay API and return order_id, amount, currency', async () => {
      mockCreateOrder.mockResolvedValue({
        id: 'order_unit_test',
        amount: 500,
        currency: 'INR',
        receipt: 'test_receipt_001',
        status: 'created',
      });

      const res = await request(app).post('/api/create-order').send({
        amount: 500, // 500 paise = ₹5
        currency: 'INR',
        receipt: 'test_receipt_001',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order_id).toBeDefined();
      expect(typeof res.body.order_id).toBe('string');
      expect(res.body.order_id).toBe('order_unit_test');
      expect(res.body.amount).toBe(500);
      expect(res.body.currency).toBe('INR');
    });
  });

  describe('STEP 3: Backend - Verify Signature (/api/verify-payment)', () => {
    it('should reject verification when order_id is missing with status 400', async () => {
      const res = await request(app).post('/api/verify-payment').send({
        razorpay_payment_id: 'pay_test123',
        razorpay_signature: 'sig123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Missing required fields');
    });

    it('should reject verification when payment_id is missing with status 400', async () => {
      const res = await request(app).post('/api/verify-payment').send({
        razorpay_order_id: 'order_test123',
        razorpay_signature: 'sig123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Missing required fields');
    });

    it('should reject verification when signature is missing with status 400', async () => {
      const res = await request(app).post('/api/verify-payment').send({
        razorpay_order_id: 'order_test123',
        razorpay_payment_id: 'pay_test123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Missing required fields');
    });

    it('should reject invalid payment signature with status 400 (do NOT mark as paid)', async () => {
      const res = await request(app).post('/api/verify-payment').send({
        razorpay_order_id: 'order_M1234567890abc',
        razorpay_payment_id: 'pay_N9876543210xyz',
        razorpay_signature: 'invalid_tampered_signature_1234567890abcdef',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('signature verification failed');
    });

    it('should successfully verify valid HMAC-SHA256 signature with status 200', async () => {
      const orderId = 'order_valid_12345';
      const paymentId = 'pay_valid_67890';

      // Generate exact HMAC-SHA256 signature
      const validSignature = crypto
        .createHmac('sha256', testKeySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const res = await request(app).post('/api/verify-payment').send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Payment verified successfully');
      expect(res.body.order_id).toBe(orderId);
      expect(res.body.payment_id).toBe(paymentId);
    });

    it('should also accept alias field names: order_id, payment_id, signature', async () => {
      const orderId = 'order_alias_999';
      const paymentId = 'pay_alias_888';

      const validSignature = crypto
        .createHmac('sha256', testKeySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const res = await request(app).post('/api/verify-payment').send({
        order_id: orderId,
        payment_id: paymentId,
        signature: validSignature,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order_id).toBe(orderId);
      expect(res.body.payment_id).toBe(paymentId);
    });

    it('should not activate a plan when the paid order amount is too low', async () => {
      const orderId = 'order_underpaid';
      const paymentId = 'pay_underpaid';
      const validSignature = crypto
        .createHmac('sha256', testKeySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      mockQuery.mockResolvedValueOnce([{ id: 7, price: 500 }]);
      mockFetchOrder.mockResolvedValueOnce({ amount: 100, currency: 'INR' });

      await expect(
        razorpayService.verifyPayment({
          order_id: orderId,
          payment_id: paymentId,
          signature: validSignature,
          uid: 'user_test',
          plan_id: 7,
        }),
      ).rejects.toMatchObject({
        code: 'PLAN_AMOUNT_MISMATCH',
        statusCode: 400,
      });
      expect(mockUpdateUserPlan).not.toHaveBeenCalled();
    });
  });

  describe('Config & Security', () => {
    it('should expose public key_id on /api/razorpay/config without exposing secret', async () => {
      const res = await request(app).get('/api/razorpay/config');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.key_id).toBe(testKeyId);
      expect(res.body.key_secret).toBeUndefined();
      expect(res.body.RAZORPAY_KEY_SECRET).toBeUndefined();
    });
  });
});
