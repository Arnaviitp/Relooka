const crypto = require('crypto');
const env = require('../config/env');

class PaymentAdapter {
  async createPaymentIntent({ orderId, amount, currency = 'INR', customer }) {
    throw new Error('createPaymentIntent() must be implemented');
  }
  async verifyPayment({ paymentId, gatewayOrderId, signature }) {
    throw new Error('verifyPayment() must be implemented');
  }
  async refundPayment({ paymentId, amount, reason }) {
    throw new Error('refundPayment() must be implemented');
  }
  async holdDeposit({ orderId, amount, currency = 'INR', customer }) {
    throw new Error('holdDeposit() must be implemented');
  }
  async releaseDeposit({ holdId, amount }) {
    throw new Error('releaseDeposit() must be implemented');
  }
  async deductDeposit({ holdId, amount, deductionAmount, reason }) {
    throw new Error('deductDeposit() must be implemented');
  }
}

/**
 * Built-in MockGateway: Works locally & hosted with ZERO accounts, cards, or API keys.
 * Perfect for zero-budget development, tests, and CI/CD.
 */
class MockPaymentGateway extends PaymentAdapter {
  constructor() {
    super();
    this.holds = new Map();
    this.payments = new Map();
  }

  async createPaymentIntent({ orderId, amount, currency = 'INR', customer }) {
    const gatewayOrderId = `mock_order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const intent = {
      gatewayOrderId,
      amount,
      currency,
      status: 'created',
      clientSecret: `mock_secret_${gatewayOrderId}`
    };
    this.payments.set(gatewayOrderId, intent);
    return intent;
  }

  async verifyPayment({ paymentId, gatewayOrderId, signature }) {
    // In mock mode, any signature or mock prefix passes
    return {
      success: true,
      paymentId: paymentId || `mock_pay_${Date.now()}`,
      gatewayOrderId,
      status: 'captured'
    };
  }

  async refundPayment({ paymentId, amount, reason }) {
    return {
      success: true,
      refundId: `mock_ref_${Date.now()}`,
      paymentId,
      amount,
      reason,
      status: 'refunded'
    };
  }

  async holdDeposit({ orderId, amount, currency = 'INR', customer }) {
    const holdId = `mock_hold_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const hold = {
      holdId,
      orderId,
      amount,
      currency,
      heldAt: new Date(),
      status: 'HELD',
      deductions: [],
      releasedAmount: 0
    };
    this.holds.set(holdId, hold);
    return hold;
  }

  async releaseDeposit({ holdId, amount }) {
    const hold = this.holds.get(holdId) || { holdId, amount, status: 'HELD' };
    hold.status = 'RELEASED';
    hold.releasedAmount = amount;
    hold.releasedAt = new Date();
    this.holds.set(holdId, hold);
    return {
      success: true,
      holdId,
      status: 'RELEASED',
      releasedAmount: amount
    };
  }

  async deductDeposit({ holdId, amount, deductionAmount, reason }) {
    const hold = this.holds.get(holdId) || { holdId, amount, status: 'HELD', deductions: [] };
    const refundAmount = Math.max(0, amount - deductionAmount);
    hold.status = refundAmount > 0 ? 'PARTIALLY_REFUNDED' : 'FORFEITED';
    hold.deductions.push({ deductionAmount, reason, at: new Date() });
    hold.releasedAmount = refundAmount;
    this.holds.set(holdId, hold);
    return {
      success: true,
      holdId,
      status: hold.status,
      deductedAmount: deductionAmount,
      releasedAmount: refundAmount,
      reason
    };
  }
}

/**
 * Razorpay TEST MODE Adapter
 * Safe for test mode only. If keys are missing, gracefully falls back to MockPaymentGateway.
 */
class RazorpayTestAdapter extends PaymentAdapter {
  constructor() {
    super();
    this.mockFallback = new MockPaymentGateway();
    this.keyId = env.RAZORPAY_KEY_ID;
    this.keySecret = env.RAZORPAY_KEY_SECRET;
  }

  async createPaymentIntent(params) {
    if (!this.keyId || !this.keySecret) {
      return this.mockFallback.createPaymentIntent(params);
    }
    // Simple Razorpay Orders API call via fetch
    try {
      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: Math.round(params.amount * 100), // in paise
          currency: params.currency || 'INR',
          receipt: String(params.orderId)
        })
      });
      const data = await response.json();
      return {
        gatewayOrderId: data.id,
        amount: params.amount,
        currency: params.currency || 'INR',
        status: data.status,
        key: this.keyId
      };
    } catch (err) {
      console.error('[Razorpay Order Error]', err.message);
      return this.mockFallback.createPaymentIntent(params);
    }
  }

  async verifyPayment(params) {
    if (!this.keySecret) {
      return this.mockFallback.verifyPayment(params);
    }
    const { paymentId, gatewayOrderId, signature } = params;
    const expected = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${gatewayOrderId}|${paymentId}`)
      .digest('hex');
    const valid = expected === signature;
    return {
      success: valid,
      paymentId,
      gatewayOrderId,
      status: valid ? 'captured' : 'failed'
    };
  }

  async refundPayment(params) {
    return this.mockFallback.refundPayment(params);
  }

  async holdDeposit(params) {
    return this.mockFallback.holdDeposit(params);
  }

  async releaseDeposit(params) {
    return this.mockFallback.releaseDeposit(params);
  }

  async deductDeposit(params) {
    return this.mockFallback.deductDeposit(params);
  }
}

function createPaymentAdapter() {
  if (env.PAYMENT_GATEWAY === 'razorpay_test' && env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
    return new RazorpayTestAdapter();
  }
  return new MockPaymentGateway();
}

module.exports = {
  PaymentAdapter,
  MockPaymentGateway,
  RazorpayTestAdapter,
  paymentAdapter: createPaymentAdapter()
};

