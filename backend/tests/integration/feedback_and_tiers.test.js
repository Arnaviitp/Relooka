const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, clearTestDB, closeTestDB } = require('../setup/db');
const User = require('../../src/modules/users/user.model');
const Hub = require('../../src/modules/hubs/hub.model');
const Listing = require('../../src/modules/listings/listing.model');
const { Order, ORDER_STATES } = require('../../src/modules/orders/order.model');
const env = require('../../src/core/config/env');

describe('Milestone 5: Two-Way Feedback, RFM Tier Engine & Scheduled Nightly Job', () => {
  let renterToken, renterId;
  let lenderToken, lenderId;
  let adminToken, adminId;
  let closedOrder;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Renter
    const rRes = await request(app).post('/api/v1/auth/signup').send({
      name: 'Rohan Renter',
      email: 'rohan.tier@rent.in',
      phone: '+919999000111',
      password: 'Password123!',
      capabilities: ['renter']
    });
    renterToken = rRes.body.data.tokens.accessToken;
    renterId = rRes.body.data.user.id;

    // Lender
    const lRes = await request(app).post('/api/v1/auth/signup').send({
      name: 'Lata Lender',
      email: 'lata.tier@lend.in',
      phone: '+919999000222',
      password: 'Password123!',
      capabilities: ['lender']
    });
    lenderToken = lRes.body.data.tokens.accessToken;
    lenderId = lRes.body.data.user.id;

    // Admin
    const aRes = await request(app).post('/api/v1/auth/signup').send({
      name: 'Tier Admin',
      email: 'admin.tier@loopwear.in',
      phone: '+919999000333',
      password: 'Password123!',
      role: 'admin'
    });
    adminToken = aRes.body.data.tokens.accessToken;
    adminId = aRes.body.data.user.id;

    const hub = await Hub.create({
      name: 'Hub Delhi',
      code: 'DEL-01',
      partnerLaundryName: 'Delhi Drycleaners',
      address: 'GK-1 Market',
      city: 'New Delhi',
      pincode: '110048',
      contactPhone: '+919811122233'
    });

    const listing = await Listing.create({
      lenderId,
      title: 'Manyavar Sherwani Set',
      description: 'Grand silk wedding sherwani with stole.',
      category: 'suits',
      occasionTags: ['wedding'],
      size: '42',
      retailPrice: 35000,
      dailyRent: 2500,
      status: 'active',
      isVerified: true,
      qc1: { passed: true },
      qc2: { passed: true },
      pickupAddress: { street: 'B-12 GK1', city: 'New Delhi', pincode: '110048' },
      assignedHubId: hub._id
    });

    // Create a CLOSED order
    closedOrder = await Order.create({
      orderNumber: 'LW-TEST-CLOSED-01',
      renterId,
      lenderId,
      listingId: listing._id,
      hubId: hub._id,
      status: ORDER_STATES.CLOSED,
      rentalStartDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      rentalEndDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      rentalDays: 3,
      deliveryAddress: { street: 'C-5 Defence Colony', city: 'New Delhi', pincode: '110024' },
      pricing: {
        dailyRate: 2500,
        rentAmount: 7500,
        securityDepositAmount: 3000,
        laundryFee: 150,
        deliveryFee: 99,
        platformFee: 49,
        totalAmount: 10798,
        lenderPayout: 6375
      },
      depositLedger: {
        holdId: 'hold_closed_01',
        holdAmount: 3000,
        status: 'RELEASED',
        releasedAmount: 3000
      },
      returnQC: {
        result: 'match',
        damageAmount: 0
      }
    });
  });

  describe('Two-Way Feedback', () => {
    test('renter rates item accuracy, condition, and lender conduct', async () => {
      const res = await request(app)
        .post(`/api/v1/feedback/orders/${closedOrder._id}`)
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          itemAccuracy: 5,
          itemCondition: 4,
          lenderConduct: 5,
          comment: 'Gorgeous sherwani! Perfectly packaged and pristine.'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.reviewerRole).toBe('renter');
      expect(res.body.data.averageScore).toBe(4.7);

      // Lender's feedback average should update
      const lenderUser = await User.findById(lenderId);
      expect(lenderUser.feedbackCount).toBe(1);
      expect(lenderUser.feedbackScoreAverage).toBe(4.7);
    });

    test('lender rates return condition and renter conduct', async () => {
      const res = await request(app)
        .post(`/api/v1/feedback/orders/${closedOrder._id}`)
        .set('Authorization', `Bearer ${lenderToken}`)
        .send({
          returnCondition: 5,
          renterConduct: 5,
          comment: 'Returned with care and on schedule.'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.reviewerRole).toBe('lender');
      expect(res.body.data.averageScore).toBe(5.0);

      // Renter's feedback average should update
      const renterUser = await User.findById(renterId);
      expect(renterUser.feedbackCount).toBe(1);
      expect(renterUser.feedbackScoreAverage).toBe(5.0);
    });

    test('prevents duplicate feedback from the same user on the same order', async () => {
      await request(app)
        .post(`/api/v1/feedback/orders/${closedOrder._id}`)
        .set('Authorization', `Bearer ${renterToken}`)
        .send({ itemAccuracy: 5, itemCondition: 5, lenderConduct: 5 });

      const duplicate = await request(app)
        .post(`/api/v1/feedback/orders/${closedOrder._id}`)
        .set('Authorization', `Bearer ${renterToken}`)
        .send({ itemAccuracy: 4, itemCondition: 4, lenderConduct: 4 });

      expect(duplicate.status).toBe(409); // DUPLICATE_KEY_ERROR
    });
  });

  describe('RFM + LoopWear Tier Engine', () => {
    test('calculates composite tier score = R x F x M x LoopWear and never zeroes out', async () => {
      const tierService = require('../../src/modules/tiers/tier.service');

      // User with 0 orders gets minimum 1 in R, F, M
      const freshUser = await User.create({
        name: 'Fresh User',
        email: 'fresh@example.com',
        phone: '+919999999000',
        password: 'Password123!',
        loopWearScore: 3.0
      });

      const result = await tierService.recomputeUserTier(freshUser._id);
      expect(result.rfm.R).toBeGreaterThanOrEqual(1);
      expect(result.rfm.F).toBeGreaterThanOrEqual(1);
      expect(result.rfm.M).toBeGreaterThanOrEqual(1);
      expect(result.tierScore).toBeGreaterThanOrEqual(1);
      expect(result.newTier).toBe('Silver');
    });

    test('progresses user tier based on multiple high-value closed rentals', async () => {
      const tierService = require('../../src/modules/tiers/tier.service');

      // Add several closed orders for renter to push Frequency and Monetary into Gold/Platinum
      for (let i = 0; i < 5; i++) {
        await Order.create({
          orderNumber: `LW-EXTRA-${i}`,
          renterId,
          lenderId,
          listingId: closedOrder.listingId,
          hubId: closedOrder.hubId,
          status: ORDER_STATES.CLOSED,
          rentalStartDate: new Date(),
          rentalEndDate: new Date(),
          rentalDays: 3,
          deliveryAddress: { street: 'Delhi', city: 'Delhi', pincode: '110001' },
          pricing: { rentAmount: 6000, totalAmount: 8000 }
        });
      }

      // Recompute tier
      const result = await tierService.recomputeUserTier(renterId);
      expect(result.rfm.R).toBe(5); // Recency within 14 days = 5
      expect(result.rfm.F).toBeGreaterThanOrEqual(3); // >= 5 orders = 3+
      expect(result.rfm.M).toBe(5); // >= 25,000 spend = 5
      expect(result.tierScore).toBeGreaterThanOrEqual(60);
      expect(['Gold', 'Platinum', 'Diamond']).toContain(result.newTier);

      // Verify tier history log in DB
      const updatedUser = await User.findById(renterId);
      expect(updatedUser.tierHistory.length).toBeGreaterThanOrEqual(1);
      expect(updatedUser.tier).toBe(result.newTier);
    });

    test('band changes need zero code changes (config-driven tier thresholds and bands)', async () => {
      const { TierService } = require('../../src/modules/tiers/tier.service');
      const baseTierConfig = require('../../src/core/config/tiers.config');

      // Custom configuration: Low frequency threshold where 2 orders already gives max score 5,
      // and Diamond threshold lowered to 100
      const customConfig = {
        ...baseTierConfig,
        normalizationBands: {
          ...baseTierConfig.normalizationBands,
          frequency: [
            { minCount: 2, score: 5 }, // lowered from 20 to 2
            { minCount: 1, score: 3 },
            { minCount: 0, score: 1 }
          ]
        },
        tierThresholds: {
          Diamond: 100, // lowered from 400
          Platinum: 50,
          Gold: 20,
          Silver: 0
        }
      };

      const customTierService = new TierService(customConfig);
      expect(customTierService._normalizeFrequency(2)).toBe(5);
      expect(customTierService._normalizeFrequency(1)).toBe(3);
      expect(customTierService._normalizeFrequency(0)).toBe(1);
    });
  });

  describe('Milestone 7: Cart View, Info & In-App Notifications Endpoints', () => {
    test('GET /api/v1/users/me/cart returns active listings, active rentals, and summary', async () => {
      const res = await request(app)
        .get('/api/v1/users/me/cart')
        .set('Authorization', `Bearer ${renterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('activeListings');
      expect(res.body.data).toHaveProperty('itemsIAmRenting');
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data.summary).toHaveProperty('activeListingsCount');
      expect(res.body.data.summary).toHaveProperty('itemsRentingCount');
    });

    test('GET /api/v1/users/me/info returns loopwear_id, tier, accountDetails, pastTransactions, and masked payment', async () => {
      const res = await request(app)
        .get('/api/v1/users/me/info')
        .set('Authorization', `Bearer ${renterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const info = res.body.data;
      expect(info.loopwear_id).toMatch(/^LW-[A-Z0-9]{8}$/);
      expect(info.accountDetails.email).toBe('rohan.tier@rent.in');
      expect(info.tier).toHaveProperty('current');
      expect(info.tier).toHaveProperty('benefits');
      expect(info).toHaveProperty('loopwearScore');
      expect(Array.isArray(info.pastTransactions)).toBe(true);
      expect(info.maskedSavedPaymentDetails.type).toBe('UPI');
      expect(info.maskedSavedPaymentDetails.handle).toContain('***');
    });

    test('GET /api/v1/notifications and mark as read', async () => {
      const { notificationAdapter } = require('../../src/core/adapters/push.adapter');
      await notificationAdapter.sendNotification({
        userId: renterId,
        title: 'Rental Update',
        body: 'Your garment has cleared QC2 inspection at the hub!'
      });

      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${renterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const notifId = res.body.data[0].id;
      const readRes = await request(app)
        .patch(`/api/v1/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${renterToken}`);

      expect(readRes.status).toBe(200);
      expect(readRes.body.data.marked).toBe(true);
    });

    test('ML QC stub enqueues media inspection job and analyzes garment image', async () => {
      const { mlClient, mlQueue } = require('../../src/modules/ml');
      
      const job = await mlQueue.enqueueMediaInspection({
        listingId: closedOrder.listingId.toString(),
        photos: ['/uploads/sample-anarkali.jpg']
      });

      expect(job).toHaveProperty('id');
      expect(job.name).toBe('inspect_garment_media');

      const analysis = await mlClient.inspectImage({
        imageUrl: '/uploads/sample-anarkali.jpg',
        listingId: closedOrder.listingId.toString()
      });

      expect(analysis.passed).toBe(true);
      expect(analysis.confidenceScore).toBeGreaterThan(0.9);
      expect(analysis.defects.stainDetected).toBe(false);
      expect(analysis.engine).toBe('loopwear-cv-stub-v1');
    });
  });

  describe('Protected Nightly Cron Endpoint', () => {
    test('rejects unauthorized cron trigger without secret or admin credentials', async () => {
      const res = await request(app).post('/api/v1/tiers/nightly-recompute');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('CRON_UNAUTHORIZED');
    });

    test('accepts cron trigger with valid CRON_SECRET in Authorization header', async () => {
      const res = await request(app)
        .post('/api/v1/tiers/nightly-recompute')
        .set('Authorization', `Bearer ${env.CRON_SECRET}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.processedCount).toBeGreaterThanOrEqual(1);
    });

    test('accepts cron trigger when called by authenticated admin', async () => {
      const res = await request(app)
        .post('/api/v1/tiers/nightly-recompute')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
