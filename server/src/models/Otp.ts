import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  otp: string;
  purpose: 'signup' | 'login' | 'reset';
  data?: string; // Serialized JSON payload (e.g. name, passwordHash, phone)
  expiresAt: Date;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
      trim: true,
    },
    purpose: {
      type: String,
      enum: ['signup', 'login', 'reset'],
      default: 'signup',
    },
    data: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '0s' }, // MongoDB automatic TTL expiration
    },
  },
  {
    timestamps: true,
  }
);

OtpSchema.index({ email: 1, purpose: 1 });

export const Otp = mongoose.model<IOtp>('Otp', OtpSchema);

