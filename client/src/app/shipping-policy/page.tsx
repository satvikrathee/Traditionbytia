import React from 'react';

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-8">
      <div className="text-center">
        <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600 block mb-1">
          Concierge Services
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-maroon-900">
          Shipping &amp; Refund Policy
        </h1>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-cream-400 shadow-sm space-y-6 text-sm text-charcoal-light leading-relaxed">
        <section>
          <h2 className="font-serif text-lg font-bold text-maroon-800 mb-2">
            1. Domestic Shipping Across India
          </h2>
          <p>
            Traditions By Tiya provides <strong>Complimentary Express Delivery</strong> on all orders with a cart value equal to or exceeding &#8377;1,499. For orders below &#8377;1,499, a nominal express handling and packaging fee of &#8377;99 applies.
          </p>
          <p className="mt-2">
            In-stock items are dispatched within 24 to 48 business hours from our Karnal Atelier via premier air couriers (BlueDart, Delhivery Express, DTDC Premium). Metros receive shipments within 2-4 business days; all other pin codes within 4-6 business days.
          </p>
        </section>

        <section id="returns">
          <h2 className="font-serif text-lg font-bold text-maroon-800 mb-2">
            2. 7-Day Royal Exchange &amp; Return Guarantee
          </h2>
          <p>
            Because we celebrate true artisan craftsmanship, each piece undergoes a 3-tier quality inspection before dispatch. If you are not completely enchanted by your creation, you may initiate an exchange or return within <strong>7 days</strong> of delivery.
          </p>
          <p className="mt-2">
            Items must be in unworn, unwashed condition with original tags, handloom certificate, and brass seals intact.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg font-bold text-maroon-800 mb-2">
            3. Cash on Delivery (COD) Guidelines
          </h2>
          <p>
            COD is available for eligible pincodes across India. Cash must be tendered directly to the courier executive upon delivery. For high-value heirloom bridal orders exceeding &#8377;50,000, our concierge may call to verify delivery availability.
          </p>
        </section>
      </div>
    </div>
  );
}

