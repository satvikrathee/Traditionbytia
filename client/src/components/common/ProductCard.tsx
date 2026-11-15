'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { ShoppingBag, Star, Eye } from 'lucide-react';

interface Props {
  product: Product;
}

export const ProductCard: React.FC<Props> = ({ product }) => {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const effectivePrice =
    product.discountPrice && product.discountPrice < product.price
      ? product.discountPrice
      : product.price;

  const discountPercent =
    product.discountPrice && product.discountPrice < product.price
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock < 1) return;
    setIsAdding(true);
    await addToCart(product, 1);
    setTimeout(() => setIsAdding(false), 600);
  };

  const mainImage = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600';
  const secondaryImage = product.images?.[1]?.url || mainImage;

  return (
    <div className="group relative bg-white rounded-2xl border border-cream-400 overflow-hidden shadow-sm hover:shadow-royal-lg hover:border-gold-500/50 hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full">
      {/* Image Container */}
      <Link href={`/product/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-cream-100">
        <Image
          src={mainImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-110"
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex flex-col gap-1 z-10">
          {discountPercent > 0 && (
            <span className="bg-maroon-600/95 text-cream-100 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm tracking-wider uppercase backdrop-blur-xs">
              {discountPercent}% OFF
            </span>
          )}
          {product.isNewArrival && (
            <span className="bg-gradient-to-r from-gold-600 to-gold-500 text-maroon-950 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm tracking-wider uppercase">
              New Arrival
            </span>
          )}
        </div>

        {/* Live Stock Indicators */}
        {product.stock === 0 ? (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-20">
            <span className="bg-red-700 text-white text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md">
              Out of Stock
            </span>
          </div>
        ) : product.stock <= 5 ? (
          <div className="absolute bottom-2.5 left-2.5 z-10">
            <span className="bg-amber-600/90 text-white text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
              Only {product.stock} left
            </span>
          </div>
        ) : null}

        {/* Quick View Hover overlay button */}
        <div className="absolute inset-0 bg-maroon-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <span className="bg-white/95 text-maroon-800 p-2.5 rounded-full shadow-lg hover:bg-maroon-600 hover:text-white transition-colors duration-200 transform scale-90 group-hover:scale-100">
            <Eye className="w-4 h-4" />
          </span>
        </div>
      </Link>

      {/* Details */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow justify-between">
        <div>
          <span className="text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase text-gold-600 block mb-1">
            {product.category}
          </span>
          <Link href={`/product/${product.slug}`} className="block">
            <h3 className="font-serif text-xs sm:text-sm md:text-base font-semibold text-charcoal group-hover:text-maroon-600 line-clamp-1 transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-1 text-[11px] sm:text-xs text-charcoal-muted">
            <div className="flex items-center text-amber-500">
              <Star className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current" />
            </div>
            <span className="font-medium text-charcoal">{product.rating || 4.9}</span>
            <span>({product.numReviews || 12})</span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="mt-3 pt-2.5 sm:mt-4 sm:pt-3 border-t border-cream-300 flex items-center justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1.5">
              <span className="font-serif text-sm sm:text-base md:text-lg font-bold text-maroon-700">
                &#8377;{effectivePrice.toLocaleString('en-IN')}
              </span>
              {product.discountPrice && product.discountPrice < product.price && (
                <span className="text-[10px] sm:text-xs text-charcoal-muted line-through">
                  &#8377;{product.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || isAdding}
            className={`p-2 sm:p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-center ${
              product.stock === 0
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-cream-100 hover:bg-maroon-600 text-maroon-700 hover:text-white border-gold-400/50 shadow-sm active:scale-95'
            }`}
            title={product.stock === 0 ? 'Out of stock' : 'Add to cart'}
          >
            <ShoppingBag className={`w-3.5 sm:w-4 h-3.5 sm:h-4 ${isAdding ? 'animate-bounce' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

