const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requireRole } = require('../../core/middleware/roleGuard.middleware');

// User profile & capabilities
router.get('/me', authenticate, userController.getProfile);
router.patch('/me', authenticate, userController.updateProfile);
router.put('/me/capabilities', authenticate, userController.updateCapabilities);
router.get('/me/tier', authenticate, userController.getTierInfo);
router.get('/me/cart', authenticate, userController.getCartView);
router.get('/me/info', authenticate, userController.getUserInfo);

// ID Verification submission
router.post('/me/id-verification', authenticate, userController.submitIdVerification);

// Admin review endpoints
router.get('/admin/id-reviews', authenticate, requireRole('admin'), userController.getPendingIdReviews);
router.post('/admin/id-reviews/:userId', authenticate, requireRole('admin'), userController.reviewIdSubmission);
router.patch('/admin/:userId/loopwear-score', authenticate, requireRole('admin'), userController.setLoopWearScore);

module.exports = router;

