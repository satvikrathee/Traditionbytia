'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Product, Review } from '../../../types';
import { api } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import ReviewModal from '../../../components/reviews/ReviewModal';
import {
  Star,
  ShoppingBag,
  Zap,
  Truck,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isBuying, setIsBuying] = useState<boolean>(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewDistribution, setReviewDistribution] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);

  const fetchReviews = async (productId: string) => {
    try {
      const res = await api.get(`/reviews/product/${productId}`);
      if (res.success) {
        setReviews(res.reviews || []);
        if (res.distribution) setReviewDistribution(res.distribution);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/slug/${slug}`);
        if (res.success && res.product) {
          setProduct(res.product);
          fetchReviews(res.product._id);
        }
      } catch (err) {
        console.error('Failed to fetch product details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  // Real-time stock & price updates for this specific product
  useEffect(() => {
    const socket = getSocket();

    const handleInventoryUpdate = (data: {
      productId: string;
      stock: number;
      price?: number;
      discountPrice?: number;
    }) => {
      if (product && product._id === data.productId) {
        setProduct((prev) =>
          prev
            ? {
                ...prev,
                stock: data.stock,
                ...(data.price !== undefined ? { price: data.price } : {}),
                ...(data.discountPrice !== undefined ? { discountPrice: data.discountPrice } : {}),
              }
            : null
        );
        toast(`Live update: stock is now ${data.stock}`, { icon: '🔔' });
      }
    };

    socket.on('inventory:updated', handleInventoryUpdate);
    return () => {
      socket.off('inventory:updated', handleInventoryUpdate);
    };
  }, [product]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-10 h-10 border-4 border-maroon-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-sm text-charcoal-muted">Unveiling Royal Masterpiece...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-maroon-800">Product Not Found</h2>
        <p className="text-sm text-charcoal-muted mt-2">
          The requested creation may have been archived or is no longer accessible.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block px-6 py-2.5 bg-maroon-600 text-cream-100 text-xs font-bold uppercase tracking-wider rounded-lg"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  const effectivePrice =
    product.discountPrice && product.discountPrice < product.price
      ? product.discountPrice
      : product.price;

  const discountPercent =
    product.discountPrice && product.discountPrice < product.price
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : 0;

  const images = product.images?.length > 0 ? product.images : [{ url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800' }];

  const handleAddToCart = async () => {
    if (product.stock < 1) return;
    setIsAdding(true);
    await addToCart(product, quantity);
    setIsAdding(false);
  };

  const handleBuyNow = async () => {
    if (product.stock < 1) return;
    setIsBuying(true);
    await addToCart(product, quantity);
    router.push('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-charcoal-muted mb-8">
        <Link href="/" className="hover:text-maroon-600">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/shop" className="hover:text-maroon-600">Shop</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-maroon-600">
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-charcoal truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          {/* Main Selected Image with Zoom Container */}
          <div className="relative aspect-[3/4] bg-cream-100 rounded-2xl overflow-hidden border border-cream-400 shadow-royal group">
            <Image
              src={images[selectedImageIndex]?.url || images[0].url}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-top transition-transform duration-500 group-hover:scale-110 cursor-crosshair"
            />

            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-maroon-600 text-cream-100 text-xs font-bold px-2.5 py-1 rounded shadow-md tracking-wider">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-24 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImageIndex === idx
                      ? 'border-maroon-600 shadow-md scale-95'
                      : 'border-cream-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={img.url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info & Purchase Actions */}
        <div className="space-y-6">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600 block mb-1">
              {product.category} &bull; Authentic Handloom
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-maroon-900 leading-tight">
              {product.name}
            </h1>

            {/* Ratings */}
            <div className="flex items-center gap-2 mt-3 text-sm">
              <div className="flex items-center text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="font-bold text-charcoal">{product.rating || 4.9}</span>
              <span className="text-charcoal-muted">({product.numReviews || 18} Verified Patron Reviews)</span>
            </div>
          </div>

          {/* Price & Savings */}
          <div className="p-4 bg-cream-50 rounded-xl border border-cream-300 flex items-baseline gap-4">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-maroon-600">
              &#8377;{effectivePrice.toLocaleString('en-IN')}
            </span>
            {product.discountPrice && product.discountPrice < product.price && (
              <>
                <span className="text-base text-charcoal-muted line-through">
                  &#8377;{product.price.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                  You Save &#8377;{(product.price - product.discountPrice).toLocaleString('en-IN')}
                </span>
              </>
            )}
          </div>

          {/* Real-time Stock Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-charcoal-muted uppercase font-semibold tracking-wider">Availability:</span>
            {product.stock > 5 ? (
              <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                In Stock ({product.stock} units available)
              </span>
            ) : product.stock > 0 ? (
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Low Stock &ndash; Only {product.stock} pieces remaining!
              </span>
            ) : (
              <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                Out of Stock (Pre-order Available on Request)
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-bold text-charcoal-muted mb-2">
              Artisan &amp; Weave Notes
            </h3>
            <p className="text-sm text-charcoal-light leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Quantity Selector & Add to Cart / Buy Now */}
          {product.stock > 0 && (
            <div className="space-y-4 pt-4 border-t border-cream-300">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Quantity:</span>
                <div className="flex items-center border border-cream-400 bg-white rounded-lg">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-cream-100 disabled:opacity-30 text-charcoal"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-charcoal">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="p-2 hover:bg-cream-100 disabled:opacity-30 text-charcoal"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="flex-1 py-3.5 px-6 bg-white hover:bg-cream-100 text-maroon-700 font-bold text-sm uppercase tracking-wider border-2 border-maroon-600 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {isAdding ? 'Adding...' : 'Add To Cart'}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={isBuying}
                  className="flex-1 py-3.5 px-6 bg-gradient-to-r from-maroon-700 to-maroon-600 hover:from-maroon-800 hover:to-maroon-700 text-cream-100 font-bold text-sm uppercase tracking-wider rounded-xl shadow-royal transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <Zap className="w-4 h-4 text-gold-400" />
                  {isBuying ? 'Proceeding...' : 'Buy Now'}
                </button>
              </div>
            </div>
          )}

          {/* Guarantees */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-cream-300 text-center">
            <div className="p-3 bg-white rounded-xl border border-cream-400">
              <Truck className="w-5 h-5 mx-auto text-maroon-600 mb-1" />
              <span className="text-[11px] font-bold text-charcoal block">Express Dispatch</span>
              <span className="text-[10px] text-charcoal-muted">In 24-48 Hours</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-cream-400">
              <ShieldCheck className="w-5 h-5 mx-auto text-maroon-600 mb-1" />
              <span className="text-[11px] font-bold text-charcoal block">Pure Silk Certified</span>
              <span className="text-[10px] text-charcoal-muted">Artisan Authenticity</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-cream-400">
              <RotateCcw className="w-5 h-5 mx-auto text-maroon-600 mb-1" />
              <span className="text-[11px] font-bold text-charcoal block">Easy Exchange</span>
              <span className="text-[10px] text-charcoal-muted">7-Day Guarantee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Patron Reviews & Reflections Section */}
      <section className="mt-16 pt-12 border-t border-cream-300">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-gold-700 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs uppercase tracking-[0.25em] font-bold">
                Patron Reflections
              </span>
            </div>
            <h2 className="font-serif text-3xl font-bold text-maroon-900">
              Customer Reviews &amp; Ratings
            </h2>
            <p className="text-xs text-charcoal-muted mt-1">
              Authentic feedback from patrons who have acquired this handcrafted piece
            </p>
          </div>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                toast.error('Please sign in to write a review');
                router.push(`/login?redirect=/product/${slug}`);
                return;
              }
              setShowReviewModal(true);
            }}
            className="self-start md:self-auto py-3 px-6 bg-gradient-to-r from-maroon-700 to-maroon-600 hover:from-maroon-800 hover:to-maroon-700 text-cream-100 font-bold text-xs uppercase tracking-wider rounded-xl shadow-royal transition-all flex items-center gap-2 active:scale-98"
          >
            <Star className="w-4 h-4 fill-gold-400 text-gold-400" />
            Write a Patron Review
          </button>
        </div>

        {/* Rating Breakdown Overview */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-400 shadow-sm mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Score box */}
            <div className="text-center md:border-r md:border-cream-300 md:pr-6">
              <span className="font-serif text-5xl font-bold text-maroon-900 block">
                {product.rating || 4.9}
              </span>
              <div className="flex items-center justify-center gap-1 text-gold-500 my-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i <= Math.round(product.rating || 5)
                        ? 'fill-gold-400 text-gold-500'
                        : 'fill-transparent text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-charcoal-muted font-semibold block">
                Based on {reviews.length > 0 ? reviews.length : (product.numReviews || 18)} verified patron reflections
              </span>
            </div>

            {/* Distribution Bars */}
            <div className="md:col-span-2 space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviewDistribution[stars] || 0;
                const totalRev = reviews.length > 0 ? reviews.length : 1;
                const percentage = reviews.length > 0
                  ? Math.round((count / totalRev) * 100)
                  : stars === 5 ? 85 : stars === 4 ? 15 : 0;

                return (
                  <div key={stars} className="flex items-center gap-3 text-xs">
                    <span className="w-12 font-bold text-charcoal flex items-center gap-1">
                      {stars} <Star className="w-3 h-3 fill-gold-400 text-gold-400" />
                    </span>
                    <div className="flex-1 h-2 bg-cream-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gold-500 to-maroon-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-charcoal-muted font-mono font-medium">
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((rev) => (
              <div
                key={rev._id}
                className="bg-white p-6 rounded-2xl border border-cream-300 shadow-xs hover:border-gold-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-maroon-700 to-maroon-900 text-cream-100 flex items-center justify-center font-bold text-xs shadow-xs">
                      {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-charcoal">{rev.userName}</span>
                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-800 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3 text-green-600" />
                            Verified Patron
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-charcoal-muted">
                        {rev.createdAt
                          ? new Date(rev.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Recent Patron'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-gold-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating
                            ? 'fill-gold-400 text-gold-500'
                            : 'fill-transparent text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {rev.title && (
                  <h4 className="font-serif text-sm font-bold text-maroon-900 mb-1">
                    {rev.title}
                  </h4>
                )}
                <p className="text-xs text-charcoal-light leading-relaxed">
                  {rev.comment}
                </p>
              </div>
            ))
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-cream-300 text-center space-y-3">
              <Star className="w-8 h-8 text-gold-400 mx-auto" />
              <h3 className="font-serif text-base font-bold text-maroon-900">
                Be the First Patron to Share a Reflection
              </h3>
              <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
                Have you acquired or experienced this exquisite creation? Share your thoughts to help future patrons.
              </p>
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.error('Please sign in to write a review');
                    router.push(`/login?redirect=/product/${slug}`);
                    return;
                  }
                  setShowReviewModal(true);
                }}
                className="mt-2 py-2.5 px-5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5"
              >
                <Star className="w-3.5 h-3.5 fill-gold-400 text-gold-400" />
                Write First Review
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Review Modal */}
      {product && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          defaultProductId={product._id}
          defaultProductName={product.name}
          onReviewSubmitted={(newRev) => {
            setReviews((prev) => [newRev, ...prev]);
            if (product) {
              setProduct({
                ...product,
                rating: newRev.rating,
                numReviews: (product.numReviews || 0) + 1,
              });
            }
          }}
        />
      )}
    </div>
  );
}

