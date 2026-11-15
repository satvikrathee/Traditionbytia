import { Request, Response } from 'express';
import multer from 'multer';
import { uploadImageToStorage } from '../services/storageService.js';

// Multer memory storage
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP, AVIF) are allowed'));
    }
  },
});

export const handleSingleUpload = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image file provided' });
      return;
    }

    const result = await uploadImageToStorage(req.file.buffer, req.file.mimetype);
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      image: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Image upload failed' });
  }
};

