const express = require('express');
const router = express.Router();
const tierController = require('./tier.controller');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requireRole, requireCronSecretOrAdmin } = require('../../core/middleware/roleGuard.middleware');

// Nightly cron trigger endpoint (Protected by CRON_SECRET or Admin auth)
router.post('/nightly-recompute', requireCronSecretOrAdmin, tierController.triggerNightlyRecompute);

// Admin manual recomputation trigger
router.post('/recompute/:userId', authenticate, requireRole('admin'), tierController.recomputeUserTier);

module.exports = router;
