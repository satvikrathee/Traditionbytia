'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product } from '../../types';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { ProductCard } from '../../components/common/ProductCard';
import { ProductSkeleton } from '../../components/common/SkeletonLoader';
import { Search, SlidersHorizontal, X, RefreshCw } from 'lucide-react';

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [priceRange, setPriceRange] = useState<number>(50000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  const categories = [
    'All',
    'Festive Ensembles',
    'Lehengas & Kurtas',
    'Heritage Jewellery',
    'Handloom Dupattas',
  ];

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (priceRange < 50000) {
        params.append('maxPrice', priceRange.toString());
      }
      if (inStockOnly) {
        params.append('inStock', 'true');
      }
      if (sortBy) {
        params.append('sort', sortBy);
      }

      const res = await api.get(`/products?${params.toString()}`);
      if (res.success) {
        setProducts(res.products);
      }
    } catch (err) {
      console.error('Error fetching shop products:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, priceRange, inStockOnly, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Real-time stock, price, and product updates
  useEffect(() => {
    const socket = getSocket();

    const handleProductUpdate = (data: { product: Product; changeType: string }) => {
      setProducts((prev) =>
        prev.map((p) => (p._id === data.product._id ? { ...p, ...data.product } : p))
      );
    };

    const handleInventoryUpdate = (data: {
      productId: string;
      stock: number;
      price?: number;
      discountPrice?: number;
    }) => {
      setProducts((prev) =>
        prev.map((p) => {
          if (p._id === data.productId) {
            return {
              ...p,
              stock: data.stock,
              ...(data.price !== undefined ? { price: data.price } : {}),
              ...(data.discountPrice !== undefined ? { discountPrice: data.discountPrice } : {}),
            };
          }
          return p;
        })
      );
    };

    socket.on('product:updated', handleProductUpdate);
    socket.on('inventory:updated', handleInventoryUpdate);

    return () => {
      socket.off('product:updated', handleProductUpdate);
      socket.off('inventory:updated', handleInventoryUpdate);
    };
  }, []);

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setPriceRange(50000);
    setInStockOnly(false);
    setSortBy('featured');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600">The Royal Collection</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-maroon-800 mt-1">
          All Handcrafted Products
        </h1>
        <p className="text-sm text-charcoal-light mt-2">
          Discover our curated selection of authentic traditional creations, ethnic ensembles, and temple treasures.
        </p>
      </div>

      {/* Main Grid: Filters + Catalog */}
      <div className="lg:grid lg:grid-cols-4 lg:gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block bg-white p-6 rounded-2xl border border-cream-400 shadow-sm sticky top-28 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-cream-300">
            <h3 className="font-serif text-lg font-bold text-maroon-800 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-gold-600" /> Filters
            </h3>
            <button
              onClick={clearAllFilters}
              className="text-xs text-maroon-600 hover:underline flex items-center gap-1 font-medium"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Search inside shop */}
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-2">
              Search Products
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-cream-100 border border-cream-400 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-maroon-500"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-charcoal-muted" />
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-2">
              Categories
            </label>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === cat
                      ? 'bg-maroon-50 text-maroon-600 font-bold border-l-4 border-maroon-500'
                      : 'text-charcoal hover:bg-cream-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted">
                Max Price
              </label>
              <span className="text-xs font-bold text-maroon-600">
                &#8377;{priceRange.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min="2000"
              max="50000"
              step="1000"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-maroon-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-charcoal-muted mt-1">
              <span>&#8377;2,000</span>
              <span>&#8377;50,000+</span>
            </div>
          </div>

          {/* In Stock Only Toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded text-maroon-600 focus:ring-maroon-500 w-4 h-4"
              />
              <span className="text-sm font-medium text-charcoal">In Stock Only</span>
            </label>
          </div>
        </aside>

        {/* Product Catalog Area */}
        <main className="lg:col-span-3 mt-6 lg:mt-0">
          {/* Top Sort & Mobile Filter Toggle Bar */}
          <div className="bg-white p-4 rounded-xl border border-cream-400 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="text-xs text-charcoal-muted font-medium w-full sm:w-auto text-center sm:text-left">
              Showing <span className="font-bold text-charcoal">{products.length}</span> handcrafted products
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-3.5 py-2 bg-cream-100 border border-cream-400 rounded-lg text-xs font-semibold text-charcoal hover:bg-cream-200"
              >
                <SlidersHorizontal className="w-4 h-4 text-maroon-600" /> Filters
              </button>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-charcoal-muted font-medium whitespace-nowrap">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-cream-100 border border-cream-400 text-charcoal text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-maroon-500"
                >
                  <option value="featured">Featured First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Customer Rated</option>
                  <option value="newest">Newest Additions</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-cream-400 p-8">
              <h3 className="font-serif text-xl font-bold text-maroon-800">No Treasures Found</h3>
              <p className="text-sm text-charcoal-muted mt-2 max-w-sm mx-auto">
                No products match your current filter selections. Try broadening your criteria.
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-6 px-6 py-2.5 bg-maroon-600 text-cream-100 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm hover:bg-maroon-700"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Slide-over Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-cream-300">
                <h3 className="font-serif text-lg font-bold text-maroon-800">Filter Products</h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 text-charcoal hover:text-maroon-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories */}
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-2">
                  Category
                </label>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setMobileFilterOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        selectedCategory === cat
                          ? 'bg-maroon-50 text-maroon-600 font-bold border-l-4 border-maroon-500'
                          : 'text-charcoal'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted">
                    Max Price
                  </label>
                  <span className="text-xs font-bold text-maroon-600">
                    &#8377;{priceRange.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="50000"
                  step="1000"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-maroon-500"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-cream-300 flex gap-3">
              <button
                onClick={() => {
                  clearAllFilters();
                  setMobileFilterOpen(false);
                }}
                className="w-1/2 py-2.5 bg-cream-100 text-charcoal text-xs font-bold rounded-lg"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-1/2 py-2.5 bg-maroon-600 text-cream-100 text-xs font-bold rounded-lg"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading Royal Collection...</div>}>
      <ShopContent />
    </Suspense>
  );
}

