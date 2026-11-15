'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, Phone, MapPin, CheckCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export const Footer: React.FC = () => {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSubscribed(true);
    toast.success('Welcome to the Traditions By Tiya royal inner circle!');
    setEmail('');
  };

  return (
    <footer className="bg-gradient-to-b from-maroon-800 via-maroon-900 to-[#1e050c] text-cream-200 border-t-2 border-gold-500/40">
      {/* Newsletter Section */}
      <div className="border-b border-maroon-700/60 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-gold-400 text-xs uppercase tracking-[0.3em] font-semibold block mb-2">
            The Royal Gazette
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-cream-100">
            Subscribe to Heritage Invitations &amp; Private Previews
          </h2>
          <p className="mt-2 text-sm text-cream-400 max-w-xl mx-auto">
            Be the first to discover limited artisan drops, rare handloom weaves, and celebratory festive curations.
          </p>

          <form onSubmit={handleSubscribe} className="mt-6 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="px-4 py-3 bg-maroon-950/60 border border-gold-500/40 rounded-lg text-sm text-cream-100 placeholder-cream-400/60 focus:outline-none focus:ring-2 focus:ring-gold-500 flex-grow"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-maroon-950 font-bold text-sm rounded-lg transition-all shadow-gold hover:shadow-lg whitespace-nowrap"
            >
              Join Gazette
            </button>
          </form>
          {subscribed && (
            <p className="mt-3 text-xs text-gold-300 flex items-center justify-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> You are subscribed to Traditions By Tiya Gazette.
            </p>
          )}
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="font-serif text-2xl font-bold tracking-wider text-cream-100">Traditions</span>
              <span className="font-serif text-lg italic text-gold-400 mx-1">By</span>
              <span className="font-serif text-2xl font-bold tracking-wider text-cream-100">Tiya</span>
            </Link>
            <p className="text-sm text-cream-400 leading-relaxed max-w-sm mb-6">
              Dedicated to celebrating India's rich handloom traditions, generational crafts, and timeless royal silhouettes. Hand-embroidered and woven with love across Banaras, Kanchipuram, Kashmir, and Rajasthan.
            </p>
            <div className="flex items-center gap-4 text-xs text-gold-300">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-gold-400" /> 100% Authentic Handcraft</span>
              <span>&bull;</span>
              <span>Direct Weaver Fair Trade</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif text-base font-semibold text-gold-400 mb-4 tracking-wider uppercase text-xs">
              Handcrafted Treasures
            </h3>
            <ul className="space-y-2.5 text-sm text-cream-300">
              <li>
                <Link href="/shop" className="hover:text-gold-300 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Lehengas+%26+Kurtas" className="hover:text-gold-300 transition-colors">
                  Handcrafted Apparel
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Heritage+Jewellery" className="hover:text-gold-300 transition-colors">
                  Heritage Jewellery
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Handloom+Dupattas" className="hover:text-gold-300 transition-colors">
                  Handloom Stoles &amp; Shawls
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="font-serif text-base font-semibold text-gold-400 mb-4 tracking-wider uppercase text-xs">
              Client Concierge
            </h3>
            <ul className="space-y-2.5 text-sm text-cream-300">
              <li>
                <Link href="/orders" className="hover:text-gold-300 transition-colors">
                  Track My Order
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-gold-300 transition-colors">
                  Shipping &amp; Delivery
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy#returns" className="hover:text-gold-300 transition-colors">
                  Returns &amp; Exchanges
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-gold-300 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-gold-300 transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Boutique */}
          <div>
            <h3 className="font-serif text-base font-semibold text-gold-400 mb-4 tracking-wider uppercase text-xs">
              Heritage Atelier
            </h3>
            <ul className="space-y-3 text-sm text-cream-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gold-400 mt-1 flex-shrink-0" />
                <span>Karnal, Haryana, India</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <a href="tel:+918708305992" className="hover:text-gold-300 transition-colors">+91 8708305992</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <a href="mailto:traditionbytia@gmail.com" className="hover:text-gold-300 transition-colors">traditionbytia@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-maroon-700/60 flex flex-col md:flex-row items-center justify-between text-xs text-cream-400 gap-4">
          <p>&copy; {new Date().getFullYear()} Traditions By Tiya. All Royal Rights Reserved.</p>
          <div className="flex items-center gap-3">
            <span className="text-gold-400/80">Accepted Payments:</span>
            <span className="bg-maroon-950 px-2 py-1 rounded border border-gold-500/20 text-cream-200 font-semibold">UPI (GPay / PhonePe / Paytm)</span>
            <span className="bg-maroon-950 px-2 py-1 rounded border border-gold-500/20 text-cream-200 font-semibold">Razorpay</span>
            <span className="bg-maroon-950 px-2 py-1 rounded border border-gold-500/20 text-cream-200 font-semibold">Cash On Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

