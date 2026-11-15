'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  QrCode,
  Users,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard-stats');
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Re-fetch or update when orders / stock change in real-time
    const socket = getSocket();
    const handleRefresh = () => {
      fetchStats();
    };

    socket.on('order:created', handleRefresh);
    socket.on('order:updated', handleRefresh);
    socket.on('inventory:updated', handleRefresh);

    return () => {
      socket.off('order:created', handleRefresh);
      socket.off('order:updated', handleRefresh);
      socket.off('inventory:updated', handleRefresh);
    };
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-3 text-xs text-charcoal-muted">Aggregating real-time business telemetry...</p>
      </div>
    );
  }

  const {
    totalOrders = 0,
    totalRevenue = 0,
    pendingOrders = 0,
    totalCustomers = 0,
    paymentSplit = { upi: 0, cod: 0 },
    revenueTrend = [],
    lowStockAlerts = [],
    recentOrders = [],
  } = stats || {};

  const totalSplitCount = (paymentSplit.upi || 0) + (paymentSplit.cod || 0);
  const upiPercent = totalSplitCount > 0 ? Math.round((paymentSplit.upi / totalSplitCount) * 100) : 50;
  const codPercent = totalSplitCount > 0 ? 100 - upiPercent : 50;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600 block">
          Executive Overview
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-maroon-900 mt-0.5">
          Traditions By Tiya Dashboard
        </h1>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-cream-400 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-charcoal-muted font-bold block mb-1">
              Total Revenue
            </span>
            <span className="font-serif text-2xl font-bold text-maroon-800">
              &#8377;{totalRevenue.toLocaleString('en-IN')}
            </span>
            <p className="text-[11px] text-green-700 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Verified settlements
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-green-700">
            &#8377;
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-2xl border border-cream-400 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-charcoal-muted font-bold block mb-1">
              Total Orders
            </span>
            <span className="font-serif text-2xl font-bold text-charcoal">
              {totalOrders}
            </span>
            <p className="text-[11px] text-charcoal-muted mt-1">Across all categories</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cream-200 border border-gold-300 flex items-center justify-center text-maroon-700">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Fulfillment */}
        <div className="bg-white p-6 rounded-2xl border border-cream-400 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-charcoal-muted font-bold block mb-1">
              Pending Orders
            </span>
            <span className="font-serif text-2xl font-bold text-amber-700">
              {pendingOrders}
            </span>
            <p className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Require dispatch
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Total Registered Patrons */}
        <div className="bg-white p-6 rounded-2xl border border-cream-400 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-charcoal-muted font-bold block mb-1">
              Registered Patrons
            </span>
            <span className="font-serif text-2xl font-bold text-charcoal">
              {totalCustomers}
            </span>
            <p className="text-[11px] text-charcoal-muted mt-1">Customer profiles</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two Columns: Payment Split + Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* UPI vs COD Split */}
        <div className="bg-white p-6 rounded-2xl border border-cream-400 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-maroon-900">
              Payment Method Ratio
            </h2>
            <span className="text-xs text-charcoal-muted font-medium">{totalSplitCount} transactions</span>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="flex items-center gap-1.5 text-green-800">
                  <QrCode className="w-4 h-4 text-green-600" /> UPI (Razorpay) &bull; {paymentSplit.upi}
                </span>
                <span className="text-green-800">{upiPercent}%</span>
              </div>
              <div className="w-full bg-cream-200 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-green-600 h-full rounded-full transition-all duration-700"
                  style={{ width: `${upiPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="flex items-center gap-1.5 text-amber-800">
                  <CreditCard className="w-4 h-4 text-amber-600" /> Cash on Delivery (COD) &bull; {paymentSplit.cod}
                </span>
                <span className="text-amber-800">{codPercent}%</span>
              </div>
              <div className="w-full bg-cream-200 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-amber-600 h-full rounded-full transition-all duration-700"
                  style={{ width: `${codPercent}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-charcoal-muted pt-2 border-t border-cream-300">
            Real-time change stream synchronization guarantees instant status updates across all open sessions.
          </p>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-2xl border border-cream-400 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-maroon-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" /> Low Stock Warning
            </h2>
            <Link
              href="/admin/inventory"
              className="text-xs font-bold text-maroon-600 hover:underline uppercase tracking-wider"
            >
              Manage Inventory &rarr;
            </Link>
          </div>

          {lowStockAlerts.length === 0 ? (
            <p className="text-xs text-green-700 bg-green-50 p-4 rounded-xl border border-green-200">
              All inventory levels are currently healthy (&gt; 5 units).
            </p>
          ) : (
            <div className="divide-y divide-cream-200 max-h-56 overflow-y-auto pr-1">
              {lowStockAlerts.map((prod: any) => (
                <div key={prod._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-charcoal block">{prod.name}</span>
                    <span className="text-charcoal-muted">{prod.category}</span>
                  </div>
                  <span className="bg-red-100 text-red-800 font-bold px-2.5 py-1 rounded-full border border-red-200">
                    {prod.stock === 0 ? 'Out of Stock' : `Only ${prod.stock} Left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-cream-400 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-cream-300 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-maroon-900">
            Recent Orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-maroon-600 hover:underline uppercase tracking-wider"
          >
            View All Orders &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-cream-100 text-charcoal-muted uppercase tracking-wider font-semibold border-b border-cream-300">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200 text-charcoal">
              {recentOrders.map((order: any) => (
                <tr key={order._id} className="hover:bg-cream-50 transition-colors">
                  <td className="p-4 font-mono font-bold text-maroon-700">
                    #{order._id.slice(-8).toUpperCase()}
                  </td>
                  <td className="p-4">
                    <span className="font-bold block">{order.address?.name}</span>
                    <span className="text-[11px] text-charcoal-muted">{order.userEmail}</span>
                  </td>
                  <td className="p-4 text-charcoal-muted">
                    {order.items?.length} item{order.items?.length > 1 ? 's' : ''}
                  </td>
                  <td className="p-4 font-bold text-maroon-700">
                    &#8377;{order.total?.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        order.paymentStatus === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.paymentStatus} ({order.paymentMethod})
                    </span>
                  </td>
                  <td className="p-4 font-bold text-charcoal">
                    {order.status}
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/admin/orders?search=${order._id.slice(-8)}`}
                      className="text-maroon-600 hover:text-maroon-800 font-bold"
                    >
                      Manage &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

