import { Response } from 'express';
import mongoose from 'mongoose';
import { Order, IOrderItem, OrderStatus } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Cart } from '../models/Cart.js';
import { AuthRequest } from '../middleware/auth.js';
import { emitOrderCreated, emitOrderUpdated, emitInventoryUpdated } from '../services/socketService.js';
import { sendOrderPlacedEmail, sendOrderStatusEmail } from '../services/emailService.js';
import { uploadImageToStorage } from '../services/storageService.js';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { items, address, paymentMethod, upiTransactionId, paymentScreenshot } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Order must include at least one item' });
      return;
    }

    if (!address || !address.name || !address.phone || !address.street || !address.city || !address.state || !address.pincode) {
      res.status(400).json({ success: false, message: 'Complete delivery address is required' });
      return;
    }

    if (!['COD', 'UPI'].includes(paymentMethod)) {
      res.status(400).json({ success: false, message: 'Invalid payment method selected' });
      return;
    }

    // Step 1: Recompute all prices strictly from Database to prevent client price tampering
    let subtotal = 0;
    const validatedItems: IOrderItem[] = [];
    const decrementedProductList: { id: mongoose.Types.ObjectId; qty: number }[] = [];

    try {
      for (const item of items) {
        const qty = Math.max(1, parseInt(item.qty, 10));

        // Atomic stock decrement with condition: stock >= qty
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: item.productId, stock: { $gte: qty }, isActive: true },
          { $inc: { stock: -qty } },
          { new: true }
        );

        if (!updatedProduct) {
          // Rollback any previous atomic decrements
          for (const dec of decrementedProductList) {
            await Product.findByIdAndUpdate(dec.id, { $inc: { stock: dec.qty } });
          }

          const originalProduct = await Product.findById(item.productId);
          const availableStock = originalProduct ? originalProduct.stock : 0;
          res.status(400).json({
            success: false,
            message: `Insufficient stock for "${originalProduct?.name || 'item'}". Only ${availableStock} left.`,
          });
          return;
        }

        decrementedProductList.push({ id: updatedProduct._id as mongoose.Types.ObjectId, qty });

        const itemEffectivePrice = updatedProduct.discountPrice && updatedProduct.discountPrice < updatedProduct.price
          ? updatedProduct.discountPrice
          : updatedProduct.price;

        subtotal += itemEffectivePrice * qty;

        validatedItems.push({
          productId: updatedProduct._id as mongoose.Types.ObjectId,
          name: updatedProduct.name,
          image: updatedProduct.images[0]?.url || '',
          price: itemEffectivePrice,
          qty,
        });

        // Broadcast real-time stock reduction
        emitInventoryUpdated(
          updatedProduct._id.toString(),
          updatedProduct.stock,
          updatedProduct.price,
          updatedProduct.discountPrice
        );
      }
    } catch (dbErr: any) {
      // Revert if any unexpected error occurs during iteration
      for (const dec of decrementedProductList) {
        await Product.findByIdAndUpdate(dec.id, { $inc: { stock: dec.qty } });
      }
      throw dbErr;
    }

    // Free shipping on orders over 1499, otherwise 99
    const shippingFee = subtotal >= 1499 ? 0 : 99;
    const total = subtotal + shippingFee;

    // Build the order document
    const isUpi = paymentMethod === 'UPI';
    const orderData: any = {
      userId: req.user._id,
      userEmail: req.user.email,
      items: validatedItems,
      subtotal,
      shippingFee,
      total,
      address,
      paymentMethod,
      paymentStatus: isUpi ? 'UPI_VERIFICATION_PENDING' : 'COD_PENDING',
      upiTransactionId: isUpi ? (upiTransactionId || '') : '',
      paymentScreenshot: isUpi ? (paymentScreenshot || '') : '',
      status: 'Placed',
      statusHistory: [
        {
          status: 'Placed',
          at: new Date(),
          note: isUpi
            ? `Order placed via Direct UPI (UTR: ${upiTransactionId || 'N/A'}). Awaiting admin payment verification.`
            : 'Order placed via Cash on Delivery',
        },
      ],
    };

    const order = await Order.create(orderData);

    // Empty user cart upon successful order creation
    await Cart.findOneAndUpdate({ userId: req.user._id }, { $set: { items: [] } });

    // Send confirmation email and real-time event to socket
    emitOrderCreated(order);
    sendOrderPlacedEmail(order);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to place order' });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch orders' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    // Security: Only owner or admin can view order
    if (
      !req.user ||
      (req.user.role !== 'admin' && order.userId.toString() !== req.user._id.toString())
    ) {
      res.status(403).json({ success: false, message: 'Unauthorized to view this order' });
      return;
    }

    res.status(200).json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching order' });
  }
};

// Admin Operations
export const getAllOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, paymentStatus, paymentMethod, search, page = '1', limit = '15' } = req.query;

    const query: any = {};
    if (status && status !== 'All') query.status = status;
    if (paymentStatus && paymentStatus !== 'All') query.paymentStatus = paymentStatus;
    if (paymentMethod && paymentMethod !== 'All') query.paymentMethod = paymentMethod;

    if (search) {
      query.$or = [
        { userEmail: { $regex: search, $options: 'i' } },
        { 'address.name': { $regex: search, $options: 'i' } },
        { 'address.phone': { $regex: search, $options: 'i' } },
        { trackingId: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch orders' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note, courier, trackingId } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    const previousStatus = order.status;
    order.status = status as OrderStatus;

    if (courier !== undefined) order.courier = courier;
    if (trackingId !== undefined) order.trackingId = trackingId;

    order.statusHistory.push({
      status: status as OrderStatus,
      at: new Date(),
      note: note || `Status updated from ${previousStatus} to ${status}`,
    });

    // If order is cancelled, restore stock atomically
    if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
      for (const item of order.items) {
        const prod = await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.qty } },
          { new: true }
        );
        if (prod) {
          emitInventoryUpdated(prod._id.toString(), prod.stock, prod.price, prod.discountPrice);
        }
      }
    }

    await order.save();

    // Broadcast real-time change to customer and admin
    emitOrderUpdated(order);

    // Send status update email if Shipped or Delivered
    if (status === 'Shipped' || status === 'Delivered') {
      sendOrderStatusEmail(order, status);
    }

    res.status(200).json({ success: true, message: `Order marked as ${status}`, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update order status' });
  }
};

export const markCodAsPaid = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    order.paymentStatus = 'PAID';
    order.statusHistory.push({
      status: order.status,
      at: new Date(),
      note: 'Cash collected upon delivery. Payment marked as PAID by Admin.',
    });

    await order.save();
    emitOrderUpdated(order);

    res.status(200).json({ success: true, message: 'COD Payment marked as PAID', order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update payment status' });
  }
};

export const verifyUpiPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    order.paymentStatus = 'PAID';
    if (order.status === 'Placed') {
      order.status = 'Confirmed';
    }

    order.statusHistory.push({
      status: order.status,
      at: new Date(),
      note: 'UPI Payment verified and marked as PAID by Admin.',
    });

    await order.save();
    emitOrderUpdated(order);

    res.status(200).json({
      success: true,
      message: 'UPI Payment verified and marked as PAID',
      order,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to verify UPI payment' });
  }
};

export const uploadPaymentScreenshot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No screenshot file provided' });
      return;
    }

    const result = await uploadImageToStorage(
      req.file.buffer,
      req.file.mimetype,
      'traditions_by_tiya/payments'
    );

    res.status(200).json({
      success: true,
      message: 'Screenshot uploaded successfully',
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to upload payment screenshot' });
  }
};


