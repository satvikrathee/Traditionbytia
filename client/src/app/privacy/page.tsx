import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-8">
      <div className="text-center">
        <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600 block mb-1">
          Confidentiality
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-maroon-900">
          Privacy Policy
        </h1>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-cream-400 shadow-sm space-y-6 text-sm text-charcoal-light leading-relaxed">
        <section>
          <h2 className="font-serif text-lg font-bold text-maroon-800 mb-2">1. Client Data Safeguarding</h2>
          <p>
            Your privacy is guarded with the highest discretion. We collect personal identification information (name, email, phone number, and delivery coordinates) solely to fulfill orders and provide tailored royal service.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg font-bold text-maroon-800 mb-2">2. Payment Security</h2>
          <p>
            We do not store your bank account details, UPI PINs, or credit card numbers on our servers. All online transactions are handled through PCI-DSS Level 1 compliant gateway partners (Razorpay).
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg font-bold text-maroon-800 mb-2">3. Cookies &amp; Sessions</h2>
          <p>
            Secure, httpOnly authentication cookies are utilised to preserve your session state across our storefront and cart securely.
          </p>
        </section>
      </div>
    </div>
  );
}

