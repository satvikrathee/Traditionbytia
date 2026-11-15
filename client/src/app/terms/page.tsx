import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-8">
      <div className="text-center">
        <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600 block mb-1">
          Legal Concordat
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-maroon-900">
          Terms &amp; Conditions
        </h1>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-cream-400 shadow-sm space-y-6 text-sm text-charcoal-light leading-relaxed">
        <section>
          <h2 className="font-serif text-lg font-bold text-maroon-800 mb-2">1. Authenticity &amp; Handcraft Nuance</h2>
          <p>
            Traditions By Tiya products are authentic handcrafted works of art. Variations in weave texture, zari patina, and slight natural vegetable dye slubs are hallmarks of true handloom weaving and are not defects.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg font-bold text-maroon-800 mb-2">2. Pricing &amp; Checkout Security</h2>
          <p>
            All prices are denominated in Indian Rupees (INR) and are inclusive of Goods &amp; Services Tax (GST). Prices displayed in your final order summary are strictly recomputed and verified by our backend server against live catalog values.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg font-bold text-maroon-800 mb-2">3. Intellectual Property</h2>
          <p>
            All custom designs, typography, brand wordmarks, photography, and texts are the exclusive intellectual property of Traditions By Tiya.
          </p>
        </section>
      </div>
    </div>
  );
}

