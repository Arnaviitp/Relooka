const env = require('../config/env');

/**
 * LEGAL NOTE:
 * Legal must confirm ID storage policy, retention timeline, and user consent text
 * before production deployment. Full ID numbers and unmasked document photos are NEVER stored.
 * Only ID type, masked reference (max last 4 chars or masked standard format), and name as printed are captured.
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
 * Standalone Face Authentication Agent Adapter (D:\Agents)
 * Integrates LoopWear with the YuNet + SFace + MiniFASNetV2 Government ID & Liveness Agent.
 * Built for zero-trust biometric verification without storing raw photos or embeddings.
 */
class FaceAuthAgentAdapter extends IdVerificationAdapter {
  constructor(config = {}) {
    super();
    this.baseUrl = (config.baseUrl || env.FACE_AUTH_AGENT_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/+$/, '');
    this.apiKey = config.apiKey || env.FACE_AUTH_API_KEY || 'dev-test-api-key-1';
    this.tenantId = config.tenantId || env.FACE_AUTH_TENANT_ID || 'loopwear';
    this.timeout = config.timeout || 15000;
  }

  _getHeaders(extra = {}) {
    return {
      'X-API-Key': this.apiKey,
      'X-Tenant-ID': this.tenantId,
      'Accept': 'application/json',
      ...extra
    };
  }

  /**
   * Health ping to agent backend
   */
  async checkHealth() {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${this.baseUrl}/health`, {
        headers: this._getHeaders(),
        signal: controller.signal
      });
      clearTimeout(id);
      if (res.ok) {
        const data = await res.json();
        return { online: true, ...data };
      }
      return { online: false, status: res.status };
    } catch (err) {
      return { online: false, error: err.message };
    }
  }

  /**
   * Create verification session on the agent
   */
  async createVerificationSession({ idempotencyKey = null, policyId = null } = {}) {
    try {
      const headers = this._getHeaders({ 'Content-Type': 'application/json' });
      if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

      const res = await fetch(`${this.baseUrl}/verifications`, {
        method: 'POST',
        headers,
        body: JSON.stringify(policyId ? { policy_id: policyId } : {})
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error?.message || `Face Auth Agent error: HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      if (env.NODE_ENV !== 'production' && (err.message.includes('fetch failed') || err.message.includes('ECONNREFUSED'))) {
        console.warn(`[FaceAuthAgent] Live agent offline at ${this.baseUrl}. Using dev simulation.`);
        const verificationId = `sim_v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        return {
          verification_id: verificationId,
          status: 'CREATED',
          session_token: `tok_sim_${Date.now()}`,
          expires_at: new Date(Date.now() + 600000).toISOString(),
          simulated: true
        };
      }
      throw err;
    }
  }

  /**
   * Upload and process Government ID Document
   */
  async uploadDocument({ verificationId, imageBase64, documentType = null }) {
    try {
      const res = await fetch(`${this.baseUrl}/verifications/${verificationId}/document`, {
        method: 'POST',
        headers: this._getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          image_base64: imageBase64,
          document_type: documentType
        })
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error?.message || `Document upload failed: HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      if (verificationId.startsWith('sim_v_') || (env.NODE_ENV !== 'production' && (err.message.includes('fetch failed') || err.message.includes('ECONNREFUSED')))) {
        return {
          verification_id: verificationId,
          status: 'DOCUMENT_VALIDATED',
          document_type: documentType || 'aadhaar',
          masked_id_number: 'XXXX-XXXX-8921',
          checks: {
            document_readability: 'PASSED',
            face_quality: 'PASSED',
            liveness: 'PENDING',
            face_match: 'PENDING'
          },
          reason_code: null,
          simulated: true
        };
      }
      throw err;
    }
  }

