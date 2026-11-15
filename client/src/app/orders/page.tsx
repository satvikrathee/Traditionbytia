'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Order } from '../../types';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../lib/socket';
import { Package, ArrowRight, Clock, CheckCircle, Truck, ExternalLink } from 'lucide-react';

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/orders');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/my-orders');
        if (res.success) {
          setOrders(res.orders);
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, authLoading, router]);

  // Socket.io real-time order listener
  useEffect(() => {
    if (!user?._id) return;

    const socket = getSocket();
    socket.emit('join:user', user._id);

    const handleOrderUpdate = (data: { order: Order }) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o._id === data.order._id);
        if (exists) {
          return prev.map((o) => (o._id === data.order._id ? data.order : o));
        }
        return [data.order, ...prev];
      });
    };

    socket.on('order:updated', handleOrderUpdate);
    socket.on('order:created', handleOrderUpdate);

    return () => {
      socket.off('order:updated', handleOrderUpdate);
      socket.off('order:created', handleOrderUpdate);
    };
  }, [user?._id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Shipped':
      case 'Out for Delivery':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Confirmed':
      case 'Packed':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-cream-100 text-maroon-700 border-gold-300';
    }
  };

  const getPaymentBadge = (status: string, method: string) => {
    if (status === 'PAID') {
      return <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">Paid ({method})</span>;
    }
    if (status === 'COD_PENDING') {
      return <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">COD &bull; To be collected</span>;
    }
    return <span className="text-[11px] font-bold text-charcoal-muted bg-gray-100 px-2 py-0.5 rounded">{status}</span>;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-3 text-sm text-charcoal-muted">Retrieving your order archives...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600 block">Patron Portfolio</span>
          <h1 className="font-serif text-3xl font-bold text-maroon-900 mt-0.5">My Royal Orders</h1>
        </div>
        <Link
          href="/shop"
          className="text-xs font-bold text-maroon-600 hover:text-maroon-700 flex items-center gap-1 uppercase tracking-wider"
        >
          Discover New Creations <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-400 p-12 text-center max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-gold-400/40">
            <Package className="w-8 h-8 text-gold-600" />
          </div>
          <h3 className="font-serif text-xl font-bold text-maroon-900">No Orders Placed Yet</h3>
          <p className="text-sm text-charcoal-muted mt-2">
            Your royal order history is currently empty. Explore our handlooms and grace your celebrations.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-block px-6 py-2.5 bg-maroon-600 hover:bg-maroon-700 text-cream-100 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-2xl border border-cream-400 shadow-sm overflow-hidden hover:shadow-royal transition-all duration-300"
            >
              {/* Order Header */}
              <div className="bg-cream-50 p-4 sm:p-6 border-b border-cream-300 flex flex-wrap justify-between items-center gap-4">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-charcoal-muted font-bold block">
                      Order Reference
                    </span>
                    <span className="font-mono font-bold text-sm text-maroon-800">
                      #{order._id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-charcoal-muted font-bold block">
                      Placed On
                    </span>
                    <span className="text-xs font-medium text-charcoal">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-charcoal-muted font-bold block">
                      Total Amount
                    </span>
                    <span className="text-xs font-bold text-maroon-700">
                      &#8377;{order.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getPaymentBadge(order.paymentStatus, order.paymentMethod)}
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadge(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Order Items List */}
              <div className="p-4 sm:p-6 divide-y divide-cream-200">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-cream-100 flex-shrink-0 border border-cream-300">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-semibold text-charcoal">{item.name}</h4>
                        <p className="text-xs text-charcoal-muted mt-0.5">
                          Quantity: {item.qty} &bull; &#8377;{item.price.toLocaleString('en-IN')} each
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-charcoal">
                        &#8377;{(item.price * item.qty).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer & Live Tracking Link */}
              <div className="p-4 bg-cream-50/50 border-t border-cream-300 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-xs text-charcoal-light flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gold-600" />
                  <span>
                    Delivering to <strong>{order.address.name}</strong>, {order.address.city}
                  </span>
                </div>

                <Link
                  href={`/orders/${order._id}`}
                  className="px-4 py-2 bg-cream-200 hover:bg-maroon-600 hover:text-white text-maroon-800 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
                >
                  View Live Tracking <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

