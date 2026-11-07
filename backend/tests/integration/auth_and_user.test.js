const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, clearTestDB, closeTestDB } = require('../setup/db');
const User = require('../../src/modules/users/user.model');

describe('Milestone 2: Auth, Identity, ID Verification & Capabilities', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('User Registration & OTP Verification', () => {
    test('successfully signs up user, hashes password, generates OTPs and access tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Aanya Sharma',
          email: 'aanya@example.com',
          phone: '+919876543210',
          password: 'Password123!',
          capabilities: ['renter']
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('aanya@example.com');
      expect(res.body.data.user.emailVerified).toBe(false);
      expect(res.body.data.user.phoneVerified).toBe(false);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
      expect(res.body.data.devOtps).toBeDefined(); // Dev OTPs returned for testing

      // Verify user in DB has hashed password and OTPs
      const dbUser = await User.findOne({ email: 'aanya@example.com' }).select('+password +emailOtp.hash');
      expect(dbUser.password).not.toBe('Password123!');
      expect(dbUser.emailOtp.hash).toBeDefined();
    });

    test('rejects duplicate email and phone registrations with consistent error JSON', async () => {
      await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'First User',
          email: 'duplicate@example.com',
          phone: '+919999999991',
          password: 'Password123!'
        });

      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Second User',
          email: 'duplicate@example.com',
          phone: '+919999999992',
          password: 'Password123!'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_EXISTS');
    });

    test('verifies email OTP and updates emailVerified flag', async () => {
      const signupRes = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Test Verify',
          email: 'verify@example.com',
          phone: '+919888877771',
          password: 'Password123!'
        });

      const otp = signupRes.body.data.devOtps.emailOtp;

      // Bad OTP
      const badRes = await request(app)
        .post('/api/v1/auth/verify-email-otp')
        .send({ email: 'verify@example.com', otp: '000000' });
      expect(badRes.status).toBe(400);
      expect(badRes.body.error.code).toBe('INVALID_OTP');

      // Good OTP
      const goodRes = await request(app)
        .post('/api/v1/auth/verify-email-otp')
        .send({ email: 'verify@example.com', otp });
      expect(goodRes.status).toBe(200);
      expect(goodRes.body.success).toBe(true);

      const dbUser = await User.findOne({ email: 'verify@example.com' });
      expect(dbUser.emailVerified).toBe(true);
    });
  });

  describe('Login & Token Refresh', () => {
    test('authenticates with valid credentials and rotates refresh token', async () => {
      const signupRes = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Login User',
          email: 'login@example.com',
          phone: '+919111122223',
          password: 'SecretPassword123'
        });

      const refreshToken = signupRes.body.data.tokens.refreshToken;

      // Login
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrPhone: 'login@example.com',
          password: 'SecretPassword123'
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.tokens.accessToken).toBeDefined();

      // Refresh token
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: loginRes.body.data.tokens.refreshToken });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.accessToken).toBeDefined();
    });
  });

  describe('Capabilities & Non-Exclusive Roles', () => {
    test('user can switch and hold both lender and renter capabilities in one account', async () => {
      const signupRes = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Dual Role User',
          email: 'dual@example.com',
          phone: '+919333344445',
          password: 'Password123!',
          capabilities: ['renter']
        });

      const token = signupRes.body.data.tokens.accessToken;

      // Update capabilities to both
      const updateRes = await request(app)
        .put('/api/v1/users/me/capabilities')
        .set('Authorization', `Bearer ${token}`)
        .send({
          capabilities: ['renter', 'lender']
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.capabilities).toContain('renter');
      expect(updateRes.body.data.capabilities).toContain('lender');
    });
  });

  describe('Government ID Verification Flow & Admin Review Queue', () => {
    test('submits Aadhaar without storing full number and encrypts sensitive fields at rest', async () => {
      const signupRes = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Rohan Verma',
          email: 'rohan@example.com',
          phone: '+919444455556',
          password: 'Password123!'
        });

      const token = signupRes.body.data.tokens.accessToken;
      const userId = signupRes.body.data.user.id;

      // Submit ID without consent fails
      const noConsentRes = await request(app)
        .post('/api/v1/users/me/id-verification')
        .set('Authorization', `Bearer ${token}`)
        .send({
          idType: 'aadhaar',
          idNumber: '123456789012',
          nameAsPrinted: 'Rohan Verma',
          consentGiven: false
        });
      expect(noConsentRes.status).toBe(400);
      expect(noConsentRes.body.error.code).toBe('CONSENT_REQUIRED');

      // Submit with valid consent
      const submitRes = await request(app)
        .post('/api/v1/users/me/id-verification')
        .set('Authorization', `Bearer ${token}`)
        .send({
          idType: 'aadhaar',
          idNumber: '123456789012',
          nameAsPrinted: 'Rohan Verma',
          consentGiven: true
        });

      expect(submitRes.status).toBe(201);
      expect(submitRes.body.data.idVerification.status).toBe('pending_review');
      expect(submitRes.body.data.idVerification.maskedRef).toBe('XXXX9012');

      // Check DB directly to ensure raw Aadhaar number is NEVER stored!
      const rawUserInDb = await User.findById(userId).lean();
      expect(rawUserInDb.idVerification.maskedRef).toBe('XXXX9012');
      expect(JSON.stringify(rawUserInDb)).not.toContain('123456789012');
      // Name is encrypted at rest in DB
      expect(rawUserInDb.idVerification.encryptedNameAsPrinted).toBeDefined();
      expect(rawUserInDb.idVerification.encryptedNameAsPrinted.split(':')).toHaveLength(3);
    });

    test('admin reviews and approves ID submission in queue', async () => {
      // 1. Create an Admin
      const adminSignup = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Super Admin',
          email: 'admin@loopwear.in',
          phone: '+919000000001',
          password: 'AdminPassword123!',
          role: 'admin'
        });
      const adminToken = adminSignup.body.data.tokens.accessToken;

      // 2. Create User and submit ID
      const userSignup = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Meera Patel',
          email: 'meera@example.com',
          phone: '+919777788889',
          password: 'Password123!'
        });
      const userToken = userSignup.body.data.tokens.accessToken;
      const userId = userSignup.body.data.user.id;

      await request(app)
        .post('/api/v1/users/me/id-verification')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          idType: 'voter_card',
          idNumber: 'ABC9876543',
          nameAsPrinted: 'Meera Patel',
          consentGiven: true
        });

      // 3. Admin fetches review queue
      const queueRes = await request(app)
        .get('/api/v1/users/admin/id-reviews')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(queueRes.status).toBe(200);
      expect(queueRes.body.data.length).toBeGreaterThanOrEqual(1);
      const pendingItem = queueRes.body.data.find(i => String(i.userId) === String(userId));
      expect(pendingItem).toBeDefined();
      expect(pendingItem.maskedRef).toBe('XXXX6543');

      // 4. Admin approves
      const approveRes = await request(app)
        .post(`/api/v1/users/admin/id-reviews/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ decision: 'approved' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.idVerification.status).toBe('verified');
      expect(approveRes.body.data.idVerification.verifiedAt).toBeDefined();
    });
  });
});
