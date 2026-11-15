import crypto from 'crypto';
import Razorpay from 'razorpay';
import { ENV } from '../config/env.js';

let razorpayInstance: Razorpay | null = null;

export const initRazorpay = () => {
  if (ENV.RAZORPAY_KEY_ID && ENV.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
      key_id: ENV.RAZORPAY_KEY_ID,
      key_secret: ENV.RAZORPAY_KEY_SECRET,
    });
    console.log('[Payments] Razorpay initialized with Key ID:', ENV.RAZORPAY_KEY_ID);
  } else {
    console.log('[Payments] Razorpay credentials not provided. Sandbox simulation mode enabled.');
  }
};

export interface CreatePaymentOrderParams {
  receipt: string;
  amountInINR: number;
  notes?: Record<string, string>;
}

export interface PaymentOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  isSimulated?: boolean;
}

export const createRazorpayOrder = async (
  params: CreatePaymentOrderParams
): Promise<PaymentOrderResult> => {
  const amountInPaise = Math.round(params.amountInINR * 100);

  if (razorpayInstance) {
    const order = await razorpayInstance.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: params.receipt,
      notes: params.notes || {},
      payment_capture: true,
    });

    return {
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: ENV.RAZORPAY_KEY_ID,
      isSimulated: false,
    };
  }

  // Simulated Razorpay Order for testing without live API keys
  const simulatedOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return {
    orderId: simulatedOrderId,
    amount: amountInPaise,
    currency: 'INR',
    keyId: 'rzp_test_simulation',
    isSimulated: true,
  };
};

export const verifyRazorpaySignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
): boolean => {
  // If in simulation mode
  if (razorpayOrderId.startsWith('order_sim_') || !ENV.RAZORPAY_KEY_SECRET) {
    return true;
  }

  try {
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', ENV.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('[Payments] Signature verification error:', error);
    return false;
  }
};

export const verifyWebhookSignature = (
  rawBody: string,
  signatureHeader: string
): boolean => {
  if (!ENV.RAZORPAY_WEBHOOK_SECRET) return true;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', ENV.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    return expectedSignature === signatureHeader;
  } catch (err) {
    console.error('[Payments] Webhook signature verification error:', err);
    return false;
  }
};

