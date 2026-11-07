/**
 * LEGAL NOTE:
 * Legal must confirm ID storage policy, retention timeline, and user consent text
 * before production deployment. Full ID numbers and unmasked document photos are NEVER stored.
 * Only ID type, masked reference (max last 4 chars), and name as printed are captured.
 */

class IdVerificationAdapter {
  async submitForReview({ userId, idType, maskedRef, nameAsPrinted, consentGiven }) {
    throw new Error('submitForReview() must be implemented');
  }
  async checkStatus({ verificationId }) {
    throw new Error('checkStatus() must be implemented');
  }
}

/**
 * Manual Admin Review Queue Adapter
 * Follows zero-budget mandate: internal admin dashboard approves/rejects IDs.
 */
class ManualAdminIdVerificationAdapter extends IdVerificationAdapter {
  constructor() {
    super();
    this.submissions = new Map();
  }

  async submitForReview({ userId, idType, maskedRef, nameAsPrinted, consentGiven }) {
    if (!consentGiven) {
      throw new Error('User consent for government ID verification is mandatory.');
    }

    const verificationId = `idv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const submission = {
      verificationId,
      userId,
      idType, // 'aadhaar' | 'voter_card' | 'ration_card'
      maskedRef, // e.g. 'XXXX9012'
      nameAsPrinted,
      consentGiven: true,
      status: 'pending_review', // 'pending_review' | 'approved' | 'rejected'
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null
    };

    this.submissions.set(verificationId, submission);
    return submission;
  }

  async checkStatus({ verificationId }) {
    return this.submissions.get(verificationId) || null;
  }

  async review({ verificationId, adminId, decision, rejectionReason }) {
    const sub = this.submissions.get(verificationId);
    if (!sub) {
      throw new Error(`Verification submission ${verificationId} not found`);
    }

    sub.status = decision === 'approved' ? 'approved' : 'rejected';
    sub.reviewedAt = new Date();
    sub.reviewedBy = adminId;
    if (decision === 'rejected') {
      sub.rejectionReason = rejectionReason || 'Information could not be verified';
    }

    this.submissions.set(verificationId, sub);
    return sub;
  }
}

/**
 * Future Paid Verifier Stub (e.g. Setu, Karza, HyperVerge)
 * Ready for "Upgrade when funded"
 */
class FuturePaidVerifierStub extends IdVerificationAdapter {
  async submitForReview(params) {
    // Automated instant verification stub
    return {
      verificationId: `auto_idv_${Date.now()}`,
      userId: params.userId,
      status: 'approved',
      provider: 'stub_automated_verifier',
      submittedAt: new Date()
    };
  }

  async checkStatus({ verificationId }) {
    return {
      verificationId,
      status: 'approved'
    };
  }
}

module.exports = {
  IdVerificationAdapter,
  ManualAdminIdVerificationAdapter,
  FuturePaidVerifierStub,
  idVerificationAdapter: new ManualAdminIdVerificationAdapter()
};

