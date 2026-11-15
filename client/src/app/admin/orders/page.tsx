'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Order, OrderStatus } from '../../../types';
import { api } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import {
  ShoppingBag,
  Truck,
  CheckCircle,
  Clock,
  Search,
  ExternalLink,
  ChevronDown,
  X,
  CreditCard,
  QrCode,
  DollarSign,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_OPTIONS: OrderStatus[] = [
  'Placed',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');
  const [search, setSearch] = useState<string>(initialSearch);

  // Selected Order for Tracking / Dispatch Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [courierName, setCourierName] = useState<string>('');
  const [trackingId, setTrackingId] = useState<string>('');
  const [updatingDispatch, setUpdatingDispatch] = useState<boolean>(false);

  // Selected Order for Viewing Payment Screenshot Modal
  const [viewingScreenshotOrder, setViewingScreenshotOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (paymentFilter !== 'All') params.append('paymentStatus', paymentFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/orders/admin/all?${params.toString()}`);
      if (res.success) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.error('Failed to fetch admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const socket = getSocket();
    const handleOrderEvent = (data: { order: Order }) => {
      setOrders((prev) => {
        const idx = prev.findIndex((o) => o._id === data.order._id);
        if (idx > -1) {
          const next = [...prev];
          next[idx] = data.order;
          return next;
        }
        return [data.order, ...prev];
      });
    };

    socket.on('order:created', handleOrderEvent);
    socket.on('order:updated', handleOrderEvent);

    return () => {
      socket.off('order:created', handleOrderEvent);
      socket.off('order:updated', handleOrderEvent);
    };
  }, [statusFilter, paymentFilter, search]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await api.patch(`/orders/admin/${orderId}/status`, {
        status: newStatus,
      });
      if (res.success) {
        toast.success(`Order #${orderId.slice(-8).toUpperCase()} updated to ${newStatus}`);
        fetchOrders();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order status');
    }
  };

  const handleMarkCodPaid = async (orderId: string) => {
    try {
      const res = await api.patch(`/orders/admin/${orderId}/mark-cod-paid`);
      if (res.success) {
        toast.success('Cash collected! Order marked as PAID.');
        fetchOrders();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update payment');
    }
  };

  const handleVerifyUpi = async (orderId: string) => {
    try {
      const res = await api.patch(`/orders/admin/${orderId}/verify-upi`);
      if (res.success) {
        toast.success(`UPI Payment verified! Order #${orderId.slice(-8).toUpperCase()} marked as PAID.`);
        fetchOrders();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify UPI payment');
    }
  };

  const openDispatchModal = (order: Order) => {
    setSelectedOrder(order);
    setCourierName(order.courier || 'BlueDart Express');
    setTrackingId(order.trackingId || '');
  };

  const handleSaveDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdatingDispatch(true);
    try {
      const res = await api.patch(`/orders/admin/${selectedOrder._id}/status`, {
        status: 'Shipped',
        courier: courierName,
        trackingId,
        note: `Dispatched with ${courierName} (AWB: ${trackingId})`,
      });

      if (res.success) {
        toast.success('Shipment details attached & dispatched email triggered!');
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispatch shipment');
    } finally {
      setUpdatingDispatch(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600 block">
          Order Fulfillment
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-maroon-900 mt-0.5">
          Orders &amp; Shipments ({orders.length})
        </h1>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-cream-400 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by patron name, email, phone, tracking..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-cream-50 border border-cream-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-maroon-500"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-charcoal-muted" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-charcoal-muted font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-cream-50 border border-cream-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-charcoal"
            >
              <option value="All">All Statuses</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Payment Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-charcoal-muted font-semibold">Payment:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-cream-50 border border-cream-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-charcoal"
            >
              <option value="All">All Payment Types</option>
              <option value="PAID">PAID</option>
              <option value="UPI_VERIFICATION_PENDING">UPI_VERIFICATION_PENDING</option>
              <option value="COD_PENDING">COD_PENDING</option>
              <option value="PENDING">PENDING</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-cream-400 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-cream-100 text-charcoal-muted uppercase tracking-wider font-semibold border-b border-cream-300">
                <th className="p-4">Order ID &amp; Date</th>
                <th className="p-4">Patron &amp; Delivery Address</th>
                <th className="p-4">Items Summary</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Payment Details &amp; Verification</th>
                <th className="p-4">Fulfillment Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200 text-charcoal">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-cream-50 transition-colors">
                  {/* Order Reference */}
                  <td className="p-4">
                    <span className="font-mono font-bold text-sm text-maroon-700 block">
                      #{order._id.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-[11px] text-charcoal-muted">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </td>

                  {/* Customer Details & Address */}
                  <td className="p-4">
                    <span className="font-bold text-charcoal block">{order.address?.name}</span>
                    <span className="text-[11px] text-charcoal-muted block">{order.userEmail}</span>
                    <span className="text-[11px] text-charcoal-muted block mt-0.5">
                      {order.address?.city}, {order.address?.state} &bull; Ph: {order.address?.phone}
                    </span>
                  </td>

                  {/* Items */}
                  <td className="p-4">
                    <div className="space-y-1">
                      {order.items?.map((item, i) => (
                        <div key={i} className="text-[11px]">
                          <span className="font-semibold text-charcoal">{item.name}</span>
                          <span className="text-charcoal-muted"> &times; {item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="p-4">
                    <span className="font-bold text-sm text-maroon-700 block">
                      &#8377;{order.total?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-charcoal-muted">
                      {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Direct UPI'}
                    </span>
                  </td>

                  {/* Payment Details & Verification */}
                  <td className="p-4">
                    <div className="space-y-1.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : order.paymentStatus === 'UPI_VERIFICATION_PENDING'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-cream-200 text-charcoal'
                        }`}
                      >
                        {order.paymentStatus === 'UPI_VERIFICATION_PENDING'
                          ? 'UPI Pending Verification'
                          : order.paymentStatus}
                      </span>

                      {/* UTR / Transaction ID */}
                      {order.upiTransactionId && (
                        <div className="text-[11px] font-mono font-semibold text-maroon-800 bg-cream-50 px-2 py-0.5 rounded border border-cream-300 inline-block">
                          UTR: {order.upiTransactionId}
                        </div>
                      )}

                      {/* Payment Screenshot Viewer Link */}
                      {order.paymentScreenshot && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setViewingScreenshotOrder(order)}
                            className="flex items-center gap-1 text-[11px] font-bold text-maroon-700 hover:text-maroon-900 underline"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Payment Screenshot
                          </button>
                        </div>
                      )}

                      {/* UPI Verify Action */}
                      {order.paymentMethod === 'UPI' && order.paymentStatus === 'UPI_VERIFICATION_PENDING' && (
                        <button
                          type="button"
                          onClick={() => handleVerifyUpi(order._id)}
                          className="mt-1 block px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-bold shadow-xs transition-colors"
                        >
                          Verify &amp; Mark Paid
                        </button>
                      )}

                      {/* If COD and not paid yet */}
                      {order.paymentMethod === 'COD' && order.paymentStatus === 'COD_PENDING' && (
                        <button
                          onClick={() => handleMarkCodPaid(order._id)}
                          className="block text-[10px] text-green-700 hover:text-green-800 font-bold underline"
                        >
                          Mark Cash Collected
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Delivery Status Dropdown */}
                  <td className="p-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border focus:outline-none ${
                        order.status === 'Delivered'
                          ? 'bg-green-50 border-green-300 text-green-800'
                          : order.status === 'Shipped' || order.status === 'Out for Delivery'
                          ? 'bg-sky-50 border-sky-300 text-sky-800'
                          : order.status === 'Cancelled'
                          ? 'bg-red-50 border-red-300 text-red-800'
                          : 'bg-amber-50 border-amber-300 text-amber-800'
                      }`}
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>

                    {order.trackingId && (
                      <span className="block text-[10px] text-charcoal-muted mt-1 font-mono">
                        AWB: {order.trackingId}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right">
                    <button
                      onClick={() => openDispatchModal(order)}
                      className="px-3 py-1.5 bg-cream-100 hover:bg-cream-200 text-maroon-700 font-semibold rounded-lg border border-cream-300 text-[11px]"
                    >
                      {order.trackingId ? 'Edit Courier' : 'Dispatch'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Courier Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-cream-400">
            <div className="flex items-center justify-between pb-4 border-b border-cream-300 mb-4">
              <h3 className="font-serif text-lg font-bold text-maroon-900">
                Dispatch Order #{selectedOrder._id.slice(-8).toUpperCase()}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-charcoal hover:text-maroon-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDispatch} className="space-y-4 text-xs">
              <div>
                <label className="uppercase tracking-wider font-bold text-charcoal-muted block mb-1">
                  Courier / Air Express Partner
                </label>
                <input
                  type="text"
                  required
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full px-3 py-2 bg-cream-50 border border-cream-400 rounded-lg text-sm"
                  placeholder="e.g. BlueDart Express / Delhivery Air"
                />
              </div>

              <div>
                <label className="uppercase tracking-wider font-bold text-charcoal-muted block mb-1">
                  Tracking ID / Airway Bill (AWB) *
                </label>
                <input
                  type="text"
                  required
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="w-full px-3 py-2 bg-cream-50 border border-cream-400 rounded-lg text-sm font-mono"
                  placeholder="e.g. BD789123456IN"
                />
              </div>

              <div className="pt-4 border-t border-cream-300 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-cream-100 text-charcoal font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingDispatch}
                  className="px-5 py-2 bg-maroon-600 hover:bg-maroon-700 text-cream-100 font-bold uppercase rounded-lg shadow-sm"
                >
                  {updatingDispatch ? 'Updating...' : 'Confirm Dispatch & Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Screenshot Modal */}
      {viewingScreenshotOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-cream-400 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-cream-300 mb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-maroon-900">
                  Payment Verification &bull; Order #{viewingScreenshotOrder._id.slice(-8).toUpperCase()}
                </h3>
                <p className="text-xs text-charcoal-muted">
                  Patron: {viewingScreenshotOrder.address?.name} &bull; Amount: &#8377;{viewingScreenshotOrder.total?.toLocaleString('en-IN')}
                </p>
                {viewingScreenshotOrder.upiTransactionId && (
                  <p className="text-xs font-mono font-bold text-maroon-700 mt-0.5">
                    Customer UTR: {viewingScreenshotOrder.upiTransactionId}
                  </p>
                )}
              </div>
              <button
                onClick={() => setViewingScreenshotOrder(null)}
                className="p-1 text-charcoal-muted hover:text-maroon-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-cream-200 bg-cream-50 p-2 flex items-center justify-center min-h-[300px]">
              <img
                src={viewingScreenshotOrder.paymentScreenshot}
                alt="Payment Confirmation Screenshot"
                className="max-h-[60vh] w-auto object-contain rounded-lg shadow-sm"
              />
            </div>

            <div className="pt-4 border-t border-cream-300 flex items-center justify-between gap-3 mt-3">
              <a
                href={viewingScreenshotOrder.paymentScreenshot}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-maroon-700 underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Full Image
              </a>

              <div className="flex items-center gap-2">
                {viewingScreenshotOrder.paymentStatus === 'UPI_VERIFICATION_PENDING' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleVerifyUpi(viewingScreenshotOrder._id);
                      setViewingScreenshotOrder(null);
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Verify &amp; Confirm Payment
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingScreenshotOrder(null)}
                  className="px-4 py-2 bg-cream-200 text-charcoal font-semibold text-xs rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading orders...</div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}
