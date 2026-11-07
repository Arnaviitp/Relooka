const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, clearTestDB, closeTestDB } = require('../setup/db');
const User = require('../../src/modules/users/user.model');
const Hub = require('../../src/modules/hubs/hub.model');
const Listing = require('../../src/modules/listings/listing.model');
const { Order } = require('../../src/modules/orders/order.model');

describe('Milestone 4: Order Lifecycle State Machine, Deposit Ledger & Handover', () => {
  let renterToken, renterId;
  let lenderToken, lenderId;
  let adminToken, adminId;
  let hubStaffToken, hubStaffId;
  let deliveryAgentToken, deliveryAgentId;
  let activeListing, partnerHub;

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
      email: 'rohan@rent.in',
      phone: '+919999000001',
      password: 'Password123!',
      capabilities: ['renter']
    });
    renterToken = rRes.body.data.tokens.accessToken;
    renterId = rRes.body.data.user.id;

    // Lender
    const lRes = await request(app).post('/api/v1/auth/signup').send({
      name: 'Lata Lender',
      email: 'lata@lend.in',
      phone: '+919999000002',
      password: 'Password123!',
      capabilities: ['lender']
    });
    lenderToken = lRes.body.data.tokens.accessToken;
    lenderId = lRes.body.data.user.id;

    // Admin
    const aRes = await request(app).post('/api/v1/auth/signup').send({
      name: 'Admin Chief',
      email: 'chief@admin.in',
      phone: '+919999000003',
      password: 'Password123!',
      role: 'admin'
    });
    adminToken = aRes.body.data.tokens.accessToken;
    adminId = aRes.body.data.user.id;

    // Hub Staff
    const hRes = await request(app).post('/api/v1/auth/signup').send({
      name: 'Hub Operator',
      email: 'hub@operator.in',
      phone: '+919999000004',
      password: 'Password123!',
      role: 'hub_staff'
    });
    hubStaffToken = hRes.body.data.tokens.accessToken;
    hubStaffId = hRes.body.data.user.id;

    // Delivery Agent
    const dRes = await request(app).post('/api/v1/auth/signup').send({
      name: 'Agent Vikram',
      email: 'vikram@delivery.in',
      phone: '+919999000005',
      password: 'Password123!',
      role: 'delivery_agent'
    });
    deliveryAgentToken = dRes.body.data.tokens.accessToken;
    deliveryAgentId = dRes.body.data.user.id;

    // Partner Hub
    partnerHub = await Hub.create({
      name: 'Hub Juhu',
      code: 'BOM-02',
      partnerLaundryName: 'EcoLuxe Laundry Co',
      address: 'Plot 10, Juhu Tara Road',
      city: 'Mumbai',
      pincode: '400049',
      contactPhone: '+919820999999'
    });

    // Active Listing
    activeListing = await Listing.create({
      lenderId,
      title: 'Raymond Royal Bandhgala',
      description: 'Handcrafted premium velvet bandhgala suit.',
      category: 'suits',
      occasionTags: ['wedding'],
      size: '40R',
      retailPrice: 20000,
      dailyRent: 1500,
      photos: ['/uploads/suit1.jpg'],
      status: 'active',
      isVerified: true,
      qc1: { passed: true },
      qc2: { passed: true },
      pickupAddress: { street: '5 Juhu Scheme', city: 'Mumbai', pincode: '400049' },
      assignedHubId: partnerHub._id
    });
  });

  test('End-to-End order state machine happy path with immutable event logs', async () => {
    // 1. Create order
    const createRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${renterToken}`)
      .send({
        listingId: activeListing._id.toString(),
        rentalDays: 3,
        deliveryAddress: { street: 'Flat 401, Sea View', city: 'Mumbai', pincode: '400049' }
      });

    expect(createRes.status).toBe(201);
    const orderId = createRes.body.data.order._id;
    const handoverOtp = createRes.body.data.order.handover.devOtp;
    expect(createRes.body.data.order.status).toBe('CREATED');
    expect(handoverOtp).toHaveLength(6);

    // 2. Confirm payment
    const payRes = await request(app)
      .post(`/api/v1/orders/${orderId}/confirm-payment`)
      .set('Authorization', `Bearer ${renterToken}`)
      .send({ paymentId: 'pay_test_001' });

    expect(payRes.status).toBe(200);
    expect(payRes.body.data.status).toBe('CONFIRMED');
    expect(payRes.body.data.depositLedger.status).toBe('HELD');

    // 3. Lender submits item (washed)
    const submitRes = await request(app)
      .post(`/api/v1/orders/${orderId}/lender-submit`)
      .set('Authorization', `Bearer ${lenderToken}`)
      .send({ condition: 'washed', notes: 'Item clean in garment bag' });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.status).toBe('LENDER_SUBMITTED');

    // 4. Pickup QC1
    const qc1Res = await request(app)
      .post(`/api/v1/orders/${orderId}/qc1`)
      .set('Authorization', `Bearer ${hubStaffToken}`)
      .send({ passed: true, notes: 'Pickup inspection passed' });

    expect(qc1Res.status).toBe(200);
    expect(qc1Res.body.data.status).toBe('QC1_PASSED');

    // 5. Hub intake QC2
    const qc2Res = await request(app)
      .post(`/api/v1/orders/${orderId}/qc2`)
      .set('Authorization', `Bearer ${hubStaffToken}`)
      .send({ passed: true, notes: 'Hub deep intake QC passed' });

    expect(qc2Res.status).toBe(200);
    expect(qc2Res.body.data.status).toBe('QC2_PASSED');

    // 6. Hub Outbound Washing & Sanitization
    const wash1Res = await request(app)
      .post(`/api/v1/orders/${orderId}/hub-wash-outbound`)
      .set('Authorization', `Bearer ${hubStaffToken}`)
      .send({ notes: 'Eco-dry cleaned' });

    expect(wash1Res.status).toBe(200);
    expect(wash1Res.body.data.status).toBe('HUB_WASHING_OUTBOUND');

    // 7. Dispatch to renter
    const dispatchRes = await request(app)
      .post(`/api/v1/orders/${orderId}/dispatch-renter`)
      .set('Authorization', `Bearer ${hubStaffToken}`)
      .send({ agentId: deliveryAgentId });

    expect(dispatchRes.status).toBe(200);
    expect(dispatchRes.body.data.status).toBe('OUT_FOR_DELIVERY_RENTER');

    // 8. Confirm Handover (Agent checks ID and validates OTP)
    // Bad OTP fails:
    const badHandover = await request(app)
      .post(`/api/v1/orders/${orderId}/handover`)
      .set('Authorization', `Bearer ${deliveryAgentToken}`)
      .send({
        otpEntered: '000000',
        presentedBy: 'renter',
        idType: 'aadhaar',
        idMaskedRef: 'XXXX1122'
      });
    expect(badHandover.status).toBe(400);
    expect(badHandover.body.error.code).toBe('INVALID_HANDOVER_OTP');

    // Good OTP succeeds:
    const goodHandover = await request(app)
      .post(`/api/v1/orders/${orderId}/handover`)
      .set('Authorization', `Bearer ${deliveryAgentToken}`)
      .send({
        otpEntered: handoverOtp,
        presentedBy: 'representative',
        representativeName: 'Priya Sharma (Sister)',
        idType: 'voter_card',
        idMaskedRef: 'XXXX3344'
      });
    expect(goodHandover.status).toBe(200);
    expect(goodHandover.body.data.status).toBe('DELIVERED_TO_RENTER');
    expect(goodHandover.body.data.handover.presentedBy).toBe('representative');

    // 9. Mark In-Use
    const inUseRes = await request(app)
      .post(`/api/v1/orders/${orderId}/mark-in-use`)
      .set('Authorization', `Bearer ${renterToken}`);
    expect(inUseRes.status).toBe(200);
    expect(inUseRes.body.data.status).toBe('IN_USE');

    // 10. Return Pickup
    const pickupRes = await request(app)
      .post(`/api/v1/orders/${orderId}/return-pickup`)
      .set('Authorization', `Bearer ${deliveryAgentToken}`);
    expect(pickupRes.status).toBe(200);
    expect(pickupRes.body.data.status).toBe('RETURN_PICKUP');

    // 11. Return QC (Match)
    const returnQcRes = await request(app)
      .post(`/api/v1/orders/${orderId}/return-qc`)
      .set('Authorization', `Bearer ${hubStaffToken}`)
      .send({ result: 'match', notes: 'Item returned in original condition' });
    expect(returnQcRes.status).toBe(200);
    expect(returnQcRes.body.data.status).toBe('RETURN_QC');

    // 12. Hub Return Washing
    const wash2Res = await request(app)
      .post(`/api/v1/orders/${orderId}/hub-wash-return`)
      .set('Authorization', `Bearer ${hubStaffToken}`);
    expect(wash2Res.status).toBe(200);
    expect(wash2Res.body.data.status).toBe('HUB_WASHING_RETURN');

    // 13. Deliver to Lender
    const toLenderRes = await request(app)
      .post(`/api/v1/orders/${orderId}/deliver-lender`)
      .set('Authorization', `Bearer ${deliveryAgentToken}`);
    expect(toLenderRes.status).toBe(200);
    expect(toLenderRes.body.data.status).toBe('DELIVERED_TO_LENDER');

    // 14. Close order -> Deposit released in full
    const closeRes = await request(app)
      .post(`/api/v1/orders/${orderId}/close`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(closeRes.status).toBe(200);
    expect(closeRes.body.data.status).toBe('CLOSED');
    expect(closeRes.body.data.depositLedger.status).toBe('RELEASED');

    // Verify Immutable Event Log
    const dbOrder = await Order.findById(orderId);
    expect(dbOrder.eventLogs.length).toBeGreaterThanOrEqual(13);
    const actions = dbOrder.eventLogs.map(l => l.action);
    expect(actions).toContain('ORDER_INITIATED');
    expect(actions).toContain('PAYMENT_CAPTURED_AND_DEPOSIT_HELD');
    expect(actions).toContain('HANDOVER_COMPLETED_WITH_ID_AND_OTP');
    expect(actions).toContain('ORDER_CLOSED_DEPOSIT_RESOLVED');
  });

  test('rejects invalid state transitions', async () => {
    const createRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${renterToken}`)
      .send({
        listingId: activeListing._id.toString(),
        rentalDays: 3,
        deliveryAddress: { street: '12 Marine Drive', city: 'Mumbai', pincode: '400020' }
      });

    const orderId = createRes.body.data.order._id;

    // Trying to jump directly from CREATED to DELIVERED_TO_RENTER must fail
    const invalidJump = await request(app)
      .post(`/api/v1/orders/${orderId}/handover`)
      .set('Authorization', `Bearer ${deliveryAgentToken}`)
      .send({
        otpEntered: '123456',
        presentedBy: 'renter',
        idType: 'aadhaar',
        idMaskedRef: 'XXXX1111'
      });

    expect(invalidJump.status).toBe(400);
    expect(invalidJump.body.error.code).toBe('INVALID_TRANSITION');
  });

  test('Return QC Mismatch deducts damage from deposit ledger and releases remainder', async () => {
    // 1. Create and pay
    const createRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${renterToken}`)
      .send({
        listingId: activeListing._id.toString(),
        rentalDays: 3,
        deliveryAddress: { street: '10 Carter Rd', city: 'Mumbai', pincode: '400050' }
      });

    const orderId = createRes.body.data.order._id;
    const handoverOtp = createRes.body.data.order.handover.devOtp;
    const holdAmount = createRes.body.data.order.depositLedger.holdAmount;

    await request(app)
      .post(`/api/v1/orders/${orderId}/confirm-payment`)
      .set('Authorization', `Bearer ${renterToken}`)
      .send({ paymentId: 'pay_test_002' });

    // Progress to RETURN_PICKUP
    await request(app).post(`/api/v1/orders/${orderId}/lender-submit`).set('Authorization', `Bearer ${lenderToken}`).send({ condition: 'washed' });
    await request(app).post(`/api/v1/orders/${orderId}/qc1`).set('Authorization', `Bearer ${hubStaffToken}`).send({ passed: true });
    await request(app).post(`/api/v1/orders/${orderId}/qc2`).set('Authorization', `Bearer ${hubStaffToken}`).send({ passed: true });
    await request(app).post(`/api/v1/orders/${orderId}/hub-wash-outbound`).set('Authorization', `Bearer ${hubStaffToken}`).send({});
    await request(app).post(`/api/v1/orders/${orderId}/dispatch-renter`).set('Authorization', `Bearer ${hubStaffToken}`).send({});
    await request(app).post(`/api/v1/orders/${orderId}/handover`).set('Authorization', `Bearer ${deliveryAgentToken}`).send({
      otpEntered: handoverOtp,
      presentedBy: 'renter',
      idType: 'aadhaar',
      idMaskedRef: 'XXXX4321'
    });
    await request(app).post(`/api/v1/orders/${orderId}/mark-in-use`).set('Authorization', `Bearer ${renterToken}`);
    await request(app).post(`/api/v1/orders/${orderId}/return-pickup`).set('Authorization', `Bearer ${deliveryAgentToken}`);

    // Return QC with MISMATCH and ₹1000 damage
    const damageAmount = 1000;
    const qcRes = await request(app)
      .post(`/api/v1/orders/${orderId}/return-qc`)
      .set('Authorization', `Bearer ${hubStaffToken}`)
      .send({
        result: 'mismatch',
        damageAmount,
        notes: 'Small tear along right sleeve seam'
      });

    expect(qcRes.status).toBe(200);
    expect(qcRes.body.data.returnQC.result).toBe('mismatch');
    expect(qcRes.body.data.returnQC.damageAmount).toBe(damageAmount);

    // Hub wash return & deliver to lender
    await request(app).post(`/api/v1/orders/${orderId}/hub-wash-return`).set('Authorization', `Bearer ${hubStaffToken}`);
    await request(app).post(`/api/v1/orders/${orderId}/deliver-lender`).set('Authorization', `Bearer ${deliveryAgentToken}`);

    // Close order
    const closeRes = await request(app)
      .post(`/api/v1/orders/${orderId}/close`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(closeRes.status).toBe(200);
    expect(closeRes.body.data.status).toBe('CLOSED');
    expect(closeRes.body.data.depositLedger.status).toBe('PARTIALLY_REFUNDED');
    expect(closeRes.body.data.depositLedger.releasedAmount).toBe(holdAmount - damageAmount);
    expect(closeRes.body.data.depositLedger.deductions[0].amount).toBe(damageAmount);
  });

  test('payment webhook confirms order with signature verification and is idempotent', async () => {
    // 1. Create order
    const createRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${renterToken}`)
      .send({
        listingId: activeListing._id.toString(),
        rentalDays: 2,
        deliveryAddress: { street: '12 Marine Drive', city: 'Mumbai', pincode: '400020' }
      });
    expect(createRes.status).toBe(201);
    const orderId = createRes.body.data.order._id;

    // 2. Reject webhook with invalid signature
    const invalidWebhook = await request(app)
      .post('/api/v1/orders/webhook/payment')
      .set('x-razorpay-signature', 'invalid_signature')
      .send({ orderId, paymentId: 'pay_wh_001' });
    expect(invalidWebhook.status).toBe(400);
    expect(invalidWebhook.body.error.code).toBe('INVALID_SIGNATURE');

    // 3. Accept valid webhook
    const validWebhook = await request(app)
      .post('/api/v1/orders/webhook/payment')
      .set('x-razorpay-signature', 'valid_test_sig')
      .set('x-razorpay-event-id', `evt_${orderId}`)
      .send({ orderId, paymentId: 'pay_wh_001' });
    expect(validWebhook.status).toBe(200);
    expect(validWebhook.body.data.processed).toBe(true);

    const verifiedOrder = await Order.findById(orderId);
    expect(verifiedOrder.status).toBe('CONFIRMED');
    expect(verifiedOrder.depositLedger.status).toBe('HELD');

    // 4. Repeated webhook is idempotent
    const repeatWebhook = await request(app)
      .post('/api/v1/orders/webhook/payment')
      .set('x-razorpay-signature', 'valid_test_sig')
      .set('x-razorpay-event-id', `evt_${orderId}`)
      .send({ orderId, paymentId: 'pay_wh_001' });
    expect(repeatWebhook.status).toBe(200);
    expect(repeatWebhook.body.data.idempotent).toBe(true);
  });
});

