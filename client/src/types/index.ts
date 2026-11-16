export type Role = 'customer' | 'admin';

export interface Address {
  _id?: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  addresses: Address[];
}

export interface ProductImage {
  url: string;
  publicId?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  discountPrice?: number;
  stock: number;
  images: ProductImage[];
  isActive: boolean;
  featured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  rating?: number;
  numReviews?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  productId: Product;
  qty: number;
}

export interface Cart {
  _id?: string;
  userId?: string;
  items: CartItem[];
}

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

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  qty: number;
}

export interface StatusHistory {
  status: OrderStatus;
  at: string;
  note?: string;
}

export interface Order {
  _id: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  address: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  upiTransactionId?: string;
  paymentScreenshot?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: OrderStatus;
  statusHistory: StatusHistory[];
  courier?: string;
  trackingId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpiSettings {
  upiId: string;
  upiNumber: string;
  payeeName: string;
  qrCodeUrl?: string;
  useCustomQr: boolean;
  instructions: string;
  isActive: boolean;
}

export interface Review {
  _id: string;
  user: string;
  userName: string;
  userEmail?: string;
  productId: string;
  productName: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  order?: number;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}



