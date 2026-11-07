const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authRateLimiter, otpRateLimiter } = require('../../core/middleware/rateLimiter.middleware');
const { authenticate } = require('../../core/middleware/auth.middleware');

// Public routes with rate limiting
router.post('/signup', authRateLimiter, authController.signup);
router.post('/login', authRateLimiter, authController.login);
router.post('/verify-email-otp', otpRateLimiter, authController.verifyEmailOtp);
router.post('/verify-phone-otp', otpRateLimiter, authController.verifyPhoneOtp);
router.post('/resend-otp', otpRateLimiter, authController.resendOtp);
router.post('/refresh-token', authController.refreshToken);

// Protected
router.post('/logout', authenticate, authController.logout);

module.exports = router;

