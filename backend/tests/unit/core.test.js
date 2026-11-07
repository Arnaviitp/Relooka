const { encrypt, decrypt, generateOtp, hashToken, maskId } = require('../../src/core/utils/crypto');
const defaultPricingConfig = require('../../src/core/config/pricing.config');
const tierConfig = require('../../src/core/config/tiers.config');
const { mailAdapter } = require('../../src/core/adapters/mail.adapter');
const { smsAdapter } = require('../../src/core/adapters/sms.adapter');
const { captchaAdapter } = require('../../src/core/adapters/captcha.adapter');
const { storageAdapter } = require('../../src/core/adapters/storage.adapter');
const { MockPaymentGateway } = require('../../src/core/adapters/payment.adapter');
const { deliveryProvider } = require('../../src/core/adapters/delivery.adapter');
const { idVerificationAdapter } = require('../../src/core/adapters/idVerification.adapter');
const { MemoryQueueAdapter } = require('../../src/core/queue/queue.interface');
const AppError = require('../../src/core/utils/AppError');

describe('Milestone 1: Core Foundation & Adapters', () => {
  describe('Crypto & Sensitive Data Utilities', () => {
    test('AES-256-GCM encrypts and decrypts accurately', () => {
      const sensitiveId = '123456789012';
      const encrypted = encrypt(sensitiveId);
      expect(encrypted).not.toEqual(sensitiveId);
      expect(encrypted.split(':')).toHaveLength(3); // iv:tag:ciphertext

      const decrypted = decrypt(encrypted);
      expect(decrypted).toEqual(sensitiveId);
    });

    test('maskId masks everything except the last 4 characters', () => {
      expect(maskId('123456789012')).toEqual('XXXX9012');
      expect(maskId('ABC1234567')).toEqual('XXXX4567');
      expect(maskId('9876')).toEqual('XXXX9876');
    });

    test('generateOtp produces a 6-digit numeric string', () => {
      const otp = generateOtp();
      expect(otp).toHaveLength(6);
      expect(Number(otp)).toBeGreaterThanOrEqual(100000);
      expect(Number(otp)).toBeLessThanOrEqual(999999);
    });

    test('hashToken produces consistent sha256 output', () => {
      const token = 'sample_secret_token';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);
      expect(hash1).toEqual(hash2);
      expect(hash1).toHaveLength(64);
    });
  });

  describe('Configuration Integrity', () => {
    test('pricing config has all required CFO variables without hardcoding in code', () => {
      expect(defaultPricingConfig).toHaveProperty('platformCommissionPercent');
      expect(defaultPricingConfig).toHaveProperty('renterPlatformFee');
      expect(defaultPricingConfig).toHaveProperty('laundryFee');
      expect(defaultPricingConfig).toHaveProperty('deliveryFee');
      expect(defaultPricingConfig).toHaveProperty('securityDepositPercent');
      expect(defaultPricingConfig.currency).toBe('INR');
    });

    test('tier config has 4 tier bands (Silver, Gold, Platinum, Diamond) and RFM bands', () => {
      expect(tierConfig.tierThresholds).toHaveProperty('Silver');
      expect(tierConfig.tierThresholds).toHaveProperty('Gold');
      expect(tierConfig.tierThresholds).toHaveProperty('Platinum');
      expect(tierConfig.tierThresholds).toHaveProperty('Diamond');
      expect(tierConfig.normalizationBands).toHaveProperty('recency');
      expect(tierConfig.normalizationBands).toHaveProperty('frequency');
      expect(tierConfig.normalizationBands).toHaveProperty('monetary');
    });
  });

  describe('Zero-Budget Adapters', () => {
    test('mail adapter logs OTP/mail safely in dev stub', async () => {
      const res = await mailAdapter.sendMail({
        to: 'user@example.com',
        subject: 'LoopWear OTP',
        text: 'Your code is 123456'
      });
      expect(res.success).toBe(true);
    });

    test('sms adapter logs SMS safely in dev stub with NO paid gateway', async () => {
      const res = await smsAdapter.sendSms({
        to: '+919876543210',
        message: 'Your LoopWear OTP is 123456'
      });
      expect(res.success).toBe(true);
    });

    test('captcha adapter supports bypass for development / tests', async () => {
      const res = await captchaAdapter.verify('dummy_token');
      expect(res.success).toBe(true);
    });

    test('storage adapter writes and removes file locally without cloud dependencies', async () => {
      const buffer = Buffer.from('test image data');
      const saved = await storageAdapter.saveFile({
        buffer,
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        folder: 'test'
      });
      expect(saved.fileKey).toContain('test/');
      expect(saved.url).toContain('/uploads/test/');

      const deleted = await storageAdapter.deleteFile(saved.fileKey);
      expect(deleted).toBe(true);
    });

    test('mock payment gateway creates order, verifies payment, and manages deposit ledger', async () => {
      const gateway = new MockPaymentGateway();
      const order = await gateway.createPaymentIntent({
        orderId: 'ord_123',
        amount: 2500,
        currency: 'INR'
      });
      expect(order.status).toBe('created');
      expect(order.gatewayOrderId).toBeDefined();

      const verification = await gateway.verifyPayment({
        paymentId: 'pay_123',
        gatewayOrderId: order.gatewayOrderId
      });
      expect(verification.success).toBe(true);
      expect(verification.status).toBe('captured');

      // Hold deposit
      const hold = await gateway.holdDeposit({
        orderId: 'ord_123',
        amount: 1500
      });
      expect(hold.status).toBe('HELD');

      // Deduct deposit for damage and release remainder
      const deduction = await gateway.deductDeposit({
        holdId: hold.holdId,
        amount: 1500,
        deductionAmount: 500,
        reason: 'Return QC seam damage'
      });
      expect(deduction.deductedAmount).toBe(500);
      expect(deduction.releasedAmount).toBe(1000);
      expect(deduction.status).toBe('PARTIALLY_REFUNDED');
    });

    test('delivery provider assigns agent and confirms handover with OTP & ID check', async () => {
      const job = await deliveryProvider.createJob({
        orderId: 'ord_999',
        pickupAddress: 'Hub South',
        dropoffAddress: 'Renter Home',
        type: 'hub_to_renter'
      });
      expect(job.status).toBe('pending_assignment');

      await deliveryProvider.assignAgent({
        deliveryId: job.deliveryId,
        agentId: 'agt_01',
        agentName: 'Ramesh Kumar'
      });

      // Handover with invalid OTP fails
      const failedHandover = await deliveryProvider.confirmHandover({
        deliveryId: job.deliveryId,
        presentedBy: 'renter',
        idType: 'aadhaar',
        idMaskedRef: 'XXXX1234',
        otpEntered: '000000',
        expectedOtp: '654321'
      });
      expect(failedHandover.success).toBe(false);

      // Handover with valid OTP succeeds
      const successHandover = await deliveryProvider.confirmHandover({
        deliveryId: job.deliveryId,
        presentedBy: 'renter',
        idType: 'aadhaar',
        idMaskedRef: 'XXXX1234',
        otpEntered: '654321',
        expectedOtp: '654321'
      });
      expect(successHandover.success).toBe(true);
      expect(successHandover.job.status).toBe('delivered');
    });

    test('id verification adapter registers submission for admin review', async () => {
      const sub = await idVerificationAdapter.submitForReview({
        userId: 'usr_42',
        idType: 'aadhaar',
        maskedRef: 'XXXX5678',
        nameAsPrinted: 'Priya Sharma',
        consentGiven: true
      });
      expect(sub.status).toBe('pending_review');
      expect(sub.maskedRef).toBe('XXXX5678');
    });
  });

  describe('Queue & Error System', () => {
    test('MemoryQueue processes jobs in-process without Redis', done => {
      const queue = new MemoryQueueAdapter('test_queue');
      queue.process('send_welcome', async job => {
        expect(job.data.email).toBe('test@example.com');
        done();
      });

      queue.add('send_welcome', { email: 'test@example.com' });
    });

    test('AppError creates operational error with custom status and error code', () => {
      const err = new AppError('Forbidden action', 403, 'FORBIDDEN_ACTION', { reason: 'No permission' });
      expect(err.statusCode).toBe(403);
      expect(err.errorCode).toBe('FORBIDDEN_ACTION');
      expect(err.isOperational).toBe(true);
      expect(err.details).toEqual({ reason: 'No permission' });
    });
  });
});

