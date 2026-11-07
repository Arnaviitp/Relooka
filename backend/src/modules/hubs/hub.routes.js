const express = require('express');
const router = express.Router();
const hubController = require('./hub.controller');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requireRole } = require('../../core/middleware/roleGuard.middleware');

router.get('/', hubController.getAllHubs);
router.get('/:id', hubController.getHubById);
router.post('/', authenticate, requireRole('admin'), hubController.createHub);

module.exports = router;

