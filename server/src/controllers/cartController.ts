import { Response } from 'express';
import mongoose from 'mongoose';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { AuthRequest } from '../middleware/auth.js';

export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    let cart = await Cart.findOne({ userId: req.user._id }).populate({
      path: 'items.productId',
      select: 'name slug price discountPrice stock images isActive',
    });

    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    res.status(200).json({ success: true, cart });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch cart' });
  }
};

export const syncCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { guestItems } = req.body; // Array of { productId, qty }
    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    if (Array.isArray(guestItems)) {
      for (const guestItem of guestItems) {
        if (!guestItem.productId || !mongoose.Types.ObjectId.isValid(guestItem.productId)) continue;

        const product = await Product.findById(guestItem.productId);
        if (!product || !product.isActive) continue;

        const existingItem = cart.items.find(
          (item) => item.productId.toString() === guestItem.productId
        );

        const targetQty = Math.max(1, parseInt(guestItem.qty, 10) || 1);

        if (existingItem) {
          existingItem.qty = Math.min(product.stock, existingItem.qty + targetQty);
        } else {
          cart.items.push({
            productId: new mongoose.Types.ObjectId(guestItem.productId),
            qty: Math.min(product.stock, targetQty),
          });
        }
      }
      await cart.save();
    }

    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.productId',
      select: 'name slug price discountPrice stock images isActive',
    });

    res.status(200).json({ success: true, cart: populatedCart });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Cart sync failed' });
  }
};

export const addToCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { productId, qty = 1 } = req.body;
    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      res.status(404).json({ success: false, message: 'Product not found or unavailable' });
      return;
    }

    if (product.stock < 1) {
      res.status(400).json({ success: false, message: 'This item is currently out of stock' });
      return;
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    const addedQty = Math.max(1, parseInt(qty, 10));

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].qty + addedQty;
      cart.items[existingIndex].qty = Math.min(product.stock, newQty);
    } else {
      cart.items.push({
        productId: new mongoose.Types.ObjectId(productId),
        qty: Math.min(product.stock, addedQty),
      });
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.productId',
      select: 'name slug price discountPrice stock images isActive',
    });

    res.status(200).json({ success: true, cart: populatedCart });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to add item to cart' });
  }
};

export const updateCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { productId, qty } = req.body;
    const targetQty = parseInt(qty, 10);

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      res.status(404).json({ success: false, message: 'Cart not found' });
      return;
    }

    if (targetQty <= 0) {
      cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    } else {
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }
      const item = cart.items.find((i) => i.productId.toString() === productId);
      if (item) {
        item.qty = Math.min(product.stock, targetQty);
      }
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.productId',
      select: 'name slug price discountPrice stock images isActive',
    });

    res.status(200).json({ success: true, cart: populatedCart });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update cart' });
  }
};

export const removeCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { productId } = req.params;
    const cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
      await cart.save();
    }

    const populatedCart = await Cart.findOne({ userId: req.user._id }).populate({
      path: 'items.productId',
      select: 'name slug price discountPrice stock images isActive',
    });

    res.status(200).json({ success: true, cart: populatedCart });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to remove cart item' });
  }
};

export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    await Cart.findOneAndUpdate({ userId: req.user._id }, { $set: { items: [] } });
    res.status(200).json({ success: true, message: 'Cart cleared' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to clear cart' });
  }
};

