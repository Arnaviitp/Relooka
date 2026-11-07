const express = require('express');
const router = express.Router();
const feedbackController = require('./feedback.controller');
const { authenticate } = require('../../core/middleware/auth.middleware');

router.use(authenticate);

router.post('/orders/:orderId', feedbackController.submitFeedback);
router.get('/orders/:orderId', feedbackController.getOrderFeedbacks);

module.exports = router;
