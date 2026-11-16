'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Category } from '../../../types';
import { api } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  X,
  AlertCircle,
  Package,
  Layers,
  Search,
  ExternalLink,
  UploadCloud,
  ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [formName, setFormName] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formImage, setFormImage] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formOrder, setFormOrder] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);

  // Delete Confirmation State
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories?includeInactive=true');
      if (res.success && res.categories) {
        setCategories(res.categories);
      }
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();

    const socket = getSocket();

    const handleCreated = (cat: Category) => {
      setCategories((prev) => {
        if (prev.some((c) => c._id === cat._id)) return prev;
        return [...prev, cat];
      });
      toast.success(`Category "${cat.name}" added!`, { icon: '🏷️' });
    };

    const handleUpdated = (data: { category: Category; affectedProducts?: number }) => {
      setCategories((prev) =>
        prev.map((c) => (c._id === data.category._id ? { ...c, ...data.category } : c))
      );
      if (data.affectedProducts && data.affectedProducts > 0) {
        toast.success(`Category updated and ${data.affectedProducts} product(s) synchronized!`);
      }
    };

    const handleDeleted = (data: { id: string; name: string }) => {
      setCategories((prev) => prev.filter((c) => c._id !== data.id));
      toast.success(`Category "${data.name}" removed.`);
    };

    socket.on('category:created', handleCreated);
    socket.on('category:updated', handleUpdated);
    socket.on('category:deleted', handleDeleted);

    return () => {
      socket.off('category:created', handleCreated);
      socket.off('category:updated', handleUpdated);
      socket.off('category:deleted', handleDeleted);
    };
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormDescription('');
    setFormImage('');
    setFormIsActive(true);
    setFormOrder(categories.length + 1);
    setShowUrlInput(false);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDescription(cat.description || '');
    setFormImage(cat.image || '');
    setFormIsActive(cat.isActive);
    setFormOrder(cat.order || 0);
    setShowUrlInput(false);
    setIsModalOpen(true);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be under 10MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/upload', formData);
      if (res.success && res.image?.url) {
        setFormImage(res.image.url);
        toast.success('Category image uploaded successfully!');
      } else {
        throw new Error(res.message || 'Image upload failed');
      }
    } catch (err: any) {
      console.error('Image upload error:', err);
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        // Update existing category
        const res = await api.put(`/categories/${editingCategory._id}`, {
          name: formName.trim(),
          description: formDescription.trim(),
          image: formImage.trim(),
          isActive: formIsActive,
          order: formOrder,
        });

        if (res.success && res.category) {
          toast.success(res.message || 'Category updated successfully');
          setCategories((prev) =>
            prev.map((c) => (c._id === editingCategory._id ? res.category : c))
          );
          closeModal();
        } else {
          throw new Error(res.message || 'Failed to update category');
        }
      } else {
        // Create new category
        const res = await api.post('/categories', {
          name: formName.trim(),
          description: formDescription.trim(),
          image: formImage.trim(),
          isActive: formIsActive,
          order: formOrder,
        });

        if (res.success && res.category) {
          toast.success('Category created successfully');
          setCategories((prev) => [...prev, res.category]);
          closeModal();
        } else {
          throw new Error(res.message || 'Failed to create category');
        }
      }
    } catch (err: any) {
      console.error('Category form error:', err);
      toast.error(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat: Category) => {
    try {
      const res = await api.put(`/categories/${cat._id}`, {
        isActive: !cat.isActive,
      });
      if (res.success && res.category) {
        setCategories((prev) =>
          prev.map((c) => (c._id === cat._id ? { ...c, isActive: !cat.isActive } : c))
        );
        toast.success(`Category "${cat.name}" is now ${!cat.isActive ? 'Active' : 'Hidden'}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/categories/${deletingCategory._id}`);
      if (res.success) {
        toast.success(res.message || 'Category deleted');
        setCategories((prev) => prev.filter((c) => c._id !== deletingCategory._id));
        setDeletingCategory(null);
      } else {
        throw new Error(res.message || 'Failed to delete category');
      }
    } catch (err: any) {
      console.error('Delete category error:', err);
      toast.error(err.message || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(search.toLowerCase()))
  );

  const totalProductsCount = categories.reduce((acc, c) => acc + (c.productCount || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-maroon-900 via-maroon-800 to-maroon-950 text-cream-100 p-6 sm:p-8 rounded-3xl shadow-royal border border-gold-400/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-gold-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs uppercase tracking-[0.25em] font-bold">
              Catalog Architecture
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-cream-50">
            Category Management
          </h1>
          <p className="text-xs sm:text-sm text-cream-200/80 mt-1 max-w-xl">
            Create, rename, reorder, and curate collection categories across the storefront and shop navigation.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="self-start md:self-auto py-3 px-6 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-maroon-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-gold hover:shadow-lg transition-all flex items-center gap-2 flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Category
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-cream-400 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-maroon-50 border border-maroon-200 text-maroon-700 flex items-center justify-center flex-shrink-0">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-charcoal-muted block">
              Total Categories
            </span>
            <span className="font-serif text-2xl font-bold text-maroon-900">
              {categories.length}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-cream-400 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-center justify-center flex-shrink-0">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-charcoal-muted block">
              Active on Storefront
            </span>
            <span className="font-serif text-2xl font-bold text-green-800">
              {categories.filter((c) => c.isActive).length}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-cream-400 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold-50 border border-gold-200 text-gold-700 flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-charcoal-muted block">
              Catalog Items Mapped
            </span>
            <span className="font-serif text-2xl font-bold text-maroon-900">
              {totalProductsCount}
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-cream-400 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-charcoal-muted flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter categories by name or description..."
          className="w-full text-sm text-charcoal bg-transparent focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-charcoal-muted hover:text-maroon-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Categories Cards / Table */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-3 text-xs text-charcoal-muted">Loading categories...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-cream-400 space-y-3">
          <Tag className="w-10 h-10 text-gold-500 mx-auto" />
          <h3 className="font-serif text-xl font-bold text-maroon-900">No Categories Found</h3>
          <p className="text-xs text-charcoal-muted max-w-md mx-auto">
            {search ? 'No categories matched your search query.' : 'Get started by creating your first product category.'}
          </p>
          <button
            onClick={openCreateModal}
            className="mt-2 py-2.5 px-5 bg-maroon-700 text-cream-100 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-maroon-800 transition-colors"
          >
            Add Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredCategories.map((cat) => (
            <div
              key={cat._id}
              className={`bg-white rounded-3xl border transition-all overflow-hidden shadow-sm flex flex-col justify-between ${
                cat.isActive
                  ? 'border-cream-400 hover:border-gold-400 hover:shadow-royal'
                  : 'border-gray-200 bg-gray-50/70 opacity-80'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Category Image or Default Placeholder */}
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-cream-100 border border-cream-300 flex-shrink-0">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gold-600 bg-cream-50">
                        <Tag className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-serif text-lg font-bold text-maroon-900 truncate">
                        {cat.name}
                      </h3>
                      <button
                        onClick={() => handleToggleStatus(cat)}
                        title={cat.isActive ? 'Active on store - Click to hide' : 'Hidden - Click to make active'}
                        className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full transition-colors ${
                          cat.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {cat.isActive ? (
                          <>
                            <Check className="w-3 h-3 text-green-600" /> Active
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-gray-500" /> Hidden
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-charcoal-muted font-mono mt-0.5">
                      /{cat.slug}
                    </p>

                    <p className="text-xs text-charcoal-light mt-2 line-clamp-2 leading-relaxed">
                      {cat.description || 'No description provided.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Footer: Product Count & Action Buttons */}
              <div className="px-6 py-3.5 bg-cream-50/70 border-t border-cream-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-cream-300 text-xs font-semibold text-charcoal">
                    <Package className="w-3.5 h-3.5 text-maroon-700" />
                    <strong>{cat.productCount || 0}</strong> products
                  </span>
                  <span className="text-[11px] text-charcoal-muted">
                    Order: #{cat.order || 0}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-2 text-maroon-700 hover:text-maroon-900 hover:bg-cream-200 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                    title="Edit category"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => setDeletingCategory(cat)}
                    className="p-2 text-charcoal-muted hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-maroon-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gold-400/40 overflow-hidden transform transition-all animate-scaleUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-maroon-900 via-maroon-800 to-maroon-900 p-6 text-cream-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-400/40 text-gold-400 flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-cream-50">
                    {editingCategory ? 'Edit Category' : 'Create New Category'}
                  </h3>
                  <p className="text-xs text-cream-200/80">
                    {editingCategory ? 'Modify category title, image & store visibility' : 'Add a new product category to your royal catalog'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 text-cream-200/70 hover:text-cream-100 hover:bg-maroon-700/60 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
              {editingCategory && (
                <div className="p-3.5 bg-cream-50 rounded-xl border border-gold-300 text-xs text-maroon-900 leading-relaxed flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-gold-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Automatic Product Sync:</strong> Renaming this category will automatically update all existing products that currently belong to &ldquo;{editingCategory.name}&rdquo;.
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-maroon-900 block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Royal Anarkalis, Banarasi Sarees"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-xl text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-maroon-500"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-maroon-900 block mb-1">
                  Description / Subtitle
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Hand-tailored Traditional Silhouettes & Heritage Kurtas"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-xl text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-maroon-500 resize-none"
                />
              </div>

              {/* Category Image Upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs uppercase tracking-wider font-bold text-maroon-900">
                    Category Image
                  </label>
                  {formImage && (
                    <button
                      type="button"
                      onClick={() => setFormImage('')}
                      className="text-[11px] text-red-600 hover:text-red-800 flex items-center gap-1 font-semibold"
                    >
                      <X className="w-3 h-3" /> Remove Image
                    </button>
                  )}
                </div>

                {formImage ? (
                  <div className="rounded-2xl border-2 border-gold-400/40 bg-cream-50/70 p-3 shadow-xs flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-cream-200 border border-cream-300 flex-shrink-0">
                      <img
                        src={formImage}
                        alt="Category Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-800 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                        <Check className="w-3 h-3 text-green-600" /> Image Ready
                      </span>
                      <p className="text-[11px] text-charcoal-muted truncate font-mono">
                        {formImage.startsWith('data:') ? 'High-Res Upload Ready' : formImage}
                      </p>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs">
                        <UploadCloud className="w-3.5 h-3.5 text-gold-400" />
                        {uploadingImage ? 'Uploading...' : 'Replace Image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all block ${
                    uploadingImage
                      ? 'border-maroon-500 bg-maroon-50/40'
                      : 'border-cream-400 hover:border-maroon-500 bg-cream-50/40 hover:bg-cream-50'
                  }`}>
                    {uploadingImage ? (
                      <div className="py-2">
                        <div className="w-7 h-7 border-3 border-maroon-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span className="text-xs font-bold text-maroon-800 block">
                          Uploading Image to Cloud Storage...
                        </span>
                        <span className="text-[10px] text-charcoal-muted block mt-0.5">
                          Optimizing image dimensions &amp; format
                        </span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-9 h-9 text-maroon-600 mx-auto mb-2" />
                        <span className="text-xs font-bold text-maroon-900 block">
                          Click to Upload Category Image
                        </span>
                        <span className="text-[11px] text-charcoal-muted block mt-1">
                          PNG, JPG, or WEBP up to 10MB (Square or 4:3 recommended)
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Optional toggle to paste a direct image URL */}
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] text-maroon-700 hover:text-maroon-900 underline font-semibold"
                  >
                    {showUrlInput ? 'Hide Image URL input' : 'Or paste an Image URL instead'}
                  </button>
                </div>

                {showUrlInput && (
                  <div className="mt-2 p-3 bg-cream-50 rounded-xl border border-cream-300 space-y-1">
                    <input
                      type="url"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 bg-white border border-cream-400 rounded-lg text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-maroon-500"
                    />
                    <p className="text-[10px] text-charcoal-muted">
                      Direct web links will be saved as the category image.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider font-bold text-maroon-900 block mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-xl text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-maroon-500"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider font-bold text-maroon-900 block mb-1">
                    Store Visibility
                  </label>
                  <label className="flex items-center gap-2 mt-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="w-4 h-4 text-maroon-600 rounded focus:ring-maroon-500"
                    />
                    <span className="text-xs font-semibold text-charcoal">
                      Visible on Storefront
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 px-4 bg-cream-100 hover:bg-cream-200 text-charcoal font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-maroon-700 to-maroon-600 hover:from-maroon-800 hover:to-maroon-700 text-cream-100 font-bold text-xs uppercase tracking-wider rounded-xl shadow-royal transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    'Saving...'
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-gold-400" />
                      <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-maroon-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-red-200 p-6 sm:p-7 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-serif text-xl font-bold text-charcoal">
                Delete Category?
              </h3>
              <p className="text-xs text-charcoal-light mt-1">
                Are you sure you want to remove &ldquo;<strong className="text-maroon-900">{deletingCategory.name}</strong>&rdquo;?
              </p>
              {(deletingCategory.productCount || 0) > 0 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 text-left flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Cannot delete: <strong>{deletingCategory.productCount}</strong> product(s) are currently mapped to this category. Please reassign them in Products before deleting.
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="flex-1 py-2.5 px-4 bg-cream-100 hover:bg-cream-200 text-charcoal font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting || (deletingCategory.productCount || 0) > 0}
                onClick={handleDelete}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors disabled:opacity-40"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
