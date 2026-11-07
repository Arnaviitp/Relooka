const jwt = require('jsonwebtoken');
const User = require('../users/user.model');
const env = require('../../core/config/env');
const AppError = require('../../core/utils/AppError');
const { generateOtp, hashToken } = require('../../core/utils/crypto');
const { mailAdapter } = require('../../core/adapters/mail.adapter');
const { smsAdapter } = require('../../core/adapters/sms.adapter');
const { captchaAdapter } = require('../../core/adapters/captcha.adapter');

class AuthService {
  /**
   * Helper to sign JWT tokens
   */
  _generateTokens(user) {
    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      capabilities: user.capabilities || []
    };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN
    });

    const refreshToken = jwt.sign({ id: payload.id }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN
    });

    return { accessToken, refreshToken };
  }

  async signup({ name, email, phone, password, captchaToken, role = 'user', capabilities = ['renter'] }) {
    // 1. Verify Captcha (Bypass or Cloudflare Turnstile)
    const captchaResult = await captchaAdapter.verify(captchaToken);
    if (!captchaResult.success) {
      throw new AppError('Captcha verification failed. Please try again.', 400, 'CAPTCHA_FAILED');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone.trim();

    // 2. Check for duplicate email or phone
    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }]
    });

    if (existing) {
      if (existing.email === normalizedEmail) {
        throw new AppError('Email address already registered', 409, 'EMAIL_EXISTS');
      }
      throw new AppError('Phone number already registered', 409, 'PHONE_EXISTS');
    }

    // 3. Generate initial OTPs
    const emailOtp = generateOtp();
    const phoneOtp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 4. Create User
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password,
      role: ['delivery_agent', 'hub_staff', 'admin'].includes(role) ? role : 'user',
      capabilities: capabilities || ['renter'],
      emailOtp: {
        hash: hashToken(emailOtp),
        expiresAt: otpExpiry
      },
      phoneOtp: {
        hash: hashToken(phoneOtp),
        expiresAt: otpExpiry
      }
    });

    await user.save();

    // 5. Send OTPs via Adapters (Real email, Console stub SMS)
    await mailAdapter.sendMail({
      to: normalizedEmail,
      subject: 'Verify your LoopWear Account',
      text: `Welcome to LoopWear! Your email verification code is: ${emailOtp}. Valid for 10 minutes.`,
      html: `<h2>Welcome to LoopWear</h2><p>Your email verification code is: <strong>${emailOtp}</strong></p><p>Valid for 10 minutes.</p>`
    });

    await smsAdapter.sendSms({
      to: normalizedPhone,
      message: `LoopWear OTP: ${phoneOtp}. Valid for 10 minutes.`
    });

    const tokens = this._generateTokens(user);
    user.refreshTokenHash = hashToken(tokens.refreshToken);
    await user.save();

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        capabilities: user.capabilities,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified
      },
      tokens,
      // For dev / test convenience when dev bypass is active
      ...(env.NODE_ENV !== 'production' ? { devOtps: { emailOtp, phoneOtp } } : {})
    };
  }

  async verifyEmailOtp({ email, otp }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+emailOtp.hash +emailOtp.expiresAt');

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.emailVerified) {
      return { success: true, message: 'Email is already verified', user };
    }

    if (!user.emailOtp || !user.emailOtp.hash) {
      throw new AppError('No pending email OTP request found', 400, 'NO_OTP_FOUND');
    }

    if (new Date() > new Date(user.emailOtp.expiresAt)) {
      throw new AppError('Email OTP has expired. Please request a new code.', 400, 'OTP_EXPIRED');
    }

    if (hashToken(otp) !== user.emailOtp.hash) {
      throw new AppError('Invalid email verification OTP', 400, 'INVALID_OTP');
    }

    user.emailVerified = true;
    user.emailOtp = undefined;
    await user.save();

    return { success: true, message: 'Email verified successfully', user };
  }

  async verifyPhoneOtp({ phone, otp }) {
    const normalizedPhone = phone.trim();
    const user = await User.findOne({ phone: normalizedPhone }).select('+phoneOtp.hash +phoneOtp.expiresAt');

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.phoneVerified) {
      return { success: true, message: 'Phone is already verified', user };
    }

    if (!user.phoneOtp || !user.phoneOtp.hash) {
      throw new AppError('No pending phone OTP request found', 400, 'NO_OTP_FOUND');
    }

    if (new Date() > new Date(user.phoneOtp.expiresAt)) {
      throw new AppError('Phone OTP has expired. Please request a new code.', 400, 'OTP_EXPIRED');
    }

    if (hashToken(otp) !== user.phoneOtp.hash) {
      throw new AppError('Invalid phone verification OTP', 400, 'INVALID_OTP');
    }

    user.phoneVerified = true;
    user.phoneOtp = undefined;
    await user.save();

    return { success: true, message: 'Phone verified successfully', user };
  }

  async resendOtp({ type, identifier }) {
    const isEmail = type === 'email';
    const filter = isEmail ? { email: identifier.toLowerCase().trim() } : { phone: identifier.trim() };
    const user = await User.findOne(filter).select('+emailOtp.hash +phoneOtp.hash');

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const newOtp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if (isEmail) {
      user.emailOtp = { hash: hashToken(newOtp), expiresAt };
      await user.save();
      await mailAdapter.sendMail({
        to: user.email,
        subject: 'LoopWear Verification Code',
        text: `Your new email verification OTP is: ${newOtp}`
      });
    } else {
      user.phoneOtp = { hash: hashToken(newOtp), expiresAt };
      await user.save();
      await smsAdapter.sendSms({
        to: user.phone,
        message: `Your new LoopWear OTP is: ${newOtp}`
      });
    }

    return {
      success: true,
      message: `OTP sent to ${type}`,
      ...(env.NODE_ENV !== 'production' ? { devOtp: newOtp } : {})
    };
  }

  async login({ emailOrPhone, password }) {
    const input = emailOrPhone.trim();
    const isEmail = input.includes('@');
    const filter = isEmail ? { email: input.toLowerCase() } : { phone: input };

    const user = await User.findOne(filter).select('+password +refreshTokenHash');
    if (!user) {
      throw new AppError('Invalid credentials. Check email/phone and password.', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid credentials. Check email/phone and password.', 401, 'INVALID_CREDENTIALS');
    }

    const tokens = this._generateTokens(user);
    user.refreshTokenHash = hashToken(tokens.refreshToken);
    await user.save();

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        capabilities: user.capabilities,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        tier: user.tier
      },
      tokens
    };
  }

  async refreshToken({ refreshToken }) {
    if (!refreshToken) {
      throw new AppError('Refresh token required', 400, 'MISSING_REFRESH_TOKEN');
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    const user = await User.findById(decoded.id).select('+refreshTokenHash');
    if (!user || !user.refreshTokenHash) {
      throw new AppError('User session not found', 401, 'SESSION_EXPIRED');
    }

    if (hashToken(refreshToken) !== user.refreshTokenHash) {
      // Possible token reuse attack; invalidate stored token
      user.refreshTokenHash = undefined;
      await user.save();
      throw new AppError('Invalid refresh token. Please log in again.', 401, 'TOKEN_REUSE_DETECTED');
    }

    // Rotate tokens
    const tokens = this._generateTokens(user);
    user.refreshTokenHash = hashToken(tokens.refreshToken);
    await user.save();

    return tokens;
  }

  async logout(userId) {
    if (!userId) return;
    await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
    return { success: true };
  }
}

module.exports = new AuthService();

