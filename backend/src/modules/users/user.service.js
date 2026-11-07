const User = require('./user.model');
const AppError = require('../../core/utils/AppError');
const tierConfig = require('../../core/config/tiers.config');

class UserService {
  async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    return user;
  }

  async updateProfile(userId, { name, fcmToken }) {
    const updates = {};
    if (name) updates.name = name.trim();
    if (fcmToken !== undefined) updates.fcmToken = fcmToken;

    const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true });
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    return user;
  }

  async updateCapabilities(userId, capabilities) {
    if (!Array.isArray(capabilities) || capabilities.length === 0) {
      throw new AppError('Capabilities must be a non-empty array with "renter" and/or "lender"', 400, 'INVALID_CAPABILITIES');
    }

    const validCaps = ['renter', 'lender'];
    const invalid = capabilities.some(c => !validCaps.includes(c));
    if (invalid) {
      throw new AppError('Capabilities can only include "renter" or "lender"', 400, 'INVALID_CAPABILITIES');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { capabilities: Array.from(new Set(capabilities)) } },
      { new: true }
    );
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    return user;
  }

  async submitIdVerification(userId, { idType, idNumber, nameAsPrinted, consentGiven }) {
    if (!consentGiven) {
      throw new AppError(
        'Consent for Indian government ID verification is mandatory according to regulatory compliance.',
        400,
        'CONSENT_REQUIRED'
      );
    }

    if (!['aadhaar', 'voter_card', 'ration_card'].includes(idType)) {
      throw new AppError('Invalid ID type. Allowed: aadhaar, voter_card, ration_card', 400, 'INVALID_ID_TYPE');
    }

    if (!idNumber || String(idNumber).trim().length < 4) {
      throw new AppError('ID reference must have at least 4 characters to extract masked reference', 400, 'INVALID_ID_NUMBER');
    }

    if (!nameAsPrinted || String(nameAsPrinted).trim().length === 0) {
      throw new AppError('Name as printed on ID is required', 400, 'MISSING_NAME_ON_ID');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    user.setIdVerificationDetails({
      idType,
      rawIdNumber: idNumber,
      nameAsPrinted,
      consentGiven
    });

    await user.save();
    return user;
  }

  async getPendingIdReviews({ page = 1, limit = 20 } = {}) {
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const filter = { 'idVerification.status': 'pending_review' };

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('name email phone role idVerification createdAt')
        .sort({ 'idVerification.submittedAt': 1 })
        .skip(skip)
        .limit(Math.min(100, Math.max(1, limit)))
    ]);

    return {
      reviews: users.map(u => ({
        userId: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        idType: u.idVerification.idType,
        maskedRef: u.idVerification.maskedRef,
        nameAsPrinted: u.idVerification.nameAsPrinted,
        status: u.idVerification.status,
        submittedAt: u.idVerification.submittedAt
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async reviewIdSubmission(userId, adminId, { decision, rejectionReason }) {
    if (!['approved', 'rejected'].includes(decision)) {
      throw new AppError('Decision must be "approved" or "rejected"', 400, 'INVALID_DECISION');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.idVerification.status !== 'pending_review') {
      throw new AppError(`Cannot review submission with current status: ${user.idVerification.status}`, 400, 'INVALID_STATE');
    }

    user.idVerification.status = decision === 'approved' ? 'verified' : 'rejected';
    user.idVerification.reviewedBy = adminId;
    user.idVerification.verifiedAt = decision === 'approved' ? new Date() : null;
    user.idVerification.rejectionReason = decision === 'rejected' ? (rejectionReason || 'Details could not be verified') : null;

    await user.save();
    return user;
  }

  async setLoopWearScore(userId, score, adminId) {
    const numScore = Number(score);
    if (isNaN(numScore) || numScore < 1.0 || numScore > 5.0) {
      throw new AppError('LoopWear score must be a number between 1.0 and 5.0', 400, 'INVALID_SCORE');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    user.loopWearScore = Math.round(numScore * 100) / 100;
    await user.save();
    return user;
  }

  async getTierInfo(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const benefits = tierConfig.tierBenefits[user.tier] || tierConfig.tierBenefits.Silver;
    return {
      tier: user.tier,
      tierScore: user.tierScore,
      loopWearScore: user.loopWearScore,
      feedbackScoreAverage: user.feedbackScoreAverage,
      feedbackCount: user.feedbackCount,
      benefits,
      history: user.tierHistory
    };
  }
}

module.exports = new UserService();

