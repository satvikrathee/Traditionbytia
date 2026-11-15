import { Router } from 'express';
import multer from 'multer';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  markCodAsPaid,
  verifyUpiPayment,
  uploadPaymentScreenshot,
} from '../controllers/orderController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP) are allowed'));
    }
  },
});

// Customer routes
router.post('/', authenticate, createOrder);
router.post('/upload-screenshot', authenticate, upload.single('screenshot'), uploadPaymentScreenshot);
router.get('/my-orders', authenticate, getMyOrders);
router.get('/:id', authenticate, getOrderById);

// Admin routes
router.get('/admin/all', authenticate, requireAdmin, getAllOrders);
router.patch('/admin/:id/status', authenticate, requireAdmin, updateOrderStatus);
router.patch('/admin/:id/mark-cod-paid', authenticate, requireAdmin, markCodAsPaid);
router.patch('/admin/:id/verify-upi', authenticate, requireAdmin, verifyUpiPayment);

export default router;

