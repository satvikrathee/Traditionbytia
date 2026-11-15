import { Router } from 'express';
import {
  getCart,
  syncCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../controllers/cartController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/sync', syncCart);
router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/item/:productId', removeCartItem);
router.delete('/clear', clearCart);

export default router;

