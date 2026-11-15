import { Router } from 'express';
import { upload, handleSingleUpload } from '../controllers/uploadController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, requireAdmin, upload.single('image'), handleSingleUpload);

export default router;

