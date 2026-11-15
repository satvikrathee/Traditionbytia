'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Order, OrderStatus } from '../../../types';
import { api } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  MapPin,
  ShieldCheck,
  ChevronLeft,
  Calendar,
  AlertCircle,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReviewModal from '../../../components/reviews/ReviewModal';

const STATUS_STEPS: OrderStatus[] = [
  'Placed',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        if (res.success && res.order) {
          setOrder(res.order);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to fetch order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Connect to real-time Socket.io room for this order
    const socket = getSocket();
    socket.emit('join:order', orderId);

    const handleOrderUpdate = (data: { order: Order }) => {
      if (data.order && data.order._id === orderId) {
        setOrder(data.order);
        toast.success(`Live order update: status is now "${data.order.status}"!`, {
          icon: '👑',
        });
      }
    };

    socket.on('order:updated', handleOrderUpdate);

    return () => {
      socket.off('order:updated', handleOrderUpdate);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-3 text-sm text-charcoal-muted">Connecting to Live Tracking Stream...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-maroon-900">Order Not Found</h2>
        <p className="text-sm text-charcoal-muted mt-2">Could not locate order reference #{orderId}</p>
        <Link
          href="/orders"
          className="mt-6 inline-block px-6 py-2.5 bg-maroon-600 text-cream-100 text-xs font-bold uppercase rounded-lg"
        >
          Back to My Orders
        </Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'Cancelled';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      {/* Top back navigation */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-maroon-600 hover:underline uppercase tracking-wider mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Back to My Orders
      </Link>

      <div className="bg-white rounded-3xl border border-cream-400 shadow-royal overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-maroon-800 via-maroon-700 to-maroon-900 text-cream-100 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-gold-400 font-bold block mb-1">
                Live Real-Time Tracking
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold">
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-xs text-cream-300 mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-gold-400" />
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-gold-400/30 text-xs font-semibold text-gold-300">
                Payment: {order.paymentStatus} ({order.paymentMethod})
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Order Stepper */}
        <div className="p-6 sm:p-10 border-b border-cream-300">
          <h2 className="font-serif text-lg font-bold text-maroon-900 mb-8">
            Fulfillment Journey
          </h2>

          {isCancelled ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>This order has been cancelled. Any pre-paid funds will be returned within 3-5 business days.</span>
            </div>
          ) : (
            <div className="relative">
              {/* Stepper Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-6 relative z-10">
                {STATUS_STEPS.map((step, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div key={step} className="flex flex-col items-center text-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-500 shadow-sm ${
                          isCompleted
                            ? 'bg-maroon-600 text-cream-100 ring-4 ring-gold-400/30'
                            : 'bg-cream-200 text-charcoal-muted'
                        } ${isCurrent ? 'scale-110 animate-bounce' : ''}`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                      </div>
                      <span
                        className={`text-xs mt-2.5 font-bold tracking-wider uppercase ${
                          isCurrent
                            ? 'text-maroon-700'
                            : isCompleted
                            ? 'text-charcoal'
                            : 'text-charcoal-muted font-normal'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Courier & Tracking Details */}
          {(order.courier || order.trackingId) && (
            <div className="mt-8 p-4 bg-cream-50 rounded-xl border border-cream-400 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 text-charcoal">
                <Truck className="w-4 h-4 text-maroon-600" />
                <span>
                  Dispatched via <strong>{order.courier || 'Express Handloom Courier'}</strong>
                </span>
              </div>
              {order.trackingId && (
                <div className="flex items-center gap-2">
                  <span className="text-charcoal-muted">Tracking AWB:</span>
                  <span className="font-mono font-bold text-maroon-700 bg-white px-2 py-0.5 rounded border border-cream-300">
                    {order.trackingId}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Details & Summary Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-cream-300">
          {/* Items in order */}
          <div className="p-6 sm:p-8 space-y-4">
            <h3 className="font-serif text-base font-bold text-maroon-900 mb-2">
              Items in this Order
            </h3>
            <div className="divide-y divide-cream-200">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-16 rounded-md overflow-hidden bg-cream-100 flex-shrink-0 border border-cream-300">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-charcoal">{item.name}</h4>
                      <p className="text-[11px] text-charcoal-muted">Qty: {item.qty} &bull; &#8377;{item.price.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-charcoal">
                    &#8377;{(item.price * item.qty).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-cream-300 space-y-1 text-xs">
              <div className="flex justify-between text-charcoal-light">
                <span>Subtotal</span>
                <span className="font-semibold text-charcoal">&#8377;{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-charcoal-light">
                <span>Shipping Fee</span>
                <span className="font-semibold text-charcoal">
                  {order.shippingFee === 0 ? <strong className="text-green-700">FREE</strong> : `₹${order.shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-maroon-900 pt-2 border-t border-cream-200">
                <span>Total Paid / Payable</span>
                <span className="font-serif text-base text-maroon-600">&#8377;{order.total.toLocaleString('en-IN')}</span>
              </div>

              {order.paymentMethod === 'UPI' && (
                <div className="mt-3 p-3 bg-cream-50 rounded-xl border border-cream-300 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-charcoal-muted uppercase font-bold">Payment Method</span>
                    <span className="text-xs font-semibold text-maroon-800">Direct UPI</span>
                  </div>
                  {order.upiTransactionId && (
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-charcoal-muted uppercase font-bold">UTR / Reference</span>
                      <span className="text-xs font-mono font-bold text-charcoal">{order.upiTransactionId}</span>
                    </div>
                  )}
                  {order.paymentScreenshot && (
                    <div className="pt-1">
                      <a
                        href={order.paymentScreenshot}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-maroon-700 underline"
                      >
                        View Attached Payment Screenshot &rarr;
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Review Order Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-cream-100 to-cream-50 hover:bg-cream-200 text-maroon-900 border border-gold-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <Star className="w-3.5 h-3.5 fill-gold-500 text-gold-500" />
                  Leave a Patron Review
                </button>
              </div>
            </div>
          </div>

          {/* Shipping Address & Status History Timeline */}
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="font-serif text-base font-bold text-maroon-900 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold-600" /> Delivery Address
              </h3>
              <p className="text-xs text-charcoal font-bold">{order.address.name}</p>
              <p className="text-xs text-charcoal-light mt-0.5">
                {order.address.street}, {order.address.city}, {order.address.state} &ndash; {order.address.pincode}
              </p>
              <p className="text-xs text-charcoal-muted mt-1 font-semibold">Phone: {order.address.phone}</p>
            </div>

            <div>
              <h3 className="font-serif text-base font-bold text-maroon-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold-600" /> Milestone Log
              </h3>
              <div className="space-y-3">
                {order.statusHistory?.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-gold-600 mt-1 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-charcoal">{h.status}: </span>
                      <span className="text-charcoal-muted">{h.note || 'Milestone recorded'}</span>
                      <span className="block text-[10px] text-charcoal-muted">
                        {new Date(h.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} &bull;{' '}
                        {new Date(h.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        orderId={orderId}
        products={order?.items?.map((item) => ({
          _id: item.productId,
          name: item.name,
          image: item.image,
        }))}
      />
    </div>
  );
}

