import express from 'express';
import {
  createReview,
  getProductReviews,
  getRecentReviews,
} from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/recent', getRecentReviews);
router.get('/product/:productId', getProductReviews);
router.post('/', authenticate, createReview);

export default router;
