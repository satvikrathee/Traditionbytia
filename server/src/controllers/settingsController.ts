import { Request, Response } from 'express';
import { Settings, IUpiSettings } from '../models/Settings.js';
import { AuthRequest } from '../middleware/auth.js';
import { uploadImageToStorage } from '../services/storageService.js';
import { getSocket } from '../services/socketService.js';

// Helper to get or create singleton store settings
const getOrCreateSettings = async () => {
  let settings = await Settings.findOne({ key: 'store_settings' });
  if (!settings) {
    settings = await Settings.create({
      key: 'store_settings',
      upi: {
        upiId: '8708305992@upi',
        upiNumber: '8708305992',
        payeeName: 'Traditions By Tiya (Misha Sandhu)',
        qrCodeUrl: '',
        useCustomQr: false,
        instructions: 'Scan QR with any UPI App (GPay, PhonePe, Paytm, BHIM), enter 12-digit UTR and upload payment receipt.',
        isActive: true,
      },
    });
  }
  return settings;
};

// Public: Get Active UPI Settings for Checkout
export const getUpiSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();
    res.status(200).json({
      success: true,
      upi: settings.upi,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch UPI settings',
    });
  }
};

// Protected Admin: Update UPI Details
export const updateUpiSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();
    const { upiId, upiNumber, payeeName, qrCodeUrl, useCustomQr, instructions, isActive } = req.body;

    if (upiId !== undefined) settings.upi.upiId = upiId.trim();
    if (upiNumber !== undefined) settings.upi.upiNumber = upiNumber.trim();
    if (payeeName !== undefined) settings.upi.payeeName = payeeName.trim();
    if (qrCodeUrl !== undefined) settings.upi.qrCodeUrl = qrCodeUrl.trim();
    if (useCustomQr !== undefined) settings.upi.useCustomQr = Boolean(useCustomQr);
    if (instructions !== undefined) settings.upi.instructions = instructions.trim();
    if (isActive !== undefined) settings.upi.isActive = Boolean(isActive);

    await settings.save();

    // Broadcast update via Socket.io so clients can update in real-time
    try {
      const io = getSocket();
      io.emit('settings:upi_updated', settings.upi);
    } catch (sockErr) {
      // Socket broadcast fallback
    }

    res.status(200).json({
      success: true,
      message: 'UPI Settings updated successfully',
      upi: settings.upi,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update UPI settings',
    });
  }
};

// Protected Admin: Upload Custom UPI QR Code Image
export const uploadQrCodeImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No QR code image file provided' });
      return;
    }

    const result = await uploadImageToStorage(
      req.file.buffer,
      req.file.mimetype,
      'traditions_by_tiya/qr_codes'
    );

    const settings = await getOrCreateSettings();
    settings.upi.qrCodeUrl = result.url;
    settings.upi.useCustomQr = true;
    await settings.save();

    try {
      const io = getSocket();
      io.emit('settings:upi_updated', settings.upi);
    } catch (sockErr) {
      // Socket fallback
    }

    res.status(200).json({
      success: true,
      message: 'Custom QR Code uploaded and set as active',
      url: result.url,
      upi: settings.upi,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload QR code image',
    });
  }
};
