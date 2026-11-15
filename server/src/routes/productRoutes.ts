import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStockAndPrice,
} from '../controllers/productController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);

// Protected Admin routes
router.post('/', authenticate, requireAdmin, createProduct);
router.put('/:id', authenticate, requireAdmin, updateProduct);
router.patch('/:id/inventory', authenticate, requireAdmin, updateStockAndPrice);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

export default router;

