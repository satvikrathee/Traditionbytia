'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CartPage() {
  const router = useRouter();
  const { items, subtotal, shippingFee, total, updateQty, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const freeShippingThreshold = 1499;
  const progressToFreeShipping = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'ROYALTIYA' || promoCode.trim().toUpperCase() === 'FESTIVE') {
      setPromoApplied(true);
      toast.success('Royal coupon applied! Complimentary handloom pouch added.');
    } else {
      toast.error('Invalid coupon code. Try "ROYALTIYA"');
    }
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      toast('Please sign in or create an account to complete your royal order.', { icon: '👑' });
      router.push('/login?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-gold-400/40">
          <ShoppingBag className="w-10 h-10 text-gold-600" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-maroon-900">Your Royal Bag is Empty</h1>
        <p className="text-sm text-charcoal-muted mt-2 max-w-sm mx-auto">
          Explore our generational handlooms, Banarasi silks, and temple jewels to grace your celebrations.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-maroon-700 to-maroon-600 hover:from-maroon-800 hover:to-maroon-700 text-cream-100 font-bold text-sm uppercase tracking-wider rounded-xl shadow-royal transition-all"
        >
          Explore Handcrafted Creations <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-maroon-900 mb-2">
        Shopping Bag
      </h1>
      <p className="text-xs text-charcoal-muted uppercase tracking-wider font-semibold mb-8">
        Review your handcrafted selections &bull; {items.length} unique item{items.length > 1 ? 's' : ''}
      </p>

      {/* Free Shipping Progress Indicator */}
      <div className="bg-white p-4 rounded-xl border border-cream-400 mb-8 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="flex items-center gap-1.5 text-maroon-700">
            <Truck className="w-4 h-4 text-gold-600" />
            {subtotal >= freeShippingThreshold ? (
              <strong className="text-green-700">Congratulations! You have unlocked Complimentary Express Shipping!</strong>
            ) : (
              <span>
                Add <strong>&#8377;{(freeShippingThreshold - subtotal).toLocaleString('en-IN')}</strong> more to unlock Free Express Shipping
              </span>
            )}
          </span>
          <span className="text-charcoal-muted">{progressToFreeShipping}%</span>
        </div>
        <div className="w-full bg-cream-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-gold-500 to-maroon-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressToFreeShipping}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left: Items Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-cream-400 shadow-sm overflow-hidden divide-y divide-cream-300">
            {items.map((item) => {
              const product = item.productId;
              if (!product) return null;
              const effectivePrice =
                product.discountPrice && product.discountPrice < product.price
                  ? product.discountPrice
                  : product.price;

              return (
                <div key={product._id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
                  {/* Thumbnail & Title */}
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/product/${product.slug}`}
                      className="relative w-20 h-24 rounded-lg overflow-hidden bg-cream-100 flex-shrink-0 border border-cream-300"
                    >
                      <Image
                        src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300'}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </Link>

                    <div>
                      <span className="text-[10px] font-bold text-gold-600 uppercase tracking-widest block">
                        {product.category}
                      </span>
                      <Link
                        href={`/product/${product.slug}`}
                        className="font-serif text-base font-semibold text-charcoal hover:text-maroon-600 line-clamp-1 transition-colors"
                      >
                        {product.name}
                      </Link>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm font-bold text-maroon-700">
                          &#8377;{effectivePrice.toLocaleString('en-IN')}
                        </span>
                        {product.discountPrice && product.discountPrice < product.price && (
                          <span className="text-xs text-charcoal-muted line-through">
                            &#8377;{product.price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Item Subtotal */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                    {/* Qty Selector */}
                    <div className="flex items-center border border-cream-400 bg-cream-50 rounded-lg">
                      <button
                        onClick={() => updateQty(product._id, item.qty - 1)}
                        className="p-1.5 hover:bg-cream-200 text-charcoal"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-charcoal">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(product._id, item.qty + 1)}
                        disabled={item.qty >= product.stock}
                        className="p-1.5 hover:bg-cream-200 disabled:opacity-30 text-charcoal"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right min-w-[80px]">
                      <span className="text-sm font-bold text-charcoal block">
                        &#8377;{(effectivePrice * item.qty).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromCart(product._id)}
                      className="p-2 text-charcoal-muted hover:text-red-600 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Link
              href="/shop"
              className="text-xs font-semibold text-maroon-600 hover:underline flex items-center gap-1"
            >
              &larr; Continue Shopping
            </Link>
            <button
              onClick={clearCart}
              className="text-xs text-red-600 hover:underline"
            >
              Empty Bag
            </button>
          </div>
        </div>

        {/* Right: Order Summary Card */}
        <div className="bg-white p-6 rounded-2xl border border-cream-400 shadow-sm space-y-6">
          <h2 className="font-serif text-xl font-bold text-maroon-900 border-b border-cream-300 pb-3">
            Bag Summary
          </h2>

          {/* Pricing Breakdown */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-charcoal-light">
              <span>Bag Subtotal</span>
              <span className="font-semibold text-charcoal">&#8377;{subtotal.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between text-charcoal-light">
              <span>Estimated Shipping</span>
              <span className="font-semibold text-charcoal">
                {shippingFee === 0 ? <strong className="text-green-700">FREE</strong> : `₹${shippingFee}`}
              </span>
            </div>

            {promoApplied && (
              <div className="flex justify-between text-gold-700 text-xs font-semibold">
                <span>Festive Perk</span>
                <span>Complimentary Velvet Pouch</span>
              </div>
            )}

            <div className="pt-3 border-t border-cream-300 flex justify-between text-base font-bold text-maroon-900">
              <span>Estimated Total</span>
              <span className="font-serif text-xl text-maroon-600">&#8377;{total.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[11px] text-charcoal-muted text-right">Inclusive of all taxes &amp; duties</p>
          </div>

          {/* Coupon Input */}
          <form onSubmit={handleApplyPromo} className="flex gap-2">
            <input
              type="text"
              placeholder="Promo Code (e.g. ROYALTIYA)"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="px-3 py-2 bg-cream-50 border border-cream-400 rounded-lg text-xs uppercase font-medium flex-grow focus:outline-none focus:ring-1 focus:ring-maroon-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-cream-200 hover:bg-cream-300 text-maroon-800 text-xs font-bold rounded-lg transition-colors"
            >
              Apply
            </button>
          </form>

          {/* Checkout Button */}
          <button
            onClick={handleProceedToCheckout}
            className="w-full py-4 bg-gradient-to-r from-maroon-700 to-maroon-600 hover:from-maroon-800 hover:to-maroon-700 text-cream-100 font-bold text-sm uppercase tracking-wider rounded-xl shadow-royal hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Proceed to Checkout
            <ArrowRight className="w-4 h-4 text-gold-400" />
          </button>

          <div className="pt-2 text-center text-xs text-charcoal-muted flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-gold-600" /> Secure 256-Bit Encrypted Checkout
          </div>
        </div>
      </div>
    </div>
  );
}

