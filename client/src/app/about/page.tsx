import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MandalaDivider } from '../../components/common/MandalaDivider';
import { Award, Heart, ShieldCheck, Sparkles } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-16 py-12 md:py-20">
      {/* Hero Header */}
      <div className="max-w-4xl mx-auto px-4 text-center">
        <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600 block mb-2">
          Living Heritage &bull; Timeless Soul
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-maroon-900">
          The Traditions By Tiya Story
        </h1>
        <MandalaDivider className="my-6" />
        <p className="text-base sm:text-lg text-charcoal-light leading-relaxed font-light">
          Born out of reverence for the intricate looms of Varanasi, the temple goldsmiths of Thanjavur, and the needlepoint masters of Kashmir, Traditions By Tiya was founded to bring authentic Indian royal craft directly to celebrants worldwide.
        </p>
      </div>

      {/* Philosophy Pillars */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-cream-400 shadow-sm text-center">
            <div className="w-14 h-14 bg-cream-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-maroon-600 border border-gold-400/30">
              <Award className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-maroon-900 mb-3">
              Generational Weavers
            </h3>
            <p className="text-sm text-charcoal-light leading-relaxed">
              We work directly with weaver families in Varanasi and Kanchipuram who have preserved kadwa and korvai techniques across seven generations.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-cream-400 shadow-sm text-center">
            <div className="w-14 h-14 bg-cream-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-maroon-600 border border-gold-400/30">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-maroon-900 mb-3">
              100% Pure Certified Silk
            </h3>
            <p className="text-sm text-charcoal-light leading-relaxed">
              Every saree and dupatta is tested for authentic mulberry and tussar silk purity, woven with certified silver and antique gold zari threads.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-cream-400 shadow-sm text-center">
            <div className="w-14 h-14 bg-cream-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-maroon-600 border border-gold-400/30">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-maroon-900 mb-3">
              Fair Artisan Prosperity
            </h3>
            <p className="text-sm text-charcoal-light leading-relaxed">
              By eliminating intermediary traders, we ensure direct dignity, health benefits, and prosperity for our loom masters and embroiderers.
            </p>
          </div>
        </div>
      </div>

      {/* Founder's Note */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-cream-100/70 p-8 sm:p-12 rounded-3xl border border-gold-500/30 flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-gold-400 flex-shrink-0 shadow-royal">
            <Image
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80"
              alt="Misha Sandhu - Founder"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-gold-700 block mb-1">
              Founder &amp; Creative Director
            </span>
            <h2 className="font-serif text-2xl font-bold text-maroon-900">
              &ldquo;Tradition is not the preservation of ashes, but the passing of fire.&rdquo;
            </h2>
            <p className="text-sm text-charcoal-light mt-4 leading-relaxed">
              Growing up surrounded by our heirloom weaves, artisanal embroidery, and royal temple jewellery, I realised our Indian heritage is not merely fashion; it is our civilisational identity. Traditions By Tiya is a celebration of that royal splendour.
            </p>
            <p className="mt-4 font-serif font-bold text-maroon-800 text-sm">
              &mdash; Misha Sandhu, Founder &amp; Curator
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

