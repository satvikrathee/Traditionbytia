import { Request, Response } from 'express';
import { Order } from '../models/Order.js';
import { verifyRazorpaySignature, verifyWebhookSignature } from '../services/paymentService.js';
import { emitOrderUpdated } from '../services/socketService.js';
import { sendOrderPlacedEmail } from '../services/emailService.js';
import { AuthRequest } from '../middleware/auth.js';

export const verifyUpiPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    if (order.paymentStatus === 'PAID') {
      res.status(200).json({ success: true, message: 'Payment already verified', order });
      return;
    }

    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      order.paymentStatus = 'FAILED';
      order.statusHistory.push({
        status: order.status,
        at: new Date(),
        note: 'UPI Payment signature verification failed',
      });
      await order.save();
      emitOrderUpdated(order);

      res.status(400).json({ success: false, message: 'Payment verification failed: invalid signature' });
      return;
    }

    order.paymentStatus = 'PAID';
    order.razorpayOrderId = razorpayOrderId;
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.statusHistory.push({
      status: order.status,
      at: new Date(),
      note: `UPI Payment verified successfully. Transaction ID: ${razorpayPaymentId}`,
    });

    await order.save();

    emitOrderUpdated(order);
    sendOrderPlacedEmail(order);

    res.status(200).json({
      success: true,
      message: 'UPI payment verified and order confirmed successfully',
      order,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Payment verification error' });
  }
};

export const handleRazorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      return;
    }

    const event = req.body.event;
    const payment = req.body.payload?.payment?.entity;

    if (event === 'payment.captured' && payment?.order_id) {
      const order = await Order.findOne({ razorpayOrderId: payment.order_id });
      if (order && order.paymentStatus !== 'PAID') {
        order.paymentStatus = 'PAID';
        order.razorpayPaymentId = payment.id;
        order.statusHistory.push({
          status: order.status,
          at: new Date(),
          note: `Payment captured via Webhook. Transaction ID: ${payment.id}`,
        });
        await order.save();

        emitOrderUpdated(order);
        sendOrderPlacedEmail(order);
        console.log(`[Webhook] Order #${order._id} confirmed via Razorpay webhook.`);
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error: any) {
    console.error('[Webhook] Error handling Razorpay webhook:', error);
    res.status(500).json({ error: 'Webhook processing error' });
  }
};

