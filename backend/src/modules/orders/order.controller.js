const { z } = require('zod');
const orderService = require('./order.service');
const { successResponse } = require('../../core/utils/response');

const createOrderSchema = z.object({
  listingId: z.string().min(1),
  rentalDays: z.coerce.number().min(1).default(3),
  rentalStartDate: z.string().optional(),
  deliveryAddress: z.object({
    street: z.string().min(3),
    city: z.string().min(2),
    pincode: z.string().min(6)
  })
});

class OrderController {
  async createOrder(req, res, next) {
    try {
      const validated = createOrderSchema.parse(req.body);
      const result = await orderService.createOrder({
        renterId: req.user.id,
        ...validated
      });
      return successResponse(res, result, 'Order created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async confirmPayment(req, res, next) {
    try {
      const { id } = req.params;
      const { paymentId, gatewayOrderId } = req.body;
      const order = await orderService.confirmPayment({
        orderId: id,
        paymentId,
        gatewayOrderId,
        renterId: req.user.id
      });
      return successResponse(res, order, 'Payment confirmed and deposit held');
    } catch (err) {
      next(err);
    }
  }

  async handlePaymentWebhook(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature'] || req.headers['x-gateway-signature'] || req.body?.signature;
      const eventId = req.headers['x-razorpay-event-id'] || req.body?.id || `evt_${Date.now()}`;

      const { paymentAdapter } = require('../../core/adapters/payment.adapter');
      if (paymentAdapter.isEventProcessed(eventId)) {
        return successResponse(res, { idempotent: true }, 'Webhook already processed');
      }

      const isValid = paymentAdapter.verifyWebhookSignature({
        payload: req.body,
        signature
      });

      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_SIGNATURE', message: 'Webhook signature verification failed' }
        });
      }

      const orderId = req.body.orderId || req.body.payload?.payment?.entity?.notes?.orderId;
      const paymentId = req.body.paymentId || req.body.payload?.payment?.entity?.id || `pay_${Date.now()}`;
      const gatewayOrderId = req.body.gatewayOrderId || req.body.payload?.payment?.entity?.order_id;

      if (orderId) {
        await orderService.confirmPayment({
          orderId,
          paymentId,
          gatewayOrderId,
          renterId: null
        });
      }

      paymentAdapter.markEventProcessed(eventId);
      return successResponse(res, { processed: true, eventId }, 'Webhook processed successfully');
    } catch (err) {
      next(err);
    }
  }

  async lenderSubmit(req, res, next) {
    try {
      const { id } = req.params;
      const { condition, notes } = req.body;
      const order = await orderService.lenderSubmit({
        orderId: id,
        lenderId: req.user.id,
        condition,
        notes
      });
      return successResponse(res, order, 'Lender item submission recorded');
    } catch (err) {
      next(err);
    }
  }

  async qc1Inspect(req, res, next) {
    try {
      const { id } = req.params;
      const { passed, notes } = req.body;
      const order = await orderService.qc1Inspect({
        orderId: id,
        inspectorId: req.user.id,
        inspectorRole: req.user.role,
        passed,
        notes
      });
      return successResponse(res, order, 'QC1 check recorded');
    } catch (err) {
      next(err);
    }
  }

  async qc2Inspect(req, res, next) {
    try {
      const { id } = req.params;
      const { passed, notes } = req.body;
      const order = await orderService.qc2Inspect({
        orderId: id,
        staffId: req.user.id,
        passed,
        notes
      });
      return successResponse(res, order, 'QC2 check recorded');
    } catch (err) {
      next(err);
    }
  }

  async hubWashOutbound(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const order = await orderService.hubWashOutbound({
        orderId: id,
        staffId: req.user.id,
        notes
      });
      return successResponse(res, order, 'Outbound washing & sanitization recorded');
    } catch (err) {
      next(err);
    }
  }

  async dispatchToRenter(req, res, next) {
    try {
      const { id } = req.params;
      const { agentId, notes } = req.body;
      const order = await orderService.dispatchToRenter({
        orderId: id,
        actorId: req.user.id,
        actorRole: req.user.role,
        agentId,
        notes
      });
      return successResponse(res, order, 'Dispatched to renter');
    } catch (err) {
      next(err);
    }
  }

  async confirmRenterHandover(req, res, next) {
    try {
      const { id } = req.params;
      const { otpEntered, presentedBy, representativeName, idType, idMaskedRef } = req.body;
      const order = await orderService.confirmRenterHandover({
        orderId: id,
        agentId: req.user.id,
        otpEntered,
        presentedBy,
        representativeName,
        idType,
        idMaskedRef
      });
      return successResponse(res, order, 'Handover successfully verified with ID & OTP');
    } catch (err) {
      next(err);
    }
  }

  async markInUse(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.markInUse({
        orderId: id,
        renterId: req.user.id
      });
      return successResponse(res, order, 'Item is now in-use');
    } catch (err) {
      next(err);
    }
  }

  async startReturnPickup(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const order = await orderService.startReturnPickup({
        orderId: id,
        agentId: req.user.id,
        notes
      });
      return successResponse(res, order, 'Return pickup initiated');
    } catch (err) {
      next(err);
    }
  }

  async returnQCInspect(req, res, next) {
    try {
      const { id } = req.params;
      const { result, damageAmount, notes } = req.body;
      const order = await orderService.returnQCInspect({
        orderId: id,
        staffId: req.user.id,
        result,
        damageAmount,
        notes
      });
      return successResponse(res, order, 'Return QC inspection recorded');
    } catch (err) {
      next(err);
    }
  }

  async hubWashReturn(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const order = await orderService.hubWashReturn({
        orderId: id,
        staffId: req.user.id,
        notes
      });
      return successResponse(res, order, 'Return wash & sanitize completed');
    } catch (err) {
      next(err);
    }
  }

  async deliverToLender(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const order = await orderService.deliverToLender({
        orderId: id,
        agentId: req.user.id,
        notes
      });
      return successResponse(res, order, 'Delivered back to lender');
    } catch (err) {
      next(err);
    }
  }

  async closeOrder(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.closeOrder({
        orderId: id,
        actorId: req.user.id,
        actorRole: req.user.role
      });
      return successResponse(res, order, 'Order closed and deposit ledger resolved');
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id, req.user.id, req.user.role);
      return successResponse(res, order, 'Order details retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getMyOrders(req, res, next) {
    try {
      const { role, page, limit } = req.query;
      const result = await orderService.getMyOrders(req.user.id, { role, page, limit });
      return successResponse(res, result.orders, 'My orders retrieved', 200, result.pagination);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrderController();

