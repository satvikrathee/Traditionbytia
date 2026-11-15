'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '../../../types';
import { api } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import { Layers, Save, RefreshCw, CheckCircle2, Search, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Editable row states: map of productId -> { stock, price, discountPrice, dirty }
  const [editMap, setEditMap] = useState<Record<string, { stock: number; price: number; discountPrice: string; dirty: boolean }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/products?limit=100&includeInactive=true');
      if (res.success) {
        setProducts(res.products);
        const map: any = {};
        res.products.forEach((p: Product) => {
          map[p._id] = {
            stock: p.stock,
            price: p.price,
            discountPrice: p.discountPrice !== undefined ? String(p.discountPrice) : '',
            dirty: false,
          };
        });
        setEditMap(map);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();

    const socket = getSocket();
    const handleInventoryUpdate = (data: { productId: string; stock: number; price?: number; discountPrice?: number }) => {
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

    socket.on('inventory:updated', handleInventoryUpdate);
    return () => {
      socket.off('inventory:updated', handleInventoryUpdate);
    };
  }, []);

  const handleFieldChange = (productId: string, field: 'stock' | 'price' | 'discountPrice', value: any) => {
    setEditMap((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
        dirty: true,
      },
    }));
  };

  const handleSaveRow = async (productId: string) => {
    const row = editMap[productId];
    if (!row) return;

    setSavingId(productId);
    try {
      const payload: any = {
        stock: Number(row.stock),
        price: Number(row.price),
        discountPrice: row.discountPrice ? Number(row.discountPrice) : null,
      };

      const res = await api.patch(`/products/${productId}/inventory`, payload);
      if (res.success) {
        setEditMap((prev) => ({
          ...prev,
          [productId]: {
            ...prev[productId],
            dirty: false,
          },
        }));
        toast.success(`Inventory updated & pushed live via Socket.io!`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update inventory');
    } finally {
      setSavingId(null);
    }
  };

  const handleQuickStock = (productId: string, delta: number) => {
    const current = editMap[productId]?.stock ?? 0;
    const newStock = Math.max(0, current + delta);
    handleFieldChange(productId, 'stock', newStock);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600 block">
            Real-Time Operations
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-maroon-900 mt-0.5">
            Inline Inventory Management
          </h1>
          <p className="text-xs text-charcoal-muted mt-1">
            Edit stock units and prices inline. Changes broadcast to all active customers and storefronts instantly.
          </p>
        </div>

        <button
          onClick={fetchInventory}
          className="px-4 py-2 bg-cream-200 hover:bg-cream-300 text-maroon-800 text-xs font-bold rounded-xl flex items-center gap-2 border border-cream-400"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Live Telemetry
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-cream-400 shadow-sm max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Search products by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-cream-50 border border-cream-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-maroon-500"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-charcoal-muted" />
        </div>
      </div>

      {/* Inline Inventory Table */}
      <div className="bg-white rounded-2xl border border-cream-400 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-cream-100 text-charcoal-muted uppercase tracking-wider font-semibold border-b border-cream-300">
                <th className="p-4">Item</th>
                <th className="p-4">Category</th>
                <th className="p-4">Live Stock</th>
                <th className="p-4">Quick Adjust</th>
                <th className="p-4">Base Price (&#8377;)</th>
                <th className="p-4">Discount Price (&#8377;)</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200 text-charcoal">
              {filteredProducts.map((p) => {
                const row = editMap[p._id] || {
                  stock: p.stock,
                  price: p.price,
                  discountPrice: p.discountPrice || '',
                  dirty: false,
                };
                const isSaving = savingId === p._id;

                return (
                  <tr
                    key={p._id}
                    className={`transition-colors ${row.dirty ? 'bg-amber-50/60' : 'hover:bg-cream-50'}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-12 rounded-lg overflow-hidden bg-cream-100 flex-shrink-0 border border-cream-300">
                          <Image
                            src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100'}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-charcoal line-clamp-1">{p.name}</span>
                            {!p.isActive && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 whitespace-nowrap">
                                Inactive
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-charcoal-muted font-mono">{p.slug}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-semibold text-gold-700">{p.category}</td>

                    {/* Inline Stock Input */}
                    <td className="p-4">
                      <div className="w-24">
                        <input
                          type="number"
                          min="0"
                          value={row.stock}
                          onChange={(e) => handleFieldChange(p._id, 'stock', Number(e.target.value))}
                          className={`w-full px-2.5 py-1.5 border rounded-lg text-xs font-bold ${
                            row.stock === 0
                              ? 'bg-red-50 border-red-300 text-red-700'
                              : row.stock <= 5
                              ? 'bg-amber-50 border-amber-300 text-amber-800'
                              : 'bg-white border-cream-400 text-charcoal'
                          }`}
                        />
                      </div>
                    </td>

                    {/* Quick increment buttons */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickStock(p._id, -1)}
                          className="px-2 py-1 bg-cream-100 hover:bg-cream-200 border border-cream-300 rounded font-bold text-xs"
                          title="-1 stock"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleQuickStock(p._id, 1)}
                          className="px-2 py-1 bg-cream-100 hover:bg-cream-200 border border-cream-300 rounded font-bold text-xs text-green-700"
                          title="+1 stock"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleQuickStock(p._id, 5)}
                          className="px-2 py-1 bg-cream-100 hover:bg-cream-200 border border-cream-300 rounded font-bold text-xs text-green-800"
                          title="+5 stock"
                        >
                          +5
                        </button>
                      </div>
                    </td>

                    {/* Inline Base Price */}
                    <td className="p-4">
                      <div className="w-28">
                        <input
                          type="number"
                          min="0"
                          value={row.price}
                          onChange={(e) => handleFieldChange(p._id, 'price', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white border border-cream-400 rounded-lg text-xs font-bold text-maroon-700"
                        />
                      </div>
                    </td>

                    {/* Inline Discount Price */}
                    <td className="p-4">
                      <div className="w-28">
                        <input
                          type="number"
                          min="0"
                          placeholder="None"
                          value={row.discountPrice}
                          onChange={(e) => handleFieldChange(p._id, 'discountPrice', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-cream-400 rounded-lg text-xs"
                        />
                      </div>
                    </td>

                    {/* Save Action */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleSaveRow(p._id)}
                        disabled={!row.dirty || isSaving}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ml-auto transition-all ${
                          row.dirty
                            ? 'bg-maroon-600 hover:bg-maroon-700 text-cream-100 shadow-sm'
                            : 'bg-cream-100 text-charcoal-muted cursor-not-allowed opacity-40'
                        }`}
                      >
                        <Save className="w-3.5 h-3.5" />
                        {isSaving ? '...' : 'Save'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

