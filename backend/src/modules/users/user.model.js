const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { encrypt, decrypt, maskId } = require('../../core/utils/crypto');

/**
 * LEGAL COMPLIANCE NOTE:
 * LoopWear Zero-Budget Compliance & Indian IT Act / Aadhaar Act Guidelines:
 * Legal counsel must confirm ID storage policy, consent language, and data retention
 * schedules prior to production release.
 * Full Aadhaar / voter / ration card numbers and document images are STRICTLY FORBIDDEN
 * from storage or logging anywhere in the system.
 * Only ID type, masked reference (max 4 characters), and name as printed are captured.
 * Sensitive fields are encrypted at rest with AES-256-GCM.
 */

const idVerificationSchema = new mongoose.Schema(
  {
    idType: {
      type: String,
      enum: ['aadhaar', 'voter_card', 'ration_card', 'passport', 'driving_licence'],
      default: null
    },
    // Only the last 4 characters masked, e.g. "XXXX9012" or "XXXX-XXXX-1234"
    maskedRef: {
      type: String,
      maxlength: 30,
      default: null
    },
    // Encrypted at rest using AES-256-GCM
    encryptedNameAsPrinted: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['not_submitted', 'pending_review', 'verified', 'rejected', 'manual_review'],
      default: 'not_submitted',
      index: true
    },
    consentGiven: {
      type: Boolean,
      default: false
    },
    consentTimestamp: {
      type: Date,
      default: null
    },
    submittedAt: {
      type: Date,
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    },
    // Biometric Agent verification details (D:\Agents)
    agentVerificationId: {
      type: String,
      default: null
    },
    agentVerdict: {
      type: String,
      default: null
    },
    checksSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    reasonCode: {
      type: String,
      default: null
    },
    provider: {
      type: String,
      default: 'face_auth_agent'
    }
  },
  { _id: false }
);

const tierHistorySchema = new mongoose.Schema(
  {
    tier: {
      type: String,
      enum: ['Silver', 'Gold', 'Platinum', 'Diamond'],
      required: true
    },
    score: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      default: 'order_closed'
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    phoneVerified: {
      type: Boolean,
      default: false
    },
    password: {
      type: String,
      required: true,
      select: false // never returned in queries by default
    },
    // Restricted account roles
    role: {
      type: String,
      enum: ['user', 'delivery_agent', 'hub_staff', 'admin'],
      default: 'user',
      index: true
    },
    // User capability set: non-exclusive (user can be both lender and renter)
    capabilities: {
      type: [String],
      enum: ['renter', 'lender'],
      default: ['renter']
    },
    // Assigned laundry hub ID (for hub staff)
    assignedHubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hub',
      default: null
    },
    // ID Verification
    idVerification: {
      type: idVerificationSchema,
      default: () => ({})
    },
    // Tier System
    tier: {
      type: String,
      enum: ['Silver', 'Gold', 'Platinum', 'Diamond'],
      default: 'Silver',
      index: true
    },
    tierScore: {
      type: Number,
      default: 0
    },
    // Executive-entered score (1-5 scale)
    loopWearScore: {
      type: Number,
      default: 3.0,
      min: 1.0,
      max: 5.0
    },
    // Rolling feedback average contributing to tier
    feedbackScoreAverage: {
      type: Number,
      default: 5.0
    },
    feedbackCount: {
      type: Number,
      default: 0
    },
    tierHistory: [tierHistorySchema],
    // OTP storage for verification
    emailOtp: {
      hash: { type: String, select: false },
      expiresAt: { type: Date, select: false }
    },
    phoneOtp: {
      hash: { type: String, select: false },
      expiresAt: { type: Date, select: false }
    },
    refreshTokenHash: {
      type: String,
      select: false
    },
    fcmToken: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.refreshTokenHash;
        delete ret.emailOtp;
        delete ret.phoneOtp;
        delete ret.__v;
        // Decrypt nameAsPrinted virtually if present
        if (ret.idVerification && ret.idVerification.encryptedNameAsPrinted) {
          try {
            ret.idVerification.nameAsPrinted = decrypt(ret.idVerification.encryptedNameAsPrinted);
          } catch (_) {
            ret.idVerification.nameAsPrinted = null;
          }
          delete ret.idVerification.encryptedNameAsPrinted;
        }
        return ret;
      }
    }
  }
);

// Password hashing pre-save hook
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to set encrypted printed name
userSchema.methods.setIdVerificationDetails = function ({ idType, rawIdNumber, nameAsPrinted, consentGiven }) {
  this.idVerification.idType = idType;
  this.idVerification.maskedRef = maskId(rawIdNumber);
  this.idVerification.encryptedNameAsPrinted = encrypt(nameAsPrinted);
  this.idVerification.consentGiven = !!consentGiven;
  this.idVerification.consentTimestamp = new Date();
  this.idVerification.submittedAt = new Date();
  this.idVerification.status = 'pending_review';
};

// Method to set Face Authentication Agent results (D:\Agents)
userSchema.methods.setAgentVerificationResult = function ({
  idType,
  maskedRef,
  nameAsPrinted,
  verificationId,
  verdict,
  checksSummary,
  reasonCode
}) {
  if (idType) this.idVerification.idType = idType;
  if (maskedRef) this.idVerification.maskedRef = maskedRef;
  if (nameAsPrinted) this.idVerification.encryptedNameAsPrinted = encrypt(nameAsPrinted);
  this.idVerification.agentVerificationId = verificationId;
  this.idVerification.agentVerdict = verdict;
  this.idVerification.checksSummary = checksSummary;
  this.idVerification.reasonCode = reasonCode;
  this.idVerification.consentGiven = true;
  if (!this.idVerification.consentTimestamp) this.idVerification.consentTimestamp = new Date();
  this.idVerification.submittedAt = new Date();
  this.idVerification.provider = 'face_auth_agent';

  if (verdict === 'VERIFIED') {
    this.idVerification.status = 'verified';
    this.idVerification.verifiedAt = new Date();
    this.idVerification.rejectionReason = null;
  } else if (verdict === 'MANUAL_REVIEW') {
    this.idVerification.status = 'pending_review';
    this.idVerification.rejectionReason = reasonCode ? `Flagged for manual review: ${reasonCode}` : 'Requires manual review';
  } else if (verdict === 'REJECTED') {
    this.idVerification.status = 'rejected';
    this.idVerification.rejectionReason = reasonCode || 'Biometric verification rejected';
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;

