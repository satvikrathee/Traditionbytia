import { Router } from 'express';
import multer from 'multer';
import {
  getUpiSettings,
  updateUpiSettings,
  uploadQrCodeImage,
} from '../controllers/settingsController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPG, WEBP) are allowed'));
    }
  },
});

// Public / Customer endpoint
router.get('/upi', getUpiSettings);

// Protected Admin endpoints
router.put('/upi', authenticate, requireAdmin, updateUpiSettings);
router.post('/upi/upload-qr', authenticate, requireAdmin, upload.single('qrCode'), uploadQrCodeImage);

export default router;
