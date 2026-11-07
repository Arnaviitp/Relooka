const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'test' ? 10000 : 20, // max attempts
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test'
});

const otpRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: env.NODE_ENV === 'test' ? 10000 : 5, // 5 OTP attempts per window
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_OTP_REQUESTS',
      message: 'Too many OTP requests. Please wait a few minutes before trying again.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test'
});

module.exports = {
  authRateLimiter,
  otpRateLimiter
};
