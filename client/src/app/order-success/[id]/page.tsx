'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { CheckCircle, Package, ArrowRight, ShieldCheck, Mail, Star, Sparkles } from 'lucide-react';
import { api } from '../../../lib/api';
import { Order } from '../../../types';
import ReviewModal from '../../../components/reviews/ReviewModal';

export default function OrderSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [hasReviewed, setHasReviewed] = useState<boolean>(false);

  useEffect(() => {
    // Launch celebratory confetti burst
    confetti({
      particleCount: 110,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#7B1E3A', '#C9A24B', '#FFF8EE', '#521225'],
    });

    // Check if customer already skipped or reviewed this specific order
    const isSkipped = sessionStorage.getItem(`skipped_review_${orderId}`);
    const isDone = sessionStorage.getItem(`reviewed_order_${orderId}`);
    if (isDone) {
      setHasReviewed(true);
    }

    // Fetch order details to know the items purchased
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        if (res.success && res.order) {
          setOrder(res.order);

          // Pop up review modal automatically after 1.8 seconds unless already skipped or completed
          if (!isSkipped && !isDone) {
            const timer = setTimeout(() => {
              setShowReviewModal(true);
            }, 1800);
            return () => clearTimeout(timer);
          }
        }
      } catch (e) {
        console.error('Failed to fetch order for review trigger:', e);
      }
    };

    fetchOrder();
  }, [orderId]);

  const reviewItems =
    order?.items?.map((item) => ({
      _id: item.productId,
      name: item.name,
      image: item.image,
    })) || [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-500/30">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>

      <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600 block mb-2">
        Order Confirmed
      </span>
      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-maroon-900">
        Thank You for Your Patronage!
      </h1>
      <p className="text-sm text-charcoal-light mt-3 max-w-md mx-auto leading-relaxed">
        Your royal order has been accepted. Our master artisans and curation team are preparing your handcrafted treasures with utmost dedication.
      </p>

      {/* Order Reference Box */}
      <div className="my-8 p-6 bg-white rounded-2xl border border-cream-400 shadow-royal max-w-md mx-auto text-left space-y-3">
        <div className="flex justify-between items-center text-sm border-b border-cream-300 pb-3">
          <span className="text-charcoal-muted font-medium">Order Reference:</span>
          <span className="font-mono font-bold text-maroon-700 text-base">
            #{orderId?.slice(-8).toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-charcoal-light">
          <Mail className="w-4 h-4 text-gold-600 flex-shrink-0" />
          <span>A confirmation email with order summary has been dispatched.</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-charcoal-light">
          <ShieldCheck className="w-4 h-4 text-gold-600 flex-shrink-0" />
          <span>Handloom authenticity certificate included in packaging.</span>
        </div>
      </div>

      {/* Interactive Review Prompt Card */}
      <div className="my-8 p-6 bg-gradient-to-br from-cream-50 to-white rounded-2xl border border-gold-300 shadow-sm max-w-md mx-auto text-left">
        <div className="flex items-center gap-2 text-gold-700 mb-1">
          <Sparkles className="w-4 h-4" />
          <span className="text-[11px] uppercase tracking-wider font-bold">
            Patron Reflections &amp; Reviews
          </span>
        </div>
        <h3 className="font-serif text-lg font-bold text-maroon-900">
          {hasReviewed ? 'Thank You For Your Review!' : 'How Was Your Shopping Experience?'}
        </h3>
        <p className="text-xs text-charcoal-light mt-1">
          {hasReviewed
            ? 'Your valuable reflection has been published on Traditions By Tiya.'
            : 'Help fellow patrons discover authentic handcrafted luxury by leaving a quick star rating.'}
        </p>

        {!hasReviewed && (
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setShowReviewModal(true)}
              className="py-2.5 px-4 bg-maroon-700 hover:bg-maroon-800 text-cream-100 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Star className="w-3.5 h-3.5 fill-gold-400 text-gold-400" />
              Write a Review
            </button>
            <span className="text-xs text-charcoal-muted">or skip anytime</span>
          </div>
        )}
      </div>

      {/* Navigation Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
        <Link
          href={`/orders/${orderId}`}
          className="flex-1 py-3.5 px-6 bg-gradient-to-r from-maroon-700 to-maroon-600 hover:from-maroon-800 hover:to-maroon-700 text-cream-100 font-bold text-sm uppercase tracking-wider rounded-xl shadow-royal transition-all flex items-center justify-center gap-2"
        >
          <Package className="w-4 h-4 text-gold-400" />
          Track Order Live
        </Link>
        <Link
          href="/shop"
          className="flex-1 py-3.5 px-6 bg-cream-100 hover:bg-cream-200 text-charcoal font-semibold text-sm uppercase tracking-wider rounded-xl border border-cream-400 transition-all flex items-center justify-center gap-2"
        >
          Continue Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Royal Review Modal Popup */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onReviewSubmitted={(rev) => {
          setHasReviewed(true);
        }}
        orderId={orderId}
        products={reviewItems}
      />
    </div>
  );
}
