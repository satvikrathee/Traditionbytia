'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    toast.success('Your enquiry has reached the Royal Atelier. We will respond within 24 hours.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600 block mb-1">
          Client Concierge
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-maroon-900">
          Connect With Our Atelier
        </h1>
        <p className="text-sm text-charcoal-light mt-2">
          For custom bridal consultations, heirloom appointments, or order enquiries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Contact Info */}
        <div className="bg-white p-8 rounded-3xl border border-cream-400 shadow-sm space-y-8">
          <div>
            <h3 className="font-serif text-xl font-bold text-maroon-900 mb-2">
              Karnal Heritage Atelier
            </h3>
            <p className="text-sm text-charcoal-light leading-relaxed">
              Step into our royal studio in Karnal, Haryana to experience our authentic handcrafted weaves, bridal couture, and bespoke ethnic curations.
            </p>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gold-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="block text-charcoal">Traditions By Tiya HQ</strong>
                <span className="text-charcoal-muted">Karnal, Haryana, India</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gold-600 flex-shrink-0" />
              <div>
                <strong className="block text-charcoal">Telephone &amp; WhatsApp</strong>
                <a href="tel:+918708305992" className="text-charcoal-muted hover:text-maroon-600 transition-colors">
                  +91 8708305992 (Mon &ndash; Sat, 10 AM &ndash; 7 PM IST)
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gold-600 flex-shrink-0" />
              <div>
                <strong className="block text-charcoal">Electronic Mail</strong>
                <a href="mailto:traditionbytia@gmail.com" className="text-charcoal-muted hover:text-maroon-600 transition-colors">
                  traditionbytia@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <div className="bg-white p-8 rounded-3xl border border-cream-400 shadow-sm">
          {sent ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
              <h3 className="font-serif text-2xl font-bold text-maroon-900">Enquiry Received</h3>
              <p className="text-sm text-charcoal-muted max-w-xs mx-auto">
                Thank you, {name}. Our royal concierge representative will contact you via email shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-maroon-500"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-maroon-500"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-maroon-500"
                  placeholder="Enter contact number"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-1">
                  Message / Custom Enquiry *
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-maroon-500"
                  placeholder="Tell us about the piece or celebration you are preparing for..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-maroon-700 to-maroon-600 hover:from-maroon-800 hover:to-maroon-700 text-cream-100 font-bold text-xs uppercase tracking-wider rounded-xl shadow-royal transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4 text-gold-400" />
                Dispatch Enquiry
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

