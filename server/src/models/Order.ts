import mongoose, { Document, Schema } from 'mongoose';

export type OrderStatus =
  | 'Placed'
  | 'Confirmed'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod = 'COD' | 'UPI';

export type PaymentStatus = 'PENDING' | 'PAID' | 'COD_PENDING' | 'FAILED' | 'UPI_VERIFICATION_PENDING';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  image: string;
  price: number;
  qty: number;
}

export interface IOrderAddress {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IStatusHistory {
  status: OrderStatus;
  at: Date;
  note?: string;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  items: IOrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  address: IOrderAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  upiTransactionId?: string;
  paymentScreenshot?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: OrderStatus;
  statusHistory: IStatusHistory[];
  courier?: string;
  trackingId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const OrderAddressSchema = new Schema<IOrderAddress>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const StatusHistorySchema = new Schema<IStatusHistory>(
  {
    status: {
      type: String,
      enum: ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
      required: true,
    },
    at: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: [(v: IOrderItem[]) => v.length > 0, 'Order must contain at least one item'],
    },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    address: { type: OrderAddressSchema, required: true },
    paymentMethod: {
      type: String,
      enum: ['COD', 'UPI'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'COD_PENDING', 'FAILED', 'UPI_VERIFICATION_PENDING'],
      default: 'PENDING',
      index: true,
    },
    upiTransactionId: { type: String, default: '' },
    paymentScreenshot: { type: String, default: '' },
    razorpayOrderId: { type: String, sparse: true, index: true },
    razorpayPaymentId: { type: String, sparse: true },
    razorpaySignature: { type: String },
    status: {
      type: String,
      enum: ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Placed',
      index: true,
    },
    statusHistory: {
      type: [StatusHistorySchema],
      default: () => [{ status: 'Placed', at: new Date(), note: 'Order placed successfully' }],
    },
    courier: { type: String, default: '' },
    trackingId: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ userId: 1, createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);

