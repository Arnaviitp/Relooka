const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, clearTestDB, closeTestDB } = require('../setup/db');
const User = require('../../src/modules/users/user.model');
const Hub = require('../../src/modules/hubs/hub.model');
const Listing = require('../../src/modules/listings/listing.model');

describe('Milestone 3: Rule-Driven Pricing, Listings & Partner Laundry Hubs', () => {
  let lenderToken, lenderId;
  let adminToken, adminId;
  let hubStaffToken, hubStaffId;
  let testHub;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // 1. Seed Lender
    const lenderRes = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Anita L.',
        email: 'anita@example.com',
        phone: '+919876543201',
        password: 'Password123!',
        capabilities: ['lender']
      });
    lenderToken = lenderRes.body.data.tokens.accessToken;
    lenderId = lenderRes.body.data.user.id;

    // 2. Seed Admin
    const adminRes = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Admin One',
        email: 'admin1@loopwear.in',
        phone: '+919876543202',
        password: 'AdminPassword123!',
        role: 'admin'
      });
    adminToken = adminRes.body.data.tokens.accessToken;
    adminId = adminRes.body.data.user.id;

    // 3. Seed Hub Staff
    const staffRes = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Staff Ramesh',
        email: 'ramesh@hub.in',
        phone: '+919876543203',
        password: 'StaffPassword123!',
        role: 'hub_staff'
      });
    hubStaffToken = staffRes.body.data.tokens.accessToken;
    hubStaffId = staffRes.body.data.user.id;

    // 4. Seed Hub
    testHub = await Hub.create({
      name: 'LoopWear Hub Bandra',
      code: 'BOM-01',
      partnerLaundryName: 'CleanWaves Premium Laundry',
      address: 'Shop 4, Linking Road, Bandra West',
      city: 'Mumbai',
      pincode: '400050',
      contactPhone: '+919820011223'
    });
  });

  describe('Rule-Driven Pricing Service', () => {
    test('calculates accurate pricing quote with CFO config rules without hardcoded values', async () => {
      const res = await request(app)
        .post('/api/v1/pricing/quote')
        .send({
          dailyRent: 1000,
          retailPrice: 10000,
          rentalDays: 3,
          renterTier: 'Silver'
        });

      expect(res.status).toBe(200);
      const quote = res.body.data;
      expect(quote.rentalDays).toBe(3);
      expect(quote.itemRent.grossRent).toBe(3000);
      expect(quote.itemRent.netRent).toBe(3000);
      // Security deposit = 30% of 10000 = 3000
      expect(quote.securityDeposit.baseDeposit).toBe(3000);
      expect(quote.securityDeposit.payableDeposit).toBe(3000);
      expect(quote.fees.laundryFee).toBe(150);
      expect(quote.fees.deliveryFee).toBe(99);
      expect(quote.fees.platformFee).toBe(49);
      // Total = 3000 + 3000 + 150 + 99 + 49 = 6298
      expect(quote.totalRenterPayable).toBe(6298);
      // Lender payout: 3000 - 15% (450) = 2550
      expect(quote.lenderPayout.commissionAmount).toBe(450);
      expect(quote.lenderPayout.estimatedPayout).toBe(2550);
    });

    test('applies multi-day rental discount and Platinum tier deposit reduction', async () => {
      const res = await request(app)
        .post('/api/v1/pricing/quote')
        .send({
          dailyRent: 1000,
          retailPrice: 10000,
          rentalDays: 7, // triggers 10% multi-day discount
          renterTier: 'Platinum' // 25% deposit discount, 20% platform fee discount
        });

      expect(res.status).toBe(200);
      const quote = res.body.data;
      expect(quote.itemRent.grossRent).toBe(7000);
      expect(quote.itemRent.durationDiscountPercent).toBe(10);
      expect(quote.itemRent.netRent).toBe(6300); // 7000 - 700
      // 3000 base deposit with 25% Platinum reduction = 2250
      expect(quote.securityDeposit.payableDeposit).toBe(2250);
    });
  });

  describe('Listing Creation, Media Limits & Hub Assignment', () => {
    test('creates listing and automatically assigns nearest partner laundry hub', async () => {
      const res = await request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${lenderToken}`)
        .send({
          title: 'Sabyasachi Floral Anarkali',
          description: 'Authentic designer silk anarkali with delicate hand embroidery.',
          category: 'clothes',
          occasionTags: ['wedding', 'date_night'],
          brand: 'Sabyasachi',
          size: 'M',
          color: 'Blush Pink',
          condition: 'like_new',
          retailPrice: 45000,
          dailyRent: 2500,
          photos: ['/uploads/photo1.jpg', '/uploads/photo2.jpg'],
          pickupAddress: {
            street: '12 Hill Road',
            city: 'Mumbai',
            pincode: '400050'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending_verification');
      expect(res.body.data.assignedHubId).toBe(testHub._id.toString());
      expect(res.body.data.isVerified).toBe(false);
    });

    test('rejects listing with more than 6 photos', async () => {
      const res = await request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${lenderToken}`)
        .send({
          title: 'Too Many Photos Suit',
          description: 'A handsome 3-piece tuxedo.',
          category: 'suits',
          occasionTags: ['prom_night'],
          size: '40R',
          retailPrice: 15000,
          dailyRent: 1200,
          photos: [
            'p1.jpg', 'p2.jpg', 'p3.jpg', 'p4.jpg', 'p5.jpg', 'p6.jpg', 'p7.jpg'
          ],
          pickupAddress: {
            street: '12 Hill Road',
            city: 'Mumbai',
            pincode: '400050'
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(JSON.stringify(res.body.error.details)).toContain('photos');
    });

    test('listing goes live (active) ONLY after admin verification AND both QC checks pass', async () => {
      // 1. Create listing
      const createRes = await request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${lenderToken}`)
        .send({
          title: 'Navy Silk Tuxedo',
          description: 'Impeccably tailored bespoke tuxedo for black-tie events.',
          category: 'suits',
          occasionTags: ['wedding', 'prom_night'],
          size: '42L',
          retailPrice: 30000,
          dailyRent: 2000,
          photos: ['p1.jpg'],
          pickupAddress: {
            street: '15 Turner Road',
            city: 'Mumbai',
            pincode: '400050'
          }
        });

      const listingId = createRes.body.data._id;
      expect(createRes.body.data.status).toBe('pending_verification');

      // 2. Admin verifies
      await request(app)
        .patch(`/api/v1/listings/${listingId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);

      let current = await Listing.findById(listingId);
      expect(current.isVerified).toBe(true);
      expect(current.status).toBe('pending_verification'); // Not active yet!

      // 3. Hub staff performs QC1 (pickup check)
      await request(app)
        .patch(`/api/v1/listings/${listingId}/qc/qc1`)
        .set('Authorization', `Bearer ${hubStaffToken}`)
        .send({ passed: true, notes: 'Fabric intact, no pulls or stains' });

      current = await Listing.findById(listingId);
      expect(current.qc1.passed).toBe(true);
      expect(current.status).toBe('pending_verification'); // Still not active yet!

      // 4. Hub staff performs QC2 (laundry/intake deep check)
      await request(app)
        .patch(`/api/v1/listings/${listingId}/qc/qc2`)
        .set('Authorization', `Bearer ${hubStaffToken}`)
        .send({ passed: true, notes: 'Seams verified, dry clean completed' });

      current = await Listing.findById(listingId);
      expect(current.qc2.passed).toBe(true);
      // NOW it is active!
      expect(current.status).toBe('active');
    });
  });
});
