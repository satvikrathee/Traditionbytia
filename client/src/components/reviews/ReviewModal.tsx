'use client';

import React, { useState } from 'react';
import { Star, X, CheckCircle, Sparkles, HeartHandshake } from 'lucide-react';
import { api } from '../../lib/api';
import { Review } from '../../types';
import toast from 'react-hot-toast';

interface ReviewProductItem {
  _id: string;
  name: string;
  image?: string;
}

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted?: (review: Review) => void;
  orderId?: string;
  products?: ReviewProductItem[];
  defaultProductId?: string;
  defaultProductName?: string;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Disappointing',
  2: 'Fair Experience',
  3: 'Good Quality',
  4: 'Very Pleased',
  5: 'Royal Perfection (Exceptional)',
};

export default function ReviewModal({
  isOpen,
  onClose,
  onReviewSubmitted,
  orderId,
  products = [],
  defaultProductId,
  defaultProductName,
}: ReviewModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    defaultProductId || products[0]?._id || ''
  );
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentProduct =
    products.find((p) => p._id === selectedProductId) ||
    (defaultProductId
      ? { _id: defaultProductId, name: defaultProductName || 'Handcrafted Luxury' }
      : products[0]);

  const handleSkip = () => {
    if (orderId) {
      try {
        sessionStorage.setItem(`skipped_review_${orderId}`, 'true');
      } catch (e) {
        // ignore
      }
    }
    toast('You can share your feedback anytime from your orders page.', {
      icon: '✨',
    });
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating) {
      toast.error('Please choose a star rating');
      return;
    }

    if (!comment.trim() || comment.trim().length < 5) {
      toast.error('Please share at least a few words about your experience (minimum 5 characters)');
      return;
    }

    const prodId = selectedProductId || currentProduct?._id;
    if (!prodId) {
      toast.error('Product selection is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/reviews', {
        productId: prodId,
        orderId: orderId || undefined,
        rating,
        title: title.trim() || RATING_LABELS[rating] || 'Customer Review',
        comment: comment.trim(),
      });

      if (res.success && res.review) {
        toast.success('Your royal reflection has been shared! Thank you.');
        if (orderId) {
          try {
            sessionStorage.setItem(`reviewed_order_${orderId}`, 'true');
          } catch (e) {
            // ignore
          }
        }
        if (onReviewSubmitted) {
          onReviewSubmitted(res.review);
        }
        onClose();
      } else {
        throw new Error(res.message || 'Failed to submit review');
      }
    } catch (err: any) {
      console.error('Submit review error:', err);
      toast.error(err.message || 'Could not submit your review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStarCount = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-maroon-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gold-400/40 overflow-hidden transform transition-all animate-scaleUp">
        {/* Top Ornament Header */}
        <div className="bg-gradient-to-r from-maroon-900 via-maroon-800 to-maroon-900 p-6 text-cream-100 text-center relative">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-1.5 text-cream-200/70 hover:text-cream-100 hover:bg-maroon-700/60 rounded-full transition-colors"
            title="Close / Skip"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold-500/20 border border-gold-400/40 text-gold-400 mb-2">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>

          <h3 className="font-serif text-2xl font-bold tracking-wide text-cream-50">
            Share Your Reflection
          </h3>
          <p className="text-xs text-cream-200/80 mt-1 max-w-sm mx-auto">
            How was your experience with our handcrafted royal collection?
          </p>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
          {/* Product Picker if multiple items exist */}
          {products.length > 1 && (
            <div>
              <label className="text-[11px] uppercase tracking-wider font-bold text-charcoal-muted block mb-1.5">
                Select Item to Review
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {products.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => setSelectedProductId(p._id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                      selectedProductId === p._id
                        ? 'bg-maroon-700 text-cream-100 border-maroon-700 shadow-xs'
                        : 'bg-cream-50 text-charcoal-light border-cream-300 hover:border-maroon-400'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Currently Selected Product Name */}
          {currentProduct && (
            <div className="bg-cream-50/70 p-3 rounded-xl border border-cream-300 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center flex-shrink-0">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-charcoal-muted tracking-wider block">
                  Reviewing Artisan Piece
                </span>
                <span className="text-xs font-bold text-maroon-900 truncate block">
                  {currentProduct.name}
                </span>
              </div>
            </div>
          )}

          {/* Star Rating Selector */}
          <div className="text-center py-2">
            <label className="text-xs uppercase tracking-wider font-bold text-charcoal-muted block mb-2">
              Your Overall Rating
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((starVal) => {
                const isFilled = starVal <= activeStarCount;
                return (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setRating(starVal)}
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-gold-400 hover:scale-115 transition-transform duration-150 focus:outline-none"
                    aria-label={`Rate ${starVal} stars`}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        isFilled
                          ? 'fill-gold-400 text-gold-500 drop-shadow-sm'
                          : 'fill-transparent text-gray-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-semibold text-gold-700 mt-2 h-4">
              {RATING_LABELS[activeStarCount] || ''}
            </p>
          </div>

          {/* Review Title (Optional) */}
          <div>
            <label className="text-xs uppercase tracking-wider font-bold text-charcoal-muted block mb-1">
              Headline / Summary (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Majestic drape and magnificent zari work"
              className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-xl text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-maroon-500"
              maxLength={120}
            />
          </div>

          {/* Review Comment Textarea */}
          <div>
            <label className="text-xs uppercase tracking-wider font-bold text-charcoal-muted block mb-1">
              Your Review / Reflection *
            </label>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell other patrons about the fabric quality, stitching, fit, or packaging..."
              className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-xl text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-maroon-500 resize-none"
              minLength={5}
              maxLength={1000}
            />
            <p className="text-[10px] text-charcoal-muted text-right mt-0.5">
              {comment.length}/1000 characters
            </p>
          </div>

          {/* Action Buttons: Submit Review or Skip */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-5 bg-gradient-to-r from-maroon-700 to-maroon-600 hover:from-maroon-800 hover:to-maroon-700 text-cream-100 font-bold text-xs uppercase tracking-wider rounded-xl shadow-royal transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Publishing Review...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-gold-400" />
                  <span>Submit Royal Review</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="py-3 px-5 bg-cream-100 hover:bg-cream-200 text-charcoal-light font-bold text-xs uppercase tracking-wider rounded-xl transition-colors border border-cream-300"
            >
              Skip / Maybe Later
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
