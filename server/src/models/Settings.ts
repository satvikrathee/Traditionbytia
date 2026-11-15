import mongoose, { Document, Schema } from 'mongoose';

export interface IUpiSettings {
  upiId: string;
  upiNumber: string;
  payeeName: string;
  qrCodeUrl?: string;
  useCustomQr: boolean;
  instructions: string;
  isActive: boolean;
}

export interface ISettings extends Document {
  key: string;
  upi: IUpiSettings;
  createdAt: Date;
  updatedAt: Date;
}

const UpiSettingsSchema = new Schema<IUpiSettings>(
  {
    upiId: { type: String, default: '8708305992@upi', trim: true },
    upiNumber: { type: String, default: '8708305992', trim: true },
    payeeName: { type: String, default: 'Traditions By Tiya (Misha Sandhu)', trim: true },
    qrCodeUrl: { type: String, default: '' },
    useCustomQr: { type: Boolean, default: false },
    instructions: {
      type: String,
      default: 'Scan QR with any UPI App (GPay, PhonePe, Paytm, BHIM), enter 12-digit UTR and upload payment receipt.',
    },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const SettingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, unique: true, default: 'store_settings' },
    upi: {
      type: UpiSettingsSchema,
      default: () => ({
        upiId: '8708305992@upi',
        upiNumber: '8708305992',
        payeeName: 'Traditions By Tiya (Misha Sandhu)',
        qrCodeUrl: '',
        useCustomQr: false,
        instructions: 'Scan QR with any UPI App (GPay, PhonePe, Paytm, BHIM), enter 12-digit UTR and upload payment receipt.',
        isActive: true,
      }),
    },
  },
  { timestamps: true }
);

export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
