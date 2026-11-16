'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product, ProductImage } from '../../../types';
import { api } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  Check,
  X,
  Search,
  Eye,
  EyeOff,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Festive Ensembles');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [formDiscountPrice, setFormDiscountPrice] = useState<number | ''>('');
  const [formStock, setFormStock] = useState<number | ''>(10);
  const [formImages, setFormImages] = useState<ProductImage[]>([]);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formFeatured, setFormFeatured] = useState<boolean>(false);
  const [formIsBestSeller, setFormIsBestSeller] = useState<boolean>(false);
  const [formIsNewArrival, setFormIsNewArrival] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  const [categories, setCategories] = useState<string[]>([
    'Festive Ensembles',
    'Lehengas & Kurtas',
    'Heritage Jewellery',
    'Handloom Dupattas',
  ]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.success && res.categories && res.categories.length > 0) {
        setCategories(res.categories.map((c: any) => c.name));
      }
    } catch (err) {
      console.error('Failed to fetch categories in products admin:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products?limit=100&includeInactive=true');
      if (res.success) {
        setProducts(res.products);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();

    const socket = getSocket();
    const handleProductUpdate = (data: { product: any; changeType: string }) => {
      if (data.product?.deleted) {
        setProducts((prev) => prev.filter((p) => p._id !== data.product._id));
      } else {
        setProducts((prev) => {
          const idx = prev.findIndex((p) => p._id === data.product._id);
          if (idx > -1) {
            const next = [...prev];
            next[idx] = data.product;
            return next;
          }
          return [data.product, ...prev];
        });
      }
    };

    const handleCategoryRefresh = () => {
      fetchCategories();
    };

    socket.on('category:created', handleCategoryRefresh);
    socket.on('category:updated', handleCategoryRefresh);
    socket.on('category:deleted', handleCategoryRefresh);

    socket.on('product:updated', handleProductUpdate);
    return () => {
      socket.off('product:updated', handleProductUpdate);
      socket.off('category:created', handleCategoryRefresh);
      socket.off('category:updated', handleCategoryRefresh);
      socket.off('category:deleted', handleCategoryRefresh);
    };
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('Festive Ensembles');
    setFormDescription('');
    setFormPrice('');
    setFormDiscountPrice('');
    setFormStock(10);
    setFormImages([
      { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800' },
    ]);
    setFormIsActive(true);
    setFormFeatured(false);
    setFormIsBestSeller(false);
    setFormIsNewArrival(true);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormDescription(p.description);
    setFormPrice(p.price);
    setFormDiscountPrice(p.discountPrice || '');
    setFormStock(p.stock);
    setFormImages(p.images || []);
    setFormIsActive(p.isActive);
    setFormFeatured(!!p.featured);
    setFormIsBestSeller(!!p.isBestSeller);
    setFormIsNewArrival(!!p.isNewArrival);
    setIsModalOpen(true);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/upload', formData);
      if (res.success && res.image) {
        setFormImages((prev) => [...prev, res.image]);
        toast.success('Image uploaded to Cloudinary storage');
      }
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || formPrice === '' || formStock === '') {
      toast.error('Please fill all mandatory product fields.');
      return;
    }

    if (formImages.length === 0) {
      toast.error('At least one product image is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formName,
        category: formCategory,
        description: formDescription,
        price: Number(formPrice),
        discountPrice: formDiscountPrice !== '' ? Number(formDiscountPrice) : undefined,
        stock: Number(formStock),
        images: formImages,
        isActive: formIsActive,
        featured: formFeatured,
        isBestSeller: formIsBestSeller,
        isNewArrival: formIsNewArrival,
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
        toast.success('Product updated successfully!');
      } else {
        await api.post('/products', payload);
        toast.success('New product created and published!');
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you wish to delete this product from the royal catalog?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await api.put(`/products/${product._id}`, {
        isActive: !product.isActive,
      });
      toast.success(`Product ${!product.isActive ? 'activated' : 'deactivated'}`);
      fetchProducts();
    } catch (err: any) {
      toast.error('Toggle failed');
    }
  };

  const activeCount = products.filter((p) => p.isActive).length;
  const inactiveCount = products.filter((p) => !p.isActive).length;

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? p.isActive
        : !p.isActive;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600 block">
            Catalog Management
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-maroon-900 mt-0.5">
            Products ({products.length})
          </h1>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-gradient-to-r from-maroon-700 to-maroon-600 hover:from-maroon-800 hover:to-maroon-700 text-cream-100 font-bold text-xs uppercase tracking-wider rounded-xl shadow-royal flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-gold-400" /> Add New Product
        </button>
      </div>

      {/* Search Input & Status Filter Pills */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="bg-white p-3 rounded-xl border border-cream-400 shadow-sm max-w-md flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-cream-50 border border-cream-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-maroon-500"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-charcoal-muted" />
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-cream-400 shadow-sm text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'all'
                ? 'bg-maroon-600 text-cream-100 shadow-xs'
                : 'text-charcoal hover:bg-cream-100'
            }`}
          >
            All ({products.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'active'
                ? 'bg-green-600 text-white shadow-xs'
                : 'text-green-700 hover:bg-green-50'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'inactive'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            Inactive ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-cream-400 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-cream-100 text-charcoal-muted uppercase tracking-wider font-semibold border-b border-cream-300">
                <th className="p-4">Image</th>
                <th className="p-4">Product Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price / Discount</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200 text-charcoal">
              {filteredProducts.map((p) => (
                <tr key={p._id} className="hover:bg-cream-50 transition-colors">
                  <td className="p-4">
                    <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-cream-100 border border-cream-300">
                      <Image
                        src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100'}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-sm text-charcoal block line-clamp-1">{p.name}</span>
                    <span className="text-[11px] text-charcoal-muted font-mono">{p.slug}</span>
                  </td>
                  <td className="p-4 font-semibold text-gold-700">{p.category}</td>
                  <td className="p-4">
                    <span className="font-bold text-maroon-700 block">
                      &#8377;{(p.discountPrice || p.price).toLocaleString('en-IN')}
                    </span>
                    {p.discountPrice && (
                      <span className="text-[11px] text-charcoal-muted line-through">
                        &#8377;{p.price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`font-bold px-2.5 py-1 rounded-full text-[10px] ${
                        p.stock === 0
                          ? 'bg-red-100 text-red-800'
                          : p.stock <= 5
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {p.stock} units
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleActive(p)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        p.isActive
                          ? 'bg-green-50 text-green-800 border border-green-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {p.isActive ? <Eye className="w-3 h-3 text-green-600" /> : <EyeOff className="w-3 h-3" />}
                      {p.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 text-charcoal-muted hover:text-maroon-600 hover:bg-cream-100 rounded-lg"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="p-1.5 text-charcoal-muted hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-cream-400 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-cream-300 mb-6">
              <h2 className="font-serif text-xl font-bold text-maroon-900">
                {editingProduct ? 'Edit Handcrafted Product' : 'Add New Handcrafted Product'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-charcoal hover:text-maroon-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="uppercase tracking-wider font-bold text-charcoal-muted block mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-cream-50 border border-cream-400 rounded-lg text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-maroon-500"
                  placeholder="e.g. Varanasi Royal Crimson Katan Silk Saree"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="uppercase tracking-wider font-bold text-charcoal-muted block mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-cream-50 border border-cream-400 rounded-lg text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-maroon-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="uppercase tracking-wider font-bold text-charcoal-muted block mb-1">
                    Inventory Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-cream-50 border border-cream-400 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="uppercase tracking-wider font-bold text-charcoal-muted block mb-1">
                    Base Price (&#8377;) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-cream-50 border border-cream-400 rounded-lg text-xs"
                    placeholder="18500"
                  />
                </div>

                <div>
                  <label className="uppercase tracking-wider font-bold text-charcoal-muted block mb-1">
                    Discount / Sale Price (&#8377;) (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formDiscountPrice}
                    onChange={(e) => setFormDiscountPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-cream-50 border border-cream-400 rounded-lg text-xs"
                    placeholder="15999"
                  />
                </div>
              </div>

              <div>
                <label className="uppercase tracking-wider font-bold text-charcoal-muted block mb-1">
                  Product Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-cream-50 border border-cream-400 rounded-lg text-xs"
                  placeholder="Artisan provenance, weave technique, zari specifications..."
                />
              </div>

              {/* Images & Cloudinary Upload */}
              <div>
                <label className="uppercase tracking-wider font-bold text-charcoal-muted block mb-1">
                  Images (Cloudinary Auto-Optimized)
                </label>

                <div className="flex flex-wrap gap-3 mb-3">
                  {formImages.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-20 rounded-lg overflow-hidden border border-cream-400 group">
                      <Image src={img.url} alt="" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 shadow-xs opacity-80 hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <label className="w-16 h-20 rounded-lg border-2 border-dashed border-gold-400 bg-cream-50 flex flex-col items-center justify-center cursor-pointer hover:bg-cream-100 text-gold-700">
                    <Upload className="w-4 h-4 mb-1" />
                    <span className="text-[9px] font-bold uppercase">{uploadingImage ? '...' : '+ Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-charcoal">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded text-maroon-600"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-charcoal">
                  <input
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="rounded text-maroon-600"
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-charcoal">
                  <input
                    type="checkbox"
                    checked={formIsBestSeller}
                    onChange={(e) => setFormIsBestSeller(e.target.checked)}
                    className="rounded text-maroon-600"
                  />
                  Best Seller
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-charcoal">
                  <input
                    type="checkbox"
                    checked={formIsNewArrival}
                    onChange={(e) => setFormIsNewArrival(e.target.checked)}
                    className="rounded text-maroon-600"
                  />
                  New Arrival
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-cream-300 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-cream-100 text-charcoal font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-maroon-600 hover:bg-maroon-700 text-cream-100 font-bold uppercase tracking-wider rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

