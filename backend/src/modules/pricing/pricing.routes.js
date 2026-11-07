const express = require('express');
const router = express.Router();
const pricingController = require('./pricing.controller');
const { optionalAuthenticate } = require('../../core/middleware/auth.middleware');

router.post('/quote', optionalAuthenticate, pricingController.calculateQuote);
router.get('/config', pricingController.getConfig);

module.exports = router;