  /**
   * Initiate live video temporal challenge
   */
  async initiateLiveSession({ verificationId }) {
    try {
      const res = await fetch(`${this.baseUrl}/verifications/${verificationId}/live-session`, {
        method: 'POST',
        headers: this._getHeaders()
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error?.message || `Live challenge init failed: HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      if (verificationId.startsWith('sim_v_') || (env.NODE_ENV !== 'production' && (err.message.includes('fetch failed') || err.message.includes('ECONNREFUSED')))) {
        const actions = ['TURN_LEFT', 'TURN_RIGHT', 'SMILE', 'BLINK'];
        const chosen = actions[Math.floor(Math.random() * actions.length)];
        return {
          verification_id: verificationId,
          challenge_action: chosen,
          challenge_nonce: `nonce_${Math.random().toString(36).substring(2, 10)}`,
          challenge_expires_at: new Date(Date.now() + 60000).toISOString(),
          simulated: true
        };
      }
      throw err;
    }
  }

  /**
   * Submit live camera video frames for Presentation Attack Detection (PAD)
   */
  async submitFrames({ verificationId, framesBase64 }) {
    try {
      const res = await fetch(`${this.baseUrl}/verifications/${verificationId}/frames`, {
        method: 'POST',
        headers: this._getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ frames_base64: framesBase64 })
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error?.message || `Frame submission failed: HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      if (verificationId.startsWith('sim_v_') || (env.NODE_ENV !== 'production' && (err.message.includes('fetch failed') || err.message.includes('ECONNREFUSED')))) {
        return {
          verification_id: verificationId,
          status: 'LIVENESS_CHECKED',
          checks: {
            document_readability: 'PASSED',
            face_quality: 'PASSED',
            liveness: 'PASSED',
            face_match: 'PENDING'
          },
          reason_code: null,
          simulated: true
        };
      }
      throw err;
    }
  }

  /**
   * Complete SFace biometric comparison and retrieve decision
   */
  async completeVerification({ verificationId }) {
    try {
      const res = await fetch(`${this.baseUrl}/verifications/${verificationId}/complete`, {
        method: 'POST',
        headers: this._getHeaders()
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error?.message || `Verification completion failed: HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      if (verificationId.startsWith('sim_v_') || (env.NODE_ENV !== 'production' && (err.message.includes('fetch failed') || err.message.includes('ECONNREFUSED')))) {
        return {
          verification_id: verificationId,
          status: 'VERIFIED',
          checks: {
            document_readability: 'PASSED',
            face_quality: 'PASSED',
            liveness: 'PASSED',
            face_match: 'PASSED'
          },
          reason_code: null,
          model_version: 'sface_v1_yunet_v1_minifasnet_v2',
          policy_version: 'pol_gov_id_v1.0',
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          simulated: true
        };
      }
      throw err;
    }
  }

  /**
   * Delete biometric artifacts (DPDPA 2023 compliance)
   */
  async deleteArtifacts({ verificationId }) {
    try {
      const res = await fetch(`${this.baseUrl}/verifications/${verificationId}/artifacts`, {
        method: 'DELETE',
        headers: this._getHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
      return { verification_id: verificationId, artifacts_deleted: 0 };
    } catch (_) {
      return { verification_id: verificationId, artifacts_deleted: 0 };
    }
  }

  /**
   * Base IdVerificationAdapter method implementation
   */
  async submitForReview({ userId, idType, maskedRef, nameAsPrinted, consentGiven }) {
    if (!consentGiven) {
      throw new Error('User consent for government ID verification is mandatory.');
    }
    const session = await this.createVerificationSession();
    return {
      verificationId: session.verification_id,
      userId,
      idType,
      maskedRef,
      nameAsPrinted,
      consentGiven: true,
      status: 'pending_review',
      submittedAt: new Date()
    };
  }

  async checkStatus({ verificationId }) {
    try {
      const res = await fetch(`${this.baseUrl}/verifications/${verificationId}`, {
        headers: this._getHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (_) {
      return null;
    }
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
      idType, // 'aadhaar' | 'voter_card' | 'ration_card' | 'passport' | 'driving_licence'
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

function createIdVerificationAdapter() {
  const driver = env.ID_VERIFICATION_DRIVER;
  if (driver === 'manual_admin') {
    return new ManualAdminIdVerificationAdapter();
  }
  if (driver === 'stub') {
    return new FuturePaidVerifierStub();
  }
  return new FaceAuthAgentAdapter();
}

module.exports = {
  IdVerificationAdapter,
  FaceAuthAgentAdapter,
  ManualAdminIdVerificationAdapter,
  FuturePaidVerifierStub,
  createIdVerificationAdapter,
  idVerificationAdapter: createIdVerificationAdapter()
};

