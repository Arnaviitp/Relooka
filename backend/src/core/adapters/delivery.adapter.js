class DeliveryProvider {
  async createJob({ orderId, pickupAddress, dropoffAddress, type }) {
    throw new Error('createJob() must be implemented');
  }
  async assignAgent({ deliveryId, agentId, agentName }) {
    throw new Error('assignAgent() must be implemented');
  }
  async track({ deliveryId }) {
    throw new Error('track() must be implemented');
  }
  async confirmHandover({ deliveryId, presentedBy, idType, idMaskedRef, otpEntered }) {
    throw new Error('confirmHandover() must be implemented');
  }
}

/**
 * LoopWear In-House Local Delivery Provider Stub
 * Implements createJob, assignAgent, track, and confirmHandover
 * Zero vendor dependencies required.
 */
class MockDeliveryProvider extends DeliveryProvider {
  constructor() {
    super();
    this.jobs = new Map();
  }

  async createJob({ orderId, pickupAddress, dropoffAddress, type = 'lender_to_hub' }) {
    const deliveryId = `del_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const job = {
      deliveryId,
      orderId,
      type, // 'lender_to_hub', 'hub_to_renter', 'renter_to_hub', 'hub_to_lender'
      pickupAddress,
      dropoffAddress,
      status: 'pending_assignment',
      agentId: null,
      agentName: null,
      trackingHistory: [
        { status: 'created', timestamp: new Date(), notes: 'Delivery job dispatched' }
      ],
      handoverDetails: null
    };
    this.jobs.set(deliveryId, job);
    return job;
  }

  async assignAgent({ deliveryId, agentId, agentName }) {
    const job = this.jobs.get(deliveryId);
    if (!job) {
      throw new Error(`Delivery job ${deliveryId} not found`);
    }
    job.agentId = agentId;
    job.agentName = agentName;
    job.status = 'assigned';
    job.trackingHistory.push({
      status: 'assigned',
      timestamp: new Date(),
      notes: `Assigned to delivery agent ${agentName}`
    });
    this.jobs.set(deliveryId, job);
    return job;
  }

  async track({ deliveryId }) {
    const job = this.jobs.get(deliveryId);
    if (!job) {
      throw new Error(`Delivery job ${deliveryId} not found`);
    }
    return job;
  }

  async confirmHandover({ deliveryId, presentedBy, idType, idMaskedRef, otpEntered, expectedOtp }) {
    const job = this.jobs.get(deliveryId);
    if (!job) {
      throw new Error(`Delivery job ${deliveryId} not found`);
    }

    if (!otpEntered || String(otpEntered).trim() !== String(expectedOtp).trim()) {
      return {
        success: false,
        reason: 'INVALID_HANDOVER_OTP',
        message: 'The handover OTP provided does not match the registered recipient code.'
      };
    }

    job.status = 'delivered';
    job.handoverDetails = {
      completedAt: new Date(),
      presentedBy, // 'renter' | 'representative'
      idType,      // 'ration_card' | 'aadhaar' | 'voter_card'
      idMaskedRef, // last 4 chars
      otpVerified: true
    };
    job.trackingHistory.push({
      status: 'delivered',
      timestamp: new Date(),
      notes: `Handover confirmed. ID verified (${idType} ${idMaskedRef}) presented by ${presentedBy}`
    });

    this.jobs.set(deliveryId, job);
    return {
      success: true,
      job
    };
  }
}

module.exports = {
  DeliveryProvider,
  MockDeliveryProvider,
  deliveryProvider: new MockDeliveryProvider()
};

