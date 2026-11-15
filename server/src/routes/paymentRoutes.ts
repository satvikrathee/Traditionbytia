import { Router } from 'express';
import { verifyUpiPayment, handleRazorpayWebhook } from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/upi/verify', authenticate, verifyUpiPayment);
router.post('/webhook', handleRazorpayWebhook);

export default router;

