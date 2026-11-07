const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requireRole, requireCapability } = require('../../core/middleware/roleGuard.middleware');

router.use(authenticate);

// Order creation & list
router.post('/', requireCapability('renter'), orderController.createOrder);
router.get('/me', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);

// State Machine Steps
router.post('/:id/confirm-payment', orderController.confirmPayment);
router.post('/:id/lender-submit', requireCapability('lender'), orderController.lenderSubmit);
router.post('/:id/qc1', requireRole('admin', 'hub_staff', 'delivery_agent'), orderController.qc1Inspect);
router.post('/:id/qc2', requireRole('admin', 'hub_staff'), orderController.qc2Inspect);
router.post('/:id/hub-wash-outbound', requireRole('admin', 'hub_staff'), orderController.hubWashOutbound);
router.post('/:id/dispatch-renter', requireRole('admin', 'hub_staff'), orderController.dispatchToRenter);
router.post('/:id/handover', requireRole('admin', 'delivery_agent'), orderController.confirmRenterHandover);
router.post('/:id/mark-in-use', requireCapability('renter'), orderController.markInUse);
router.post('/:id/return-pickup', requireRole('admin', 'delivery_agent'), orderController.startReturnPickup);
router.post('/:id/return-qc', requireRole('admin', 'hub_staff'), orderController.returnQCInspect);
router.post('/:id/hub-wash-return', requireRole('admin', 'hub_staff'), orderController.hubWashReturn);
router.post('/:id/deliver-lender', requireRole('admin', 'delivery_agent'), orderController.deliverToLender);
router.post('/:id/close', requireRole('admin', 'hub_staff'), orderController.closeOrder);

module.exports = router;

