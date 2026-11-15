'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product, Review } from '../types';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import { ProductCard } from '../components/common/ProductCard';
import { MandalaDivider } from '../components/common/MandalaDivider';
import { ProductSkeleton } from '../components/common/SkeletonLoader';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Gem,
  Award,
  Star,
  Quote,
} from 'lucide-react';

export default function HomePage() {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchFeaturedProducts = async () => {
    try {
      const [arrivalsRes, bestRes, reviewsRes] = await Promise.all([
        api.get('/products?isNewArrival=true&limit=4'),
        api.get('/products?isBestSeller=true&limit=4'),
        api.get('/reviews/recent').catch(() => ({ success: false, reviews: [] })),
      ]);

      if (arrivalsRes.success) setNewArrivals(arrivalsRes.products);
      if (bestRes.success) setBestSellers(bestRes.products);
      if (reviewsRes.success && reviewsRes.reviews?.length > 0) {
        setRecentReviews(reviewsRes.reviews);
      }
    } catch (err) {
      console.error('Failed to load home products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedProducts();

    // Listen to real-time product updates via Socket.io
    const socket = getSocket();
    const handleProductUpdate = (data: { product: Product; changeType: string }) => {
      setNewArrivals((prev) =>
        prev.map((p) => (p._id === data.product._id ? { ...p, ...data.product } : p))
      );
      setBestSellers((prev) =>
        prev.map((p) => (p._id === data.product._id ? { ...p, ...data.product } : p))
      );
    };

    socket.on('product:updated', handleProductUpdate);
    return () => {
      socket.off('product:updated', handleProductUpdate);
    };
  }, []);

  const categories = [
    {
      title: 'Festive Ensembles',
      subtitle: 'Hand-tailored Traditional Silhouettes',
      image: 'https://images.unsplash.com/photo-1546804784-896d0dca3805?auto=format&fit=crop&w=800&q=80',
      href: '/shop?category=Festive+Ensembles',
    },
    {
      title: 'Lehengas & Kurtas',
      subtitle: 'Zardozi Velvet & Chikankari Sets',
      image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80',
      href: '/shop?category=Lehengas+%26+Kurtas',
    },
    {
      title: 'Heritage Jewellery',
      subtitle: 'Temple 22K Gold & Jadau Kundan',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
      href: '/shop?category=Heritage+Jewellery',
    },
    {
      title: 'Handloom Shawls',
      subtitle: 'Kashmiri Sozni Pashmina & Stoles',
      image: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=800&q=80',
      href: '/shop?category=Handloom+Dupattas',
    },
  ];

  const testimonials = [
    {
      name: 'Radhika Singhania',
      city: 'Udaipur',
      review: 'The handcrafted wedding attire and jewellery I ordered for my celebration left everyone in awe. The intricate craftsmanship, authentic quality, and master finishing are truly reminiscent of royal dynasties.',
      product: 'Royal Crimson Bridal Ensemble',
      rating: 5,
    },
    {
      name: 'Dr. Meera Iyer',
      city: 'Bengaluru',
      review: 'Traditions By Tiya delivers what pure heritage stores in old markets do, but with seamless express delivery. The real-time tracking and WhatsApp updates gave me utter peace of mind.',
      product: 'Antique Temple Choker Set',
      rating: 5,
    },
    {
      name: 'Ananya Deshmukh',
      city: 'Mumbai',
      review: 'The Pashmina shawl feels like a second skin. Knowing it is authentic handloom directly preserving artisan families makes wearing it so special.',
      product: 'Kashmiri Sozni Pashmina',
      rating: 5,
    },
  ];

  return (
    <div className="space-y-16 md:space-y-24 pb-16">
      {/* Hero Section - Royal Heritage Couture (Saree Background Completely Removed) */}
      <section className="relative min-h-[620px] lg:min-h-[720px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#300612] via-[#521225] to-[#1a0309]">
        {/* Royal Decorative Lighting & Gold Glows */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(201,162,75,0.22)_0%,transparent_70%)] blur-2xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[radial-gradient(circle,rgba(123,30,58,0.5)_0%,transparent_70%)] blur-3xl" />
          <div className="absolute top-1/3 -right-24 w-96 h-96 bg-[radial-gradient(circle,rgba(201,162,75,0.18)_0%,transparent_70%)] blur-3xl" />

          {/* Elegant Geometric Pattern Texture */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(#C9A24B 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Royal Corner Filigree / Mandala Ornaments */}
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full border border-gold-500/15 opacity-40 animate-spin" style={{ animationDuration: '90s' }}>
            <div className="w-full h-full rounded-full border-2 border-dashed border-gold-400/20" />
          </div>
          <div className="absolute -bottom-28 -right-28 w-96 h-96 rounded-full border border-gold-500/15 opacity-40 animate-spin" style={{ animationDuration: '120s', animationDirection: 'reverse' }}>
            <div className="w-full h-full rounded-full border-2 border-dashed border-gold-400/20" />
          </div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Headline & Action Column */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/15 border border-gold-400/40 text-gold-300 text-xs font-semibold uppercase tracking-[0.25em] backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                Handcrafted In India &bull; Karnal Atelier
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-cream-100 tracking-tight leading-[1.12]">
                Where Royal Heritage <br />
                <span className="italic font-normal text-gold-400">Meets Modern Grace</span>
              </h1>

              <p className="text-base sm:text-lg text-cream-300 max-w-2xl mx-auto lg:mx-0 font-light leading-relaxed">
                Curated festive couture, authentic hand-embroidered ensembles, pure silver-gold jewellery, and bespoke royal heirlooms crafted for celebrations that become legends.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <Link
                  href="/shop"
                  className="shimmer-sweep w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-maroon-950 font-bold text-sm uppercase tracking-widest rounded-xl shadow-gold hover:shadow-gold-lg transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  Explore All Products
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/about"
                  className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-cream-100 border border-gold-400/40 font-semibold text-sm uppercase tracking-widest rounded-xl backdrop-blur-sm transition-all duration-300 text-center hover:-translate-y-0.5"
                >
                  Our Heritage Story
                </Link>
              </div>

              {/* Trust & Social Proof Strip */}
              <div className="pt-6 border-t border-maroon-700/50 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-cream-300">
                <div className="flex items-center gap-1 text-gold-400 font-semibold">
                  <span>&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                  <span className="text-cream-100 ml-1">4.9/5 Rating</span>
                </div>
                <span className="text-maroon-600 hidden sm:inline">&bull;</span>
                <span>1,200+ Royal Patrons Across India</span>
                <span className="text-maroon-600 hidden sm:inline">&bull;</span>
                <span className="text-gold-300">Complimentary Insured Delivery</span>
              </div>
            </div>

            {/* Right Showcase Card Column */}
            <div className="lg:col-span-5 flex justify-center animate-float">
              <div className="relative w-full max-w-md">
                {/* Glowing Backdrop Border */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-gold-500/40 via-maroon-500/30 to-gold-600/40 blur-lg opacity-70" />

                {/* Royal Feature Card */}
                <div className="relative bg-[#2d0712]/90 border border-gold-500/40 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl text-cream-100 space-y-6">
                  {/* Top Badge */}
                  <div className="flex items-center justify-between border-b border-gold-500/20 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-green-300">Live Telemetry Active</span>
                    </div>
                    <span className="text-xs font-serif italic text-gold-400">Authentic Guild</span>
                  </div>

                  {/* Highlights Grid */}
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-maroon-900/60 border border-gold-500/20 flex items-center gap-3.5 hover:border-gold-500/50 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-400/30 flex items-center justify-center text-gold-400 flex-shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-cream-100">Direct-From-Weavers</h4>
                        <p className="text-xs text-cream-300/80">Generational Indian craftsmanship without intermediaries</p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-maroon-900/60 border border-gold-500/20 flex items-center gap-3.5 hover:border-gold-500/50 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-400/30 flex items-center justify-center text-gold-400 flex-shrink-0">
                        <Gem className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-cream-100">Pure Silver &amp; Gold Zari</h4>
                        <p className="text-xs text-cream-300/80">Certified metals &amp; authentic heritage fabrics</p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-maroon-900/60 border border-gold-500/20 flex items-center gap-3.5 hover:border-gold-500/50 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-400/30 flex items-center justify-center text-gold-400 flex-shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-cream-100">Insured Pan-India Express</h4>
                        <p className="text-xs text-cream-300/80">Secure dispatch with live courier tracking &amp; COD</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Link */}
                  <div className="pt-2">
                    <Link
                      href="/shop"
                      className="w-full py-3 bg-gradient-to-r from-gold-500/20 to-gold-600/30 hover:from-gold-500/30 hover:to-gold-600/40 border border-gold-400/50 rounded-xl text-center text-xs uppercase font-bold tracking-wider text-gold-300 flex items-center justify-center gap-2 transition-all block"
                    >
                      Browse Handcrafted Treasures &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 bg-white p-5 sm:p-8 rounded-3xl border border-cream-400 shadow-sm hover:shadow-royal transition-all duration-300">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cream-200 border border-gold-400/30 flex items-center justify-center text-maroon-600 flex-shrink-0">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-charcoal">Free Express Delivery</h4>
              <p className="text-[10px] sm:text-xs text-charcoal-muted mt-0.5">On orders above &#8377;1,499</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cream-200 border border-gold-400/30 flex items-center justify-center text-maroon-600 flex-shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-charcoal">100% Handloom Certified</h4>
              <p className="text-[10px] sm:text-xs text-charcoal-muted mt-0.5">Authentic artisan certification</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cream-200 border border-gold-400/30 flex items-center justify-center text-maroon-600 flex-shrink-0">
              <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-charcoal">7-Day Easy Returns</h4>
              <p className="text-[10px] sm:text-xs text-charcoal-muted mt-0.5">Hassle-free luxury concierge</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cream-200 border border-gold-400/30 flex items-center justify-center text-maroon-600 flex-shrink-0">
              <Gem className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-charcoal">Direct UPI &amp; COD</h4>
              <p className="text-[10px] sm:text-xs text-charcoal-muted mt-0.5">Zero fee &amp; doorstep cash</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600">Curated Portfolios</span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-maroon-800 mt-1">
            Shop by Royal Tradition
          </h2>
          <MandalaDivider className="my-4" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.title}
              href={cat.href}
              className="group relative h-96 rounded-2xl overflow-hidden shadow-card border border-cream-400 block"
            >
              <Image
                src={cat.image}
                alt={cat.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-maroon-950 via-maroon-900/40 to-transparent group-hover:via-maroon-900/50 transition-colors" />

              <div className="absolute bottom-6 left-6 right-6 text-cream-100">
                <span className="text-[11px] uppercase tracking-wider text-gold-400 font-semibold block mb-1">
                  Heritage Craft
                </span>
                <h3 className="font-serif text-xl font-bold group-hover:text-gold-300 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-cream-300 mt-1 line-clamp-1">{cat.subtitle}</p>
                <span className="inline-flex items-center gap-1.5 text-xs text-gold-400 font-semibold mt-3 group-hover:translate-x-1 transition-transform">
                  Explore Weaves <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600">Fresh From Artisanal Looms</span>
            <h2 className="font-serif text-3xl font-bold text-maroon-800 mt-1">
              New Arrivals
            </h2>
          </div>
          <Link
            href="/shop?isNewArrival=true"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-maroon-600 hover:text-maroon-700 group"
          >
            View All New Creations <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Artisan Spotlight Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-maroon-900 via-maroon-800 to-maroon-950 text-cream-100 p-8 md:p-14 border border-gold-500/30">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-gold-400 font-bold mb-3">
              <Award className="w-4 h-4" /> Generational Heritage
            </span>
            <h3 className="font-serif text-3xl md:text-4xl font-bold leading-tight">
              Honouring Generational Indian Artisans &amp; Craft Masters
            </h3>
            <p className="mt-4 text-sm sm:text-base text-cream-300 leading-relaxed font-light">
              Each handcrafted creation takes weeks of dedicated hand-embroidery, metal carving, and loom manipulation. When you choose Traditions By Tiya, you celebrate authentic living traditions preserved across generations.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/about"
                className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-maroon-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-gold hover:shadow-lg transition-all"
              >
                Meet the Artisans
              </Link>
              <Link
                href="/shop"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-gold-400/40 text-cream-100 font-semibold text-xs uppercase tracking-wider rounded-lg backdrop-blur-sm transition-all"
              >
                Browse Heirloom Pieces
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600">Beloved by Connoisseurs</span>
            <h2 className="font-serif text-3xl font-bold text-maroon-800 mt-1">
              Timeless Best Sellers
            </h2>
          </div>
          <Link
            href="/shop?isBestSeller=true"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-maroon-600 hover:text-maroon-700 group"
          >
            Explore Best Sellers <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Customer Reviews & Patron Reflections */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 text-gold-700 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600">
              Patron Reflections &amp; Reviews
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-maroon-800 mt-1">
            Cherished by Royalty &amp; Celebrants
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-2 max-w-xl mx-auto">
            Discover real experiences from patrons who adorn our hand-embroidered silks and generational jewellery.
          </p>
          <MandalaDivider className="my-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {recentReviews.length > 0
            ? recentReviews.slice(0, 6).map((rev) => (
                <div
                  key={rev._id}
                  className="bg-white p-7 rounded-3xl border border-cream-400 shadow-sm hover:shadow-royal transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1 text-gold-500">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-gold-400 text-gold-400" />
                        ))}
                      </div>
                      {rev.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-800 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3 text-green-600" />
                          Verified Buyer
                        </span>
                      )}
                    </div>

                    {rev.title && (
                      <h4 className="font-serif text-base font-bold text-maroon-900 mb-2">
                        {rev.title}
                      </h4>
                    )}

                    <p className="text-sm text-charcoal-light italic leading-relaxed">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-cream-300 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-maroon-700 to-maroon-900 text-cream-100 flex items-center justify-center font-bold text-xs shadow-xs">
                      {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div>
                      <h5 className="font-serif text-sm font-bold text-maroon-800">
                        {rev.userName}
                      </h5>
                      <p className="text-xs text-charcoal-muted truncate max-w-[200px]">
                        Bought {rev.productName || 'Artisan Craft'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            : testimonials.map((t, idx) => (
                <div
                  key={idx}
                  className="bg-white p-7 rounded-3xl border border-cream-400 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center text-amber-500 mb-4">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-gold-400 text-gold-400" />
                      ))}
                    </div>
                    <p className="text-sm text-charcoal-light italic leading-relaxed">
                      &ldquo;{t.review}&rdquo;
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-cream-300">
                    <h4 className="font-serif text-base font-bold text-maroon-800">{t.name}</h4>
                    <p className="text-xs text-charcoal-muted">{t.city} &bull; Bought {t.product}</p>
                  </div>
                </div>
              ))}
        </div>
      </section>
    </div>
  );
}

