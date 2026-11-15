import { v2 as cloudinary } from 'cloudinary';
import { ENV } from '../config/env.js';

let isCloudinaryConfigured = false;

export const initCloudinary = () => {
  if (ENV.CLOUDINARY_CLOUD_NAME && ENV.CLOUDINARY_API_KEY && ENV.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
      api_key: ENV.CLOUDINARY_API_KEY,
      api_secret: ENV.CLOUDINARY_API_SECRET,
      secure: true,
    });
    isCloudinaryConfigured = true;
    console.log('[Storage] Cloudinary initialized successfully.');
  } else {
    console.log('[Storage] Cloudinary credentials not fully supplied. Local/Data-URI fallback enabled for uploads.');
  }
};

export interface UploadResult {
  url: string;
  publicId: string;
}

export const uploadImageToStorage = async (
  fileBuffer: Buffer,
  mimeType: string,
  folder = 'traditions_by_tiya/products'
): Promise<UploadResult> => {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          transformation: [
            { width: 1200, height: 1500, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error('Cloudinary upload returned empty result'));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  // Fallback: create high-efficiency data-uri representation
  const base64 = fileBuffer.toString('base64');
  const fallbackUrl = `data:${mimeType};base64,${base64}`;
  const mockPublicId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  return {
    url: fallbackUrl,
    publicId: mockPublicId,
  };
};

export const deleteImageFromStorage = async (publicId: string): Promise<boolean> => {
  if (!publicId || publicId.startsWith('local_')) {
    return true;
  }
  if (isCloudinaryConfigured) {
    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (err) {
      console.error('[Storage] Cloudinary delete error:', err);
      return false;
    }
  }
  return true;
};

