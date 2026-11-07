const { z } = require('zod');
const authService = require('./auth.service');
const { successResponse } = require('../../core/utils/response');

const signupSchema = z.object({
  name: z.string().min(2, 'Name must have at least 2 characters'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number with at least 10 digits required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  captchaToken: z.string().optional(),
  role: z.enum(['user', 'delivery_agent', 'hub_staff', 'admin']).optional(),
  capabilities: z.array(z.enum(['renter', 'lender'])).optional()
});

const loginSchema = z.object({
  emailOrPhone: z.string().min(3, 'Email or phone required'),
  password: z.string().min(1, 'Password required')
});

const verifyOtpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
  email: z.string().email().optional(),
  phone: z.string().optional()
});

class AuthController {
  async signup(req, res, next) {
    try {
      const validated = signupSchema.parse(req.body);
      const result = await authService.signup(validated);
      return successResponse(res, result, 'Registration successful. OTPs sent to email and phone.', 201);
    } catch (err) {
      next(err);
    }
  }

  async verifyEmailOtp(req, res, next) {
    try {
      const { email, otp } = req.body;
      const result = await authService.verifyEmailOtp({ email, otp });
      return successResponse(res, result, 'Email verified successfully');
    } catch (err) {
      next(err);
    }
  }

  async verifyPhoneOtp(req, res, next) {
    try {
      const { phone, otp } = req.body;
      const result = await authService.verifyPhoneOtp({ phone, otp });
      return successResponse(res, result, 'Phone verified successfully');
    } catch (err) {
      next(err);
    }
  }

  async resendOtp(req, res, next) {
    try {
      const { type, identifier } = req.body; // type: 'email' | 'phone'
      const result = await authService.resendOtp({ type, identifier });
      return successResponse(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await authService.login(validated);
      return successResponse(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken({ refreshToken });
      return successResponse(res, tokens, 'Tokens refreshed successfully');
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logout(req.user ? req.user.id : null);
      return successResponse(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();

