import { Router } from 'express';
import { getDashboardStats, getCustomers } from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard-stats', getDashboardStats);
router.get('/customers', getCustomers);

export default router;

