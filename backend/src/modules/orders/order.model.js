const mongoose = require('mongoose');

const ORDER_STATES = {
  CREATED: 'CREATED',
  CONFIRMED: 'CONFIRMED',
  LENDER_SUBMITTED: 'LENDER_SUBMITTED',
  QC1_PASSED: 'QC1_PASSED',
  QC2_PASSED: 'QC2_PASSED',
  HUB_WASHING_OUTBOUND: 'HUB_WASHING_OUTBOUND',
  OUT_FOR_DELIVERY_RENTER: 'OUT_FOR_DELIVERY_RENTER',
  DELIVERED_TO_RENTER: 'DELIVERED_TO_RENTER',
  IN_USE: 'IN_USE',
  RETURN_PICKUP: 'RETURN_PICKUP',
  RETURN_QC: 'RETURN_QC',
  HUB_WASHING_RETURN: 'HUB_WASHING_RETURN',
  DELIVERED_TO_LENDER: 'DELIVERED_TO_LENDER',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED'
};

const ALLOWED_TRANSITIONS = {
  [ORDER_STATES.CREATED]: [ORDER_STATES.CONFIRMED, ORDER_STATES.CANCELLED],
  [ORDER_STATES.CONFIRMED]: [ORDER_STATES.LENDER_SUBMITTED, ORDER_STATES.CANCELLED],
  [ORDER_STATES.LENDER_SUBMITTED]: [ORDER_STATES.QC1_PASSED, ORDER_STATES.CANCELLED],
  [ORDER_STATES.QC1_PASSED]: [ORDER_STATES.QC2_PASSED],
  [ORDER_STATES.QC2_PASSED]: [ORDER_STATES.HUB_WASHING_OUTBOUND],
  [ORDER_STATES.HUB_WASHING_OUTBOUND]: [ORDER_STATES.OUT_FOR_DELIVERY_RENTER],
  [ORDER_STATES.OUT_FOR_DELIVERY_RENTER]: [ORDER_STATES.DELIVERED_TO_RENTER],
  [ORDER_STATES.DELIVERED_TO_RENTER]: [ORDER_STATES.IN_USE],
  [ORDER_STATES.IN_USE]: [ORDER_STATES.RETURN_PICKUP],
  [ORDER_STATES.RETURN_PICKUP]: [ORDER_STATES.RETURN_QC],
  [ORDER_STATES.RETURN_QC]: [ORDER_STATES.HUB_WASHING_RETURN],
  [ORDER_STATES.HUB_WASHING_RETURN]: [ORDER_STATES.DELIVERED_TO_LENDER],
  [ORDER_STATES.DELIVERED_TO_LENDER]: [ORDER_STATES.CLOSED],
  [ORDER_STATES.CLOSED]: [],
  [ORDER_STATES.CANCELLED]: []
};

const eventLogSchema = new mongoose.Schema(
  {
    fromState: { type: String, required: true },
    toState: { type: String, required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, immutable: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { _id: true }
);

const depositDeductionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    assessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    renterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    lenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
      index: true
    },
    hubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hub',
      required: true
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATES),
      default: ORDER_STATES.CREATED,
      index: true
    },
    rentalStartDate: { type: Date, required: true },
    rentalEndDate: { type: Date, required: true },
    rentalDays: { type: Number, required: true },
    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true }
    },
    // Rule-driven pricing snapshot
    pricing: {
      dailyRate: Number,
      rentAmount: Number,
      securityDepositAmount: Number,
      laundryFee: Number,
      deliveryFee: Number,
      platformFee: Number,
      totalAmount: Number,
      lenderPayout: Number
    },
    payment: {
      gatewayOrderId: String,
      paymentId: String,
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
      },
      paidAt: Date
    },
    // Deposit Ledger: hold, release, deduct
    depositLedger: {
      holdId: String,
      holdAmount: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ['PENDING', 'HELD', 'RELEASED', 'PARTIALLY_REFUNDED', 'FORFEITED'],
        default: 'PENDING'
      },
      deductions: [depositDeductionSchema],
      releasedAmount: { type: Number, default: 0 },
      resolvedAt: Date
    },
    // Lender Submission Details
    lenderSubmission: {
      condition: { type: String, enum: ['washed', 'unwashed'] },
      notes: String,
      submittedAt: Date
    },
    // Handover check details (Renter Govt ID + OTP)
    handover: {
      otpHash: { type: String, select: false },
      devOtp: String, // available in non-prod for automated tests / UI demo
      presentedBy: { type: String, enum: ['renter', 'representative'] },
      representativeName: String,
      idType: { type: String, enum: ['aadhaar', 'voter_card', 'ration_card'] },
      idMaskedRef: String,
      verifiedAt: Date,
      agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    // Return Quality Check details
    returnQC: {
      result: { type: String, enum: ['match', 'mismatch'] },
      damageAmount: { type: Number, default: 0 },
      notes: String,
      inspectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      inspectedAt: Date
    },
    // Delivery tracking
    deliveryJobId: String,
    assignedAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Immutable Audit Trail
    eventLogs: [eventLogSchema]
  },
  {
    timestamps: true
  }
);

// Method to check valid state transition
orderSchema.methods.canTransitionTo = function (nextState) {
  const allowed = ALLOWED_TRANSITIONS[this.status] || [];
  return allowed.includes(nextState);
};

// Method to record immutable event log
orderSchema.methods.logTransition = function ({ toState, actorId, actorRole, action, metadata = {} }) {
  this.eventLogs.push({
    fromState: this.status,
    toState,
    actorId,
    actorRole,
    action,
    timestamp: new Date(),
    metadata
  });
  this.status = toState;
};

const Order = mongoose.model('Order', orderSchema);

module.exports = {
  Order,
  ORDER_STATES,
  ALLOWED_TRANSITIONS
};

