'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { api } from '../../../lib/api';
import { UpiSettings } from '../../../types';
import {
  QrCode,
  Smartphone,
  CreditCard,
  UploadCloud,
  CheckCircle2,
  Copy,
  AlertCircle,
  Save,
  Check,
  X,
  FileCheck,
  Eye,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUpiSettingsPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingQr, setUploadingQr] = useState<boolean>(false);
  const [copiedTest, setCopiedTest] = useState<boolean>(false);

  const [form, setForm] = useState<UpiSettings>({
    upiId: '8708305992@upi',
    upiNumber: '8708305992',
    payeeName: 'Traditions By Tiya (Misha Sandhu)',
    qrCodeUrl: '',
    useCustomQr: false,
    instructions: 'Scan QR with any UPI App (GPay, PhonePe, Paytm, BHIM), enter 12-digit UTR and upload payment receipt.',
    isActive: true,
  });

  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrFilePreview, setQrFilePreview] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/upi');
      if (res.success && res.upi) {
        setForm(res.upi);
        if (res.upi.qrCodeUrl) {
          setQrFilePreview(res.upi.qrCodeUrl);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load UPI settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleQrFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('QR image must be under 10MB');
      return;
    }

    setQrFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setQrFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Auto-upload QR to Cloudinary
    setUploadingQr(true);
    try {
      const formData = new FormData();
      formData.append('qrCode', file);

      const res = await api.post('/settings/upi/upload-qr', formData);
      if (res.success && res.url) {
        setForm((prev) => ({
          ...prev,
          qrCodeUrl: res.url,
          useCustomQr: true,
        }));
        toast.success('Custom QR Code image uploaded & applied!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload QR code image');
    } finally {
      setUploadingQr(false);
    }
  };

  const removeCustomQr = () => {
    setQrFile(null);
    setQrFilePreview(null);
    setForm((prev) => ({
      ...prev,
      qrCodeUrl: '',
      useCustomQr: false,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.upiId.trim()) {
      toast.error('UPI ID / VPA is required');
      return;
    }

    if (!form.upiNumber.trim()) {
      toast.error('UPI Mobile number is required');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/settings/upi', form);
      if (res.success) {
        toast.success('UPI & Payment Settings updated successfully!');
        setForm(res.upi);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save UPI settings');
    } finally {
      setSaving(false);
    }
  };

  const dynamicQrPreviewUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `upi://pay?pa=${form.upiId}&pn=${encodeURIComponent(form.payeeName)}&am=12999&cu=INR`
  )}`;

  const currentQrImage = form.useCustomQr && (qrFilePreview || form.qrCodeUrl)
    ? (qrFilePreview || form.qrCodeUrl)
    : dynamicQrPreviewUrl;

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full mx-auto" />
        <p className="text-xs text-charcoal-muted mt-3 font-semibold uppercase tracking-wider">
          Loading UPI Payment Settings...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-300">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600 block">
            Payment Administration
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-maroon-900 mt-0.5">
            UPI &amp; Payment Gateway Settings
          </h1>
          <p className="text-xs text-charcoal-muted mt-1">
            Update the official store UPI ID, phone number, QR code, and customer instructions shown at checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSettings}
          className="px-3.5 py-2 bg-cream-100 hover:bg-cream-200 text-maroon-800 text-xs font-semibold rounded-lg border border-cream-300 flex items-center gap-1.5 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Main Grid: Settings Form & Live Customer Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Settings Form Column */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          {/* Card: Status Switch */}
          <div className="bg-white p-5 rounded-2xl border border-cream-400 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-maroon-900 block">Direct UPI Payment at Checkout</span>
              <span className="text-xs text-charcoal-muted">
                {form.isActive ? 'Active: Customers can choose UPI and upload screenshot' : 'Disabled: Only COD will be available to customers'}
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-cream-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-cream-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {/* Card: Banking & VPA Details */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-cream-400 shadow-sm space-y-5">
            <h2 className="font-serif text-lg font-bold text-maroon-900 border-b border-cream-300 pb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gold-600" />
              Store UPI Credentials
            </h2>

            {/* UPI ID */}
            <div>
              <label className="text-xs uppercase tracking-wider font-bold text-charcoal block mb-1">
                Official UPI ID / VPA *
              </label>
              <input
                type="text"
                required
                value={form.upiId}
                onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                placeholder="e.g. 8708305992@upi or traditionbytia@okaxis"
                className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-lg text-sm font-mono text-charcoal focus:outline-none focus:ring-2 focus:ring-maroon-500"
              />
              <p className="text-[11px] text-charcoal-muted mt-1">
                This is the exact UPI VPA address that customers will copy or pay to.
              </p>
            </div>

            {/* UPI Number / Phone */}
            <div>
              <label className="text-xs uppercase tracking-wider font-bold text-charcoal block mb-1">
                UPI Mobile Phone Number *
              </label>
              <input
                type="text"
                required
                value={form.upiNumber}
                onChange={(e) => setForm({ ...form, upiNumber: e.target.value })}
                placeholder="e.g. 8708305992"
                className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-lg text-sm font-mono text-charcoal focus:outline-none focus:ring-2 focus:ring-maroon-500"
              />
              <p className="text-[11px] text-charcoal-muted mt-1">
                Linked mobile number where customers can send direct payments via GPay, PhonePe, or Paytm.
              </p>
            </div>

            {/* Payee / Beneficiary Name */}
            <div>
              <label className="text-xs uppercase tracking-wider font-bold text-charcoal block mb-1">
                Payee / Beneficiary Name *
              </label>
              <input
                type="text"
                required
                value={form.payeeName}
                onChange={(e) => setForm({ ...form, payeeName: e.target.value })}
                placeholder="e.g. Traditions By Tiya (Misha Sandhu)"
                className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-lg text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-maroon-500"
              />
              <p className="text-[11px] text-charcoal-muted mt-1">
                Account name displayed on customer UPI verification receipts.
              </p>
            </div>
          </div>

          {/* Card: QR Code Management */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-cream-400 shadow-sm space-y-5">
            <h2 className="font-serif text-lg font-bold text-maroon-900 border-b border-cream-300 pb-3 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-gold-600" />
              QR Code Configuration
            </h2>

            {/* Mode selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  !form.useCustomQr
                    ? 'border-maroon-600 bg-maroon-50/20 shadow-xs'
                    : 'border-cream-300 hover:border-cream-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="qrType"
                    checked={!form.useCustomQr}
                    onChange={() => setForm({ ...form, useCustomQr: false })}
                    className="text-maroon-600 focus:ring-maroon-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-charcoal block">Dynamic Amount QR Code</span>
                    <span className="text-[10px] text-charcoal-muted block">
                      Auto-generates QR containing exact order total
                    </span>
                  </div>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  form.useCustomQr
                    ? 'border-maroon-600 bg-maroon-50/20 shadow-xs'
                    : 'border-cream-300 hover:border-cream-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="qrType"
                    checked={form.useCustomQr}
                    onChange={() => setForm({ ...form, useCustomQr: true })}
                    className="text-maroon-600 focus:ring-maroon-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-charcoal block">Custom Uploaded QR Image</span>
                    <span className="text-[10px] text-charcoal-muted block">
                      Use your official merchant standee image
                    </span>
                  </div>
                </div>
              </label>
            </div>

            {/* Custom QR Uploader */}
            {form.useCustomQr && (
              <div className="pt-2">
                <label className="text-xs uppercase tracking-wider font-bold text-charcoal block mb-1">
                  Upload Merchant Standee QR Code
                </label>

                {!form.qrCodeUrl && !qrFilePreview ? (
                  <label className="border-2 border-dashed border-cream-400 hover:border-maroon-600 rounded-xl p-6 text-center cursor-pointer bg-cream-50 transition-all block">
                    <UploadCloud className="w-8 h-8 text-maroon-600 mx-auto mb-2" />
                    <span className="text-xs font-bold text-maroon-800 block">
                      {uploadingQr ? 'Uploading QR to Cloudinary...' : 'Click to Upload Custom QR Code'}
                    </span>
                    <span className="text-[11px] text-charcoal-muted block mt-0.5">
                      PNG, JPG, or WEBP up to 10MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingQr}
                      onChange={handleQrFileSelect}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="p-4 bg-cream-50 rounded-xl border border-cream-300 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-cream-300 bg-white flex-shrink-0">
                        <img
                          src={qrFilePreview || form.qrCodeUrl}
                          alt="Custom QR Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-charcoal flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Custom QR Image Active
                        </span>
                        <span className="text-[10px] text-charcoal-muted block mt-0.5">
                          Hosted securely on Cloudinary CDN
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 bg-white hover:bg-cream-100 text-charcoal font-semibold text-xs rounded-lg border border-cream-400 cursor-pointer shadow-xs">
                        Change
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrFileSelect}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={removeCustomQr}
                        className="p-1.5 text-charcoal-muted hover:text-red-600 rounded-lg"
                        title="Remove custom QR"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card: Customer Guidance Note */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-cream-400 shadow-sm space-y-3">
            <h2 className="font-serif text-lg font-bold text-maroon-900 border-b border-cream-300 pb-3">
              Checkout Instructions for Customers
            </h2>
            <textarea
              rows={3}
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-lg text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-maroon-500 leading-relaxed"
              placeholder="Instructions displayed under the QR code on the checkout page..."
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving || uploadingQr}
            className="w-full py-4 bg-gradient-to-r from-maroon-700 to-maroon-600 hover:from-maroon-800 hover:to-maroon-700 text-cream-100 font-bold text-sm uppercase tracking-wider rounded-xl shadow-royal transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-gold-400" />
            {saving ? 'Saving Changes...' : 'Save UPI Payment Settings'}
          </button>
        </form>

        {/* Live Customer Preview Column */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs uppercase tracking-wider font-bold text-maroon-900 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-gold-600" />
              Customer Checkout Live Preview
            </span>
            <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded uppercase">
              Real-time
            </span>
          </div>

          {/* Mock Checkout UPI Box */}
          <div className="bg-white rounded-2xl border-2 border-maroon-600 p-6 shadow-royal space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-4 border-maroon-600 bg-white inline-block"></span>
                <span className="font-serif text-sm font-bold text-maroon-900">
                  Direct UPI Payment
                </span>
              </div>
              <span className="bg-green-100 text-green-800 text-[9px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                Zero Fee
              </span>
            </div>

            {/* QR Code and Info */}
            <div className="bg-cream-50 p-4 rounded-xl border border-cream-300 space-y-4 text-center">
              <div className="w-36 h-36 bg-white p-2 rounded-xl border-2 border-gold-500/50 shadow-sm mx-auto inline-block">
                <img
                  src={currentQrImage}
                  alt="Live QR Preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[10px] font-bold text-gold-700 uppercase tracking-wider block">
                {form.useCustomQr ? 'Scan Official Standee QR' : 'Scan with GPay / PhonePe / Paytm'}
              </span>

              <div className="bg-white p-3 rounded-lg border border-cream-300 text-left space-y-2">
                <div>
                  <span className="text-[9px] uppercase font-bold text-charcoal-muted tracking-wider block">
                    Official Store UPI ID:
                  </span>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="font-mono font-bold text-xs text-maroon-900 truncate">
                      {form.upiId || '8708305992@upi'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== 'undefined') {
                          navigator.clipboard.writeText(form.upiId);
                          setCopiedTest(true);
                          setTimeout(() => setCopiedTest(false), 2000);
                        }
                      }}
                      className="px-2 py-1 bg-maroon-700 text-cream-100 text-[10px] font-semibold rounded flex items-center gap-1 flex-shrink-0"
                    >
                      {copiedTest ? <Check className="w-3 h-3 text-green-300" /> : <Copy className="w-3 h-3 text-gold-400" />}
                      {copiedTest ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-charcoal-light space-y-0.5 pt-1 border-t border-cream-200">
                  <p>
                    <strong className="text-charcoal">UPI Phone:</strong>{' '}
                    <span className="font-mono font-bold text-maroon-800">+91 {form.upiNumber}</span>
                  </p>
                  <p className="truncate">
                    <strong className="text-charcoal">Payee:</strong> {form.payeeName}
                  </p>
                </div>
              </div>
            </div>

            {/* Simulated Form Inputs */}
            <div className="space-y-3 opacity-90">
              <div>
                <label className="text-[10px] uppercase font-bold text-maroon-900 block mb-1">
                  UPI Transaction ID / 12-Digit UTR Number *
                </label>
                <div className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-lg text-xs text-charcoal-muted font-mono">
                  431289012345 (Customer enters UTR)
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-maroon-900 block mb-1">
                  Payment Confirmation Screenshot
                </label>
                <div className="border border-dashed border-cream-400 rounded-lg p-2.5 text-center bg-cream-50 text-[11px] text-charcoal-muted">
                  Customer attaches payment screenshot
                </div>
              </div>
            </div>

            {/* Instruction note */}
            {form.instructions && (
              <p className="text-[10px] text-charcoal-muted text-center italic leading-relaxed pt-1">
                &ldquo;{form.instructions}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
