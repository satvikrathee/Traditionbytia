import { Request, Response } from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalOrders, paidOrders, totalProducts, totalCustomers, lowStockProducts, recentOrders] =
      await Promise.all([
        Order.countDocuments(),
        Order.find({ paymentStatus: 'PAID' }),
        Product.countDocuments({ isActive: true }),
        User.countDocuments({ role: 'customer' }),
        Product.find({ stock: { $lte: 5 }, isActive: true }).select('name stock price images category'),
        Order.find().sort({ createdAt: -1 }).limit(6),
      ]);

    // Total Revenue (from paid orders + confirmed COD orders)
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);

    const pendingOrders = await Order.countDocuments({
      status: { $in: ['Placed', 'Confirmed', 'Packed'] },
    });

    // Payment split: UPI vs COD
    const [upiCount, codCount] = await Promise.all([
      Order.countDocuments({ paymentMethod: 'UPI' }),
      Order.countDocuments({ paymentMethod: 'COD' }),
    ]);

    // Status distribution
    const statusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Monthly / Daily revenue aggregation for chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const revenueByDay = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, paymentStatus: 'PAID' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue,
        pendingOrders,
        totalProducts,
        totalCustomers,
        paymentSplit: {
          upi: upiCount,
          cod: codCount,
        },
        statusDistribution: statusCounts.reduce((acc: any, cur) => {
          acc[cur._id] = cur.count;
          return acc;
        }, {}),
        revenueTrend: revenueByDay,
        lowStockAlerts: lowStockProducts,
        recentOrders,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch dashboard stats' });
  }
};

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('name email phone addresses createdAt')
      .sort({ createdAt: -1 });

    // Aggregate order counts and total spent per user
    const orderAgg = await Order.aggregate([
      {
        $group: {
          _id: '$userId',
          orderCount: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$total', 0],
            },
          },
          lastOrderDate: { $max: '$createdAt' },
        },
      },
    ]);

    const orderMap = new Map();
    orderAgg.forEach((agg) => {
      orderMap.set(agg._id.toString(), {
        orderCount: agg.orderCount,
        totalSpent: agg.totalSpent,
        lastOrderDate: agg.lastOrderDate,
      });
    });

    const customersWithOrders = customers.map((customer) => {
      const stats = orderMap.get(customer._id.toString()) || {
        orderCount: 0,
        totalSpent: 0,
        lastOrderDate: null,
      };
      return {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        addresses: customer.addresses,
        orderCount: stats.orderCount,
        totalSpent: stats.totalSpent,
        lastOrderDate: stats.lastOrderDate,
        joinedAt: customer.createdAt,
      };
    });

    res.status(200).json({ success: true, customers: customersWithOrders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch customers' });
  }
};

