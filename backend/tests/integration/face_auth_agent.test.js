const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, closeTestDB, clearTestDB } = require('../setup/db');
const User = require('../../src/modules/users/user.model');

describe('Face Authentication Agent Integration (D:\\Agents)', () => {
  let authToken;
  let userId;
  let adminToken;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create standard user
    const userRes = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Aanya Sharma',
        email: 'aanya@example.com',
        phone: '+919876543210',
        password: 'Password123!',
        capabilities: ['renter']
      });

    // Auto verify email OTP in test
    await request(app)
      .post('/api/v1/auth/verify-email-otp')
      .send({
        email: 'aanya@example.com',
        otp: userRes.body.data.devOtps.emailOtp
      });

    authToken = userRes.body.data.tokens.accessToken;
    userId = userRes.body.data.user.id;

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@loopwear.in',
      phone: '+919000000000',
      password: 'AdminPassword123!',
      role: 'admin',
      capabilities: ['renter', 'lender'],
      isEmailVerified: true,
      isPhoneVerified: true
    });

    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        emailOrPhone: 'admin@loopwear.in',
        password: 'AdminPassword123!'
      });
    adminToken = adminLoginRes.body.data.tokens.accessToken;
  });

  test('GET /api/v1/users/face-auth/health returns status check', async () => {
    const res = await request(app).get('/api/v1/users/face-auth/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  test('Complete Face Auth verification lifecycle via Agent adapter', async () => {
    // 1. Create Face Auth Session
    const sessionRes = await request(app)
      .post('/api/v1/users/me/face-auth/session')
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(sessionRes.status).toBe(201);
    expect(sessionRes.body.success).toBe(true);
    const verificationId = sessionRes.body.data.verification_id;
    expect(verificationId).toBeDefined();

    // 2. Upload ID Document (Aadhaar)
    const docRes = await request(app)
      .post('/api/v1/users/me/face-auth/document')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        verificationId,
        documentType: 'aadhaar',
        imageBase64: 'data:image/jpeg;base64,sampleBase64IdImage',
        nameAsPrinted: 'Aanya Sharma',
        consentGiven: true
      });

    expect(docRes.status).toBe(200);
    expect(docRes.body.success).toBe(true);
    expect(docRes.body.data.status).toBe('DOCUMENT_VALIDATED');
    expect(docRes.body.data.masked_id_number).toBeDefined();

    // 3. Initiate Live Video Session (Active Challenge)
    const challengeRes = await request(app)
      .post('/api/v1/users/me/face-auth/live-session')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ verificationId });

    expect(challengeRes.status).toBe(200);
    expect(challengeRes.body.success).toBe(true);
    expect(challengeRes.body.data.challenge_action).toBeDefined();
    expect(challengeRes.body.data.challenge_nonce).toBeDefined();

    // 4. Submit Video Frames for Liveness Check
    const framesRes = await request(app)
      .post('/api/v1/users/me/face-auth/frames')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        verificationId,
        framesBase64: [
          'data:image/jpeg;base64,frame1',
          'data:image/jpeg;base64,frame2',
          'data:image/jpeg;base64,frame3',
          'data:image/jpeg;base64,frame4',
          'data:image/jpeg;base64,frame5'
        ]
      });

    expect(framesRes.status).toBe(200);
    expect(framesRes.body.success).toBe(true);
    expect(framesRes.body.data.status).toBe('LIVENESS_CHECKED');

    // 5. Complete Final Verification Decision
    const completeRes = await request(app)
      .post('/api/v1/users/me/face-auth/complete')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        verificationId,
        documentType: 'aadhaar',
        nameAsPrinted: 'Aanya Sharma'
      });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.success).toBe(true);
    expect(completeRes.body.data.status).toBe('VERIFIED');
    expect(completeRes.body.data.user.idVerification.status).toBe('verified');

    // Verify user profile reflects verified status in database
    const profileRes = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.idVerification.status).toBe('verified');
    expect(profileRes.body.data.idVerification.nameAsPrinted).toBe('Aanya Sharma');
    expect(profileRes.body.data.idVerification.agentVerdict).toBe('VERIFIED');
  });

  test('Admin dashboard can view agent verification details in review list', async () => {
    // Set user to manual review
    const user = await User.findById(userId);
    user.setAgentVerificationResult({
      idType: 'passport',
      maskedRef: 'A***7890',
      nameAsPrinted: 'Aanya Sharma',
      verificationId: 'v_flagged_123',
      verdict: 'MANUAL_REVIEW',
      checksSummary: {
        document_readability: 'PASSED',
        face_quality: 'PASSED',
        liveness: 'PASSED',
        face_match: 'MANUAL_REVIEW'
      },
      reasonCode: 'FACE_MATCH_MARGINAL'
    });
    await user.save();

    const adminReviewsRes = await request(app)
      .get('/api/v1/users/admin/id-reviews')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminReviewsRes.status).toBe(200);
    expect(adminReviewsRes.body.success).toBe(true);
    expect(adminReviewsRes.body.data.length).toBeGreaterThan(0);
    const review = adminReviewsRes.body.data.find(r => String(r.userId) === String(userId));
    expect(review).toBeDefined();
    expect(review.agentVerdict).toBe('MANUAL_REVIEW');
    expect(review.reasonCode).toBe('FACE_MATCH_MARGINAL');
    expect(review.checksSummary).toBeDefined();
  });
});
