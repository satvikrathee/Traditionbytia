import mongoose, { Document, Schema } from 'mongoose';

export interface IProductImage {
  url: string;
  publicId?: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  discountPrice?: number;
  stock: number;
  images: IProductImage[];
  isActive: boolean;
  featured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  rating?: number;
  numReviews?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: { type: String, required: true },
    category: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: {
      type: [ProductImageSchema],
      validate: [(val: IProductImage[]) => val.length > 0, 'At least one product image is required'],
    },
    isActive: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: true },
    rating: { type: Number, default: 4.9 },
    numReviews: { type: Number, default: 18 },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1, price: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);

