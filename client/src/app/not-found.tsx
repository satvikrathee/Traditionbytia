import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-12 border border-cream-400 shadow-royal">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-100 text-gold-800 text-[11px] font-bold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" /> Page Not Found
        </div>
        <h1 className="font-serif text-6xl font-bold text-maroon-900 mb-2">404</h1>
        <h2 className="font-serif text-2xl font-bold text-charcoal mb-4">
          A Lost Royal Path
        </h2>
        <p className="text-sm text-charcoal-light leading-relaxed mb-8">
          The creation or page you are seeking may have been archived or belongs to an unwritten chapter.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-maroon-700 to-maroon-600 hover:from-maroon-800 hover:to-maroon-700 text-cream-100 font-bold text-xs uppercase tracking-wider rounded-xl shadow-royal transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-gold-400" /> Return to Courtyard
        </Link>
      </div>
    </div>
  );
}

