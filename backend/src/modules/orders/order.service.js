const { Order, ORDER_STATES } = require('./order.model');
const Listing = require('../listings/listing.model');
const User = require('../users/user.model');
const pricingService = require('../pricing/pricing.service');
const AppError = require('../../core/utils/AppError');
const env = require('../../core/config/env');
const { generateOtp, hashToken } = require('../../core/utils/crypto');
const { paymentAdapter } = require('../../core/adapters/payment.adapter');
const { deliveryProvider } = require('../../core/adapters/delivery.adapter');
const { notificationAdapter } = require('../../core/adapters/push.adapter');
const { mailAdapter } = require('../../core/adapters/mail.adapter');

class OrderService {
  async createOrder({ renterId, listingId, rentalDays = 3, rentalStartDate, deliveryAddress }) {
    const renter = await User.findById(renterId);
    if (!renter) {
      throw new AppError('Renter not found', 404, 'RENTER_NOT_FOUND');
    }

    if (!renter.capabilities.includes('renter')) {
      throw new AppError('Account must have "renter" capability enabled to rent', 403, 'RENTER_CAPABILITY_REQUIRED');
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
    }

    if (listing.status !== 'active') {
      throw new AppError('This item is currently unavailable for rent', 400, 'LISTING_NOT_ACTIVE');
    }

    if (listing.lenderId.toString() === renterId.toString()) {
      throw new AppError('Lender cannot rent their own item', 400, 'SELF_RENTAL_PROHIBITED');
    }

    const lender = await User.findById(listing.lenderId);

    // Calculate rule-driven quote
    const quote = pricingService.calculateRentalQuote({
      dailyRent: listing.dailyRent,
      retailPrice: listing.retailPrice,
      rentalDays,
      renterTier: renter.tier,
      lenderTier: lender ? lender.tier : 'Silver'
    });

    const startDate = rentalStartDate ? new Date(rentalStartDate) : new Date();
    const endDate = new Date(startDate.getTime() + quote.rentalDays * 24 * 60 * 60 * 1000);

    // Generate unique order number
    const orderNumber = `LW-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Generate 6-digit delivery handover OTP
    const handoverOtp = generateOtp();

    const order = new Order({
      orderNumber,
      renterId,
      lenderId: listing.lenderId,
      listingId,
      hubId: listing.assignedHubId,
      status: ORDER_STATES.CREATED,
      rentalStartDate: startDate,
      rentalEndDate: endDate,
      rentalDays: quote.rentalDays,
      deliveryAddress,
      pricing: {
        dailyRate: quote.itemRent.dailyRate,
        rentAmount: quote.itemRent.netRent,
        securityDepositAmount: quote.securityDeposit.payableDeposit,
        laundryFee: quote.fees.laundryFee,
        deliveryFee: quote.fees.deliveryFee,
        platformFee: quote.fees.platformFee,
        totalAmount: quote.totalRenterPayable,
        lenderPayout: quote.lenderPayout.estimatedPayout
      },
      depositLedger: {
        holdAmount: quote.securityDeposit.payableDeposit,
        status: 'PENDING'
      },
      handover: {
        otpHash: hashToken(handoverOtp),
        devOtp: env.NODE_ENV !== 'production' ? handoverOtp : undefined
      }
    });

    // Record initial creation log
    order.logTransition({
      toState: ORDER_STATES.CREATED,
      actorId: renterId,
      actorRole: 'renter',
      action: 'ORDER_INITIATED',
      metadata: { totalAmount: quote.totalRenterPayable }
    });

    await order.save();

    // Create payment intent
    const paymentIntent = await paymentAdapter.createPaymentIntent({
      orderId: order._id,
      amount: quote.totalRenterPayable,
      customer: { email: renter.email, name: renter.name }
    });

    order.payment.gatewayOrderId = paymentIntent.gatewayOrderId;
    await order.save();

    return {
      order,
      paymentIntent,
      quote
    };
  }

  async confirmPayment({ orderId, paymentId, gatewayOrderId, renterId }) {
    const order = await Order.findById(orderId).populate('renterId lenderId listingId');
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (!order.canTransitionTo(ORDER_STATES.CONFIRMED)) {
      throw new AppError(`Cannot confirm payment from state: ${order.status}`, 400, 'INVALID_TRANSITION');
    }

    // Verify payment with gateway adapter
    const verification = await paymentAdapter.verifyPayment({
      paymentId,
      gatewayOrderId: gatewayOrderId || order.payment.gatewayOrderId
    });

    if (!verification.success) {
      throw new AppError('Payment verification failed', 400, 'PAYMENT_FAILED');
    }

    order.payment.paymentId = verification.paymentId;
    order.payment.status = 'paid';
    order.payment.paidAt = new Date();

    // Deposit Ledger: Hold security deposit
    const depositHold = await paymentAdapter.holdDeposit({
      orderId: order._id,
      amount: order.pricing.securityDepositAmount,
      customer: { email: order.renterId.email }
    });

    order.depositLedger.holdId = depositHold.holdId;
    order.depositLedger.status = 'HELD';

    // Transition state machine
    order.logTransition({
      toState: ORDER_STATES.CONFIRMED,
      actorId: renterId,
      actorRole: 'renter',
      action: 'PAYMENT_CAPTURED_AND_DEPOSIT_HELD',
      metadata: {
        paymentId: verification.paymentId,
        depositHoldId: depositHold.holdId
      }
    });

    // Mark listing as rented so it cannot be double-booked
    await Listing.findByIdAndUpdate(order.listingId, { status: 'rented' });

    // Send handover OTP to renter via Email and notification
    await mailAdapter.sendMail({
      to: order.renterId.email,
      subject: `Your LoopWear Handover OTP for Order ${order.orderNumber}`,
      text: `Your order is confirmed! Present this secure OTP to the delivery agent at delivery: ${order.handover.devOtp || 'Check your LoopWear app'}`
    });

    await notificationAdapter.sendNotification({
      userId: order.renterId._id,
      title: 'Order Confirmed',
      body: `Order ${order.orderNumber} is confirmed. Handover OTP generated.`
    });

    await notificationAdapter.sendNotification({
      userId: order.lenderId._id,
      title: 'Item Rented!',
      body: `Your outfit ${order.listingId.title} was rented. Please prepare it for pickup.`
    });

    await order.save();
    return order;
  }

  async lenderSubmit({ orderId, lenderId, condition, notes }) {
    if (!['washed', 'unwashed'].includes(condition)) {
      throw new AppError('Lender must declare condition as "washed" or "unwashed"', 400, 'INVALID_CONDITION');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (!order.canTransitionTo(ORDER_STATES.LENDER_SUBMITTED)) {
      throw new AppError(`Cannot submit item from current status: ${order.status}`, 400, 'INVALID_TRANSITION');
    }

    order.lenderSubmission = {
      condition,
      notes: notes || 'Submitted by lender',
      submittedAt: new Date()
    };

    order.logTransition({
      toState: ORDER_STATES.LENDER_SUBMITTED,
      actorId: lenderId,
      actorRole: 'lender',
      action: 'LENDER_HANDED_OVER',
      metadata: { condition, notes }
    });

    await order.save();
    return order;
  }

  async qc1Inspect({ orderId, inspectorId, inspectorRole, passed, notes }) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    if (!order.canTransitionTo(ORDER_STATES.QC1_PASSED)) {
      throw new AppError(`Cannot perform QC1 from status: ${order.status}`, 400, 'INVALID_TRANSITION');
    }

    if (!passed) {
      throw new AppError('Item failed QC1 inspection at pickup. Cannot proceed.', 400, 'QC1_FAILED');
    }

    order.logTransition({
      toState: ORDER_STATES.QC1_PASSED,
      actorId: inspectorId,
      actorRole: inspectorRole || 'hub_staff',
      action: 'QC1_VERIFIED',
      metadata: { passed, notes: notes || 'Pickup QC1 inspection cleared' }
    });

    await order.save();
    return order;
  }

  async qc2Inspect({ orderId, staffId, passed, notes }) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    if (!order.canTransitionTo(ORDER_STATES.QC2_PASSED)) {
      throw new AppError(`Cannot perform QC2 from status: ${order.status}`, 400, 'INVALID_TRANSITION');
    }

    if (!passed) {
      throw new AppError('Item failed QC2 inspection at laundry hub. Cannot proceed.', 400, 'QC2_FAILED');
    }

    order.logTransition({
      toState: ORDER_STATES.QC2_PASSED,
      actorId: staffId,
      actorRole: 'hub_staff',
      action: 'QC2_VERIFIED',
      metadata: { passed, notes: notes || 'Hub deep QC2 inspection cleared' }
    });

    await order.save();
    return order;
  }

  async hubWashOutbound({ orderId, staffId, notes }) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    if (!order.canTransitionTo(ORDER_STATES.HUB_WASHING_OUTBOUND)) {
      throw new AppError(`Cannot start outbound washing from status: ${order.status}`, 400, 'INVALID_TRANSITION');
    }

    order.logTransition({
      toState: ORDER_STATES.HUB_WASHING_OUTBOUND,
      actorId: staffId,
      actorRole: 'hub_staff',
      action: 'OUTBOUND_WASHING_AND_SANITIZATION',
      metadata: { notes: notes || 'Eco-friendly dry clean & sanitization cycle completed' }
    });

    await order.save();
    return order;
  }

  async dispatchToRenter({ orderId, actorId, actorRole, agentId, notes }) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    if (!order.canTransitionTo(ORDER_STATES.OUT_FOR_DELIVERY_RENTER)) {
      throw new AppError(`Cannot dispatch to renter from status: ${order.status}`, 400, 'INVALID_TRANSITION');
    }

    if (agentId) {
      order.assignedAgentId = agentId;
    }

    order.logTransition({
      toState: ORDER_STATES.OUT_FOR_DELIVERY_RENTER,
      actorId,
      actorRole,
      action: 'DISPATCHED_TO_RENTER',
      metadata: { agentId, notes: notes || 'Out for delivery to renter address' }
    });

    await order.save();
    return order;
  }

  /**
   * Rule 4 Handover:
   * Agent checks renter's govt ID against registered details (renter or rep presented;
   * record who presented) AND valid OTP confirmed.
   * Order cannot become "delivered" without this!
   */
  async confirmRenterHandover({
    orderId,
    agentId,
    otpEntered,
    presentedBy, // 'renter' | 'representative'
    representativeName,
    idType,      // 'aadhaar' | 'voter_card' | 'ration_card'
    idMaskedRef
  }) {
    const order = await Order.findById(orderId).select('+handover.otpHash');
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    if (!order.canTransitionTo(ORDER_STATES.DELIVERED_TO_RENTER)) {
      throw new AppError(`Cannot confirm delivery handover from status: ${order.status}`, 400, 'INVALID_TRANSITION');
    }

    // 1. Mandatory ID check
    if (!['renter', 'representative'].includes(presentedBy)) {
      throw new AppError('Presented by must be recorded as "renter" or "representative"', 400, 'INVALID_PRESENTER');
    }

    if (presentedBy === 'representative' && (!representativeName || representativeName.trim().length === 0)) {
      throw new AppError('Representative name must be recorded when ID is presented by representative', 400, 'REPRESENTATIVE_NAME_REQUIRED');
    }

    if (!['aadhaar', 'voter_card', 'ration_card'].includes(idType)) {
      throw new AppError('Valid government ID type must be verified at handover', 400, 'INVALID_ID_TYPE');
    }

    if (!idMaskedRef || idMaskedRef.length < 4) {
      throw new AppError('Masked reference of verified ID must be recorded', 400, 'INVALID_MASKED_REF');
    }

    // 2. Mandatory Handover OTP Check
    if (!otpEntered || hashToken(otpEntered) !== order.handover.otpHash) {
      throw new AppError('Invalid handover OTP. Drop-off cannot be completed without valid recipient OTP.', 400, 'INVALID_HANDOVER_OTP');
    }

    order.handover.presentedBy = presentedBy;
    order.handover.representativeName = representativeName ? representativeName.trim() : null;
    order.handover.idType = idType;
    order.handover.idMaskedRef = idMaskedRef;
    order.handover.verifiedAt = new Date();
    order.handover.agentId = agentId;

    order.logTransition({
      toState: ORDER_STATES.DELIVERED_TO_RENTER,
      actorId: agentId,
      actorRole: 'delivery_agent',
      action: 'HANDOVER_COMPLETED_WITH_ID_AND_OTP',
      metadata: {
        presentedBy,
        representativeName,
        idType,
        idMaskedRef
      }
    });

    await order.save();
    return order;
  }

  async markInUse({ orderId, renterId }) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    if (!order.canTransitionTo(ORDER_STATES.IN_USE)) {
      throw new AppError(`Cannot transition to in-use from status: ${order.status}`, 400, 'INVALID_TRANSITION');
    }

    order.logTransition({
      toState: ORDER_STATES.IN_USE,
      actorId: renterId,
      actorRole: 'renter',
      action: 'ITEM_ACTIVATED_IN_USE',
      metadata: { rentalStartDate: order.rentalStartDate }
    });

    await order.save();
    return order;
  }

  async startReturnPickup({ orderId, agentId, notes }) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    if (!order.canTransitionTo(ORDER_STATES.RETURN_PICKUP)) {
      throw new AppError(`Cannot start return pickup from status: ${order.status}`, 400, 'INVALID_TRANSITION');
    }

    order.logTransition({
      toState: ORDER_STATES.RETURN_PICKUP,
      actorId: agentId,
      actorRole: 'delivery_agent',
      action: 'RETURN_PICKUP_COLLECTED',
      metadata: { notes: notes || 'Item collected from renter, en route to hub' }
    });

    await order.save();
    return order;
  }

  /**
   * Return QC (Match / Mismatch)
   * Rule 3: Return-QC mismatch deducts the damage amount from deposit and releases remainder.
   */
  async returnQCInspect({ orderId, staffId, result, damageAmount = 0, notes }) {
    if (!['match', 'mismatch'].includes(result)) {
      throw new AppError('Return QC result must be "match" or "mismatch"', 400, 'INVALID_QC_RESULT');
    }

    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    if (!order.canTransitionTo(ORDER_STATES.RETURN_QC)) {
      throw new AppError(`Cannot perform return QC from status: ${order.status}`, 400, 'INVALID_TRANSITION');
    }

    const damage = result === 'mismatch' ? Math.max(0, Number(damageAmount || 0)) : 0;
    if (result === 'mismatch' && damage <= 0) {
      throw new AppError('Mismatch requires a positive damage assessment amount', 400, 'DAMAGE_AMOUNT_REQUIRED');
    }

    order.returnQC = {
      result,
      damageAmount: damage,
      notes: notes || (result === 'match' ? 'Item returned in matched pristine condition' : 'Damage/wear identified'),
      inspectedBy: staffId,
      inspectedAt: new Date()
    };

    order.logTransition({
      toState: ORDER_STATES.RETURN_QC,
      actorId: staffId,
      actorRole: 'hub_staff',
      action: 'RETURN_QC_RECORDED',
      metadata: { result, damageAmount: damage, notes }
    });

    await order.save();
    return order;
  }

  async hubWashReturn({ orderId, staffId, notes }) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    if (!order.canTransitionTo(ORDER_STATES.HUB_WASHING_RETURN)) {
      throw new AppError(`Cannot perform return washing from status: ${order.status}`, 400, 'INVALID_TRANSITION');
    }

    order.logTransition({
      toState: ORDER_STATES.HUB_WASHING_RETURN,
      actorId: staffId,
      actorRole: 'hub_staff',
      action: 'RETURN_WASHING_AND_SANITIZATION',
      metadata: { notes: notes || 'Post-rental sanitized wash completed before lender return' }
    });

    await order.save();
    return order;
  }

  async deliverToLender({ orderId, agentId, notes }) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    if (!order.canTransitionTo(ORDER_STATES.DELIVERED_TO_LENDER)) {
      throw new AppError(`Cannot complete delivery to lender from status: ${order.status}`, 400, 'INVALID_TRANSITION');
    }

    order.logTransition({
      toState: ORDER_STATES.DELIVERED_TO_LENDER,
      actorId: agentId,
      actorRole: 'delivery_agent',
      action: 'DELIVERED_BACK_TO_LENDER',
      metadata: { notes: notes || 'Returned safely to lender hands' }
    });

    await order.save();
    return order;
  }

  /**
   * Rule 3 & Order State Machine Closure:
   * Deposits are a ledger: hold, release, deduct.
   * Return-QC mismatch deducts damage amount from deposit and releases remainder.
   * Re-activates listing, triggers tier update.
   */
  async closeOrder({ orderId, actorId, actorRole }) {
    const order = await Order.findById(orderId).populate('listingId');
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    if (!order.canTransitionTo(ORDER_STATES.CLOSED)) {
      throw new AppError(`Cannot close order from status: ${order.status}`, 400, 'INVALID_TRANSITION');
    }

    const holdId = order.depositLedger.holdId;
    const holdAmount = order.depositLedger.holdAmount;
    const returnQC = order.returnQC || { result: 'match', damageAmount: 0 };

    if (returnQC.result === 'mismatch' && returnQC.damageAmount > 0) {
      // Deduct damage and release remainder
      const deductionAmount = Math.min(holdAmount, returnQC.damageAmount);
      const res = await paymentAdapter.deductDeposit({
        holdId,
        amount: holdAmount,
        deductionAmount,
        reason: returnQC.notes || 'Damage deduction from Return QC mismatch'
      });

      order.depositLedger.status = res.status;
      order.depositLedger.releasedAmount = res.releasedAmount;
      order.depositLedger.deductions.push({
        amount: deductionAmount,
        reason: returnQC.notes || 'Return QC mismatch damage assessment',
        assessedBy: returnQC.inspectedBy,
        timestamp: new Date()
      });
      order.depositLedger.resolvedAt = new Date();
    } else {
      // Match: Release deposit in full
      const res = await paymentAdapter.releaseDeposit({
        holdId,
        amount: holdAmount
      });
      order.depositLedger.status = 'RELEASED';
      order.depositLedger.releasedAmount = holdAmount;
      order.depositLedger.resolvedAt = new Date();
    }

    order.logTransition({
      toState: ORDER_STATES.CLOSED,
      actorId,
      actorRole: actorRole || 'admin',
      action: 'ORDER_CLOSED_DEPOSIT_RESOLVED',
      metadata: {
        depositStatus: order.depositLedger.status,
        releasedAmount: order.depositLedger.releasedAmount,
        deductedAmount: order.depositLedger.deductions.reduce((s, d) => s + d.amount, 0)
      }
    });

    // Make listing active again for rent
    if (order.listingId) {
      await Listing.findByIdAndUpdate(order.listingId._id, { status: 'active' });
    }

    await order.save();

    // Trigger tier update if tier engine is available
    try {
      const tierService = require('../tiers/tier.service');
      await tierService.recomputeUserTier(order.renterId);
      await tierService.recomputeUserTier(order.lenderId);
    } catch (_) {
      // Tier engine called safely if loaded
    }

    return order;
  }

  async getOrderById(orderId, userId, userRole) {
    const order = await Order.findById(orderId)
      .populate('renterId', 'name email phone tier')
      .populate('lenderId', 'name email phone tier')
      .populate('listingId')
      .populate('hubId');

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    // Permission check: admin, hub_staff, delivery_agent, or the order's renter/lender
    if (
      userRole !== 'admin' &&
      userRole !== 'hub_staff' &&
      userRole !== 'delivery_agent' &&
      String(order.renterId._id) !== String(userId) &&
      String(order.lenderId._id) !== String(userId)
    ) {
      throw new AppError('Forbidden. You do not have access to view this order', 403, 'FORBIDDEN_ORDER_ACCESS');
    }

    return order;
  }

  async getMyOrders(userId, { role = 'all', page = 1, limit = 20 } = {}) {
    const filter = {};
    if (role === 'renter') filter.renterId = userId;
    else if (role === 'lender') filter.lenderId = userId;
    else filter.$or = [{ renterId: userId }, { lenderId: userId }];

    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const [total, orders] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter)
        .populate('listingId', 'title photos category dailyRent')
        .populate('hubId', 'name city')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.min(100, Math.max(1, limit)))
    ]);

    return {
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new OrderService();

