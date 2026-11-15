import { Router } from 'express';
import { z } from 'zod';
import {
  register,
  login,
  googleAuth,
  logout,
  getMe,
  updateProfile,
  addAddress,
  deleteAddress,
  forgotPassword,
  resetPassword,
  sendSignupOtp,
  verifySignupOtp,
  sendLoginOtp,
  verifyLoginOtp,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

router.post('/register', authLimiter, validateRequest(registerSchema), register);
router.post('/login', authLimiter, validateRequest(loginSchema), login);
router.post('/google', googleAuth);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.post('/address', authenticate, addAddress);
router.delete('/address/:addressId', authenticate, deleteAddress);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// 4-Digit OTP Authentication
router.post('/send-signup-otp', authLimiter, sendSignupOtp);
router.post('/verify-signup-otp', authLimiter, verifySignupOtp);
router.post('/send-login-otp', authLimiter, sendLoginOtp);
router.post('/verify-login-otp', authLimiter, verifyLoginOtp);

export default router;

