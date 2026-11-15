'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Address, UpiSettings } from '../../types';
import {
  CreditCard,
  QrCode,
  Smartphone,
  Lock,
  Plus,
  Copy,
  Check,
  UploadCloud,
  FileCheck,
  X,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, shippingFee, total, clearCart } = useCart();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Address State
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
  const [useNewAddress, setUseNewAddress] = useState<boolean>(false);
  const [addressForm, setAddressForm] = useState<Address>({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  });

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI'>('UPI');
  const [upiTransactionId, setUpiTransactionId] = useState<string>('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Dynamic Store UPI Settings
  const [upiSettings, setUpiSettings] = useState<UpiSettings>({
    upiId: '8708305992@upi',
    upiNumber: '8708305992',
    payeeName: 'Traditions By Tiya (Misha Sandhu)',
    qrCodeUrl: '',
    useCustomQr: false,
    instructions: 'Scan QR with any UPI App (GPay, PhonePe, Paytm, BHIM), enter 12-digit UTR and upload payment receipt.',
    isActive: true,
  });

  useEffect(() => {
    const fetchUpiSettings = async () => {
      try {
        const res = await api.get('/settings/upi');
        if (res.success && res.upi) {
          setUpiSettings(res.upi);
          if (!res.upi.isActive) {
            setPaymentMethod('COD');
          }
        }
      } catch (err) {
        console.error('Failed to load active UPI settings:', err);
      }
    };
    fetchUpiSettings();
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('Please sign in to proceed with checkout');
      router.push('/login?redirect=/checkout');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (user && user.addresses && user.addresses.length > 0) {
      const defaultIdx = user.addresses.findIndex((a) => a.isDefault);
      setSelectedAddressIndex(defaultIdx > -1 ? defaultIdx : 0);
    } else if (user) {
      setUseNewAddress(true);
      setAddressForm((prev) => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  // Handle file selection & preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (PNG, JPG, WEBP)');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be under 10MB');
        return;
      }
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
  };

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedUpi(true);
      toast.success('UPI ID copied to clipboard!');
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-maroon-800">Your Cart is Empty</h2>
        <p className="text-sm text-charcoal-muted mt-2">Add items to your cart before proceeding to checkout.</p>
        <button
          onClick={() => router.push('/shop')}
          className="mt-6 px-6 py-2.5 bg-maroon-600 text-cream-100 text-xs font-bold uppercase rounded-lg"
        >
          Explore Shop
        </button>
      </div>
    );
  }

  const getEffectiveAddress = (): Address => {
    if (!useNewAddress && user?.addresses && user.addresses[selectedAddressIndex]) {
      return user.addresses[selectedAddressIndex];
    }
    return addressForm;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAddress = getEffectiveAddress();

    if (
      !finalAddress.name ||
      !finalAddress.phone ||
      !finalAddress.street ||
      !finalAddress.city ||
      !finalAddress.state ||
      !finalAddress.pincode
    ) {
      toast.error('Please complete all shipping address fields.');
      return;
    }

    if (paymentMethod === 'UPI') {
      if (!upiTransactionId.trim()) {
        toast.error('Please enter your 12-digit UPI Transaction / UTR number.');
        return;
      }
    }

    setIsSubmitting(true);
    setStatusMessage('Preparing order...');

    try {
      let uploadedScreenshotUrl = '';

      // Upload payment screenshot if provided
      if (paymentMethod === 'UPI' && screenshotFile) {
        setStatusMessage('Uploading payment screenshot...');
        const formData = new FormData();
        formData.append('screenshot', screenshotFile);

        try {
          const uploadRes = await api.post('/orders/upload-screenshot', formData);
          if (uploadRes.success && uploadRes.url) {
            uploadedScreenshotUrl = uploadRes.url;
          }
        } catch (uploadErr: any) {
          console.error('Screenshot upload error:', uploadErr);
          toast.error('Screenshot upload failed, proceeding with transaction ID');
        }
      }

      setStatusMessage('Confirming royal order...');

      // Create Order on Backend
      const orderPayload = {
        items: items.map((i) => ({
          productId: i.productId._id,
          qty: i.qty,
        })),
        address: finalAddress,
        paymentMethod,
        upiTransactionId: paymentMethod === 'UPI' ? upiTransactionId.trim() : undefined,
        paymentScreenshot: paymentMethod === 'UPI' ? uploadedScreenshotUrl : undefined,
      };

      const res = await api.post('/orders', orderPayload);

      if (!res.success || !res.order) {
        throw new Error(res.message || 'Order creation failed');
      }

      const createdOrder = res.order;
      await clearCart();

      if (paymentMethod === 'UPI') {
        toast.success('Royal order placed! Your UPI payment details have been recorded.');
      } else {
        toast.success('Royal order placed successfully with Cash on Delivery!');
      }

      router.push(`/order-success/${createdOrder._id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
      setStatusMessage('');
    }
  };

  const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `upi://pay?pa=${upiSettings.upiId}&pn=${encodeURIComponent(upiSettings.payeeName)}&am=${total}&cu=INR`
  )}`;

  const effectiveQrCodeUrl = upiSettings.useCustomQr && upiSettings.qrCodeUrl
    ? upiSettings.qrCodeUrl
    : dynamicQrUrl;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="max-w-2xl mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-maroon-900">
          Royal Checkout
        </h1>
        <p className="text-xs text-charcoal-muted uppercase tracking-wider font-semibold mt-1">
          Complete your delivery details and choose your preferred payment method
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left Column: Shipping Address & Payment Selection */}
        <div className="lg:col-span-2 space-y-8">
          {/* Shipping Address Box */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-cream-400 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-cream-300">
              <div>
                <h2 className="font-serif text-xl font-bold text-maroon-900">Delivery Address</h2>
                <p className="text-xs text-charcoal-muted mt-0.5">Where shall we send your handcrafted luxury?</p>
              </div>
              {user?.addresses && user.addresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUseNewAddress(!useNewAddress)}
                  className="text-xs font-bold text-maroon-600 hover:text-maroon-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {useNewAddress ? 'Use Saved Address' : 'Add New Address'}
                </button>
              )}
            </div>

            {/* Existing Saved Addresses */}
            {!useNewAddress && user?.addresses && user.addresses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user.addresses.map((addr, idx) => (
                  <label
                    key={idx}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedAddressIndex === idx
                        ? 'border-maroon-600 bg-maroon-50/20 shadow-xs'
                        : 'border-cream-300 hover:border-cream-400'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="savedAddress"
                          checked={selectedAddressIndex === idx}
                          onChange={() => setSelectedAddressIndex(idx)}
                          className="text-maroon-600 focus:ring-maroon-500"
                        />
                        <span className="font-bold text-sm text-charcoal">{addr.name}</span>
                      </div>
                      {addr.isDefault && (
                        <span className="text-[10px] uppercase font-bold text-gold-700 bg-gold-100 px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-charcoal-light mt-2 pl-6">
                      {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                    <p className="text-xs text-charcoal-muted mt-1 pl-6 font-semibold">
                      Phone: {addr.phone}
                    </p>
                  </label>
                ))}
              </div>
            ) : (
              /* New Address Form */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-lg text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-maroon-500"
                    placeholder="Recipient's Full Name"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-lg text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-maroon-500"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-1">
                    Street Address / House No. / Landmark *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-lg text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-maroon-500"
                    placeholder="e.g. Model Town / Sector 13"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-lg text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-maroon-500"
                    placeholder="Karnal / Delhi / Chandigarh"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-lg text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-maroon-500"
                    placeholder="Haryana / Punjab / Delhi"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-1">
                    Pincode / Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-lg text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-maroon-500"
                    placeholder="132001"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-cream-400 shadow-sm space-y-6">
            <div className="pb-4 border-b border-cream-300">
              <h2 className="font-serif text-xl font-bold text-maroon-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gold-600" /> Payment Method
              </h2>
              <p className="text-xs text-charcoal-muted mt-1">
                Choose between Direct UPI Payment or Cash on Delivery
              </p>
            </div>

            <div className="space-y-4">
              {/* Option 1: Direct UPI Payment */}
              {upiSettings.isActive ? (
                <div
                  className={`p-5 rounded-2xl border-2 transition-all ${
                    paymentMethod === 'UPI'
                      ? 'border-maroon-600 bg-maroon-50/20 shadow-sm'
                      : 'border-cream-300 bg-cream-50 hover:border-cream-400'
                  }`}
                >
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'UPI'}
                        onChange={() => setPaymentMethod('UPI')}
                        className="text-maroon-600 focus:ring-maroon-500"
                      />
                      <div>
                        <span className="font-serif text-base font-bold text-maroon-900 block">
                          Direct UPI Payment (Instant Verification)
                        </span>
                        <span className="text-xs text-charcoal-muted">
                          Pay via Google Pay, PhonePe, Paytm, or any UPI App &amp; enter UTR
                        </span>
                      </div>
                    </div>
                    <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                      Zero Extra Fee
                    </span>
                  </label>

                  {/* Expanded UPI Details Section */}
                  {paymentMethod === 'UPI' && (
                    <div className="mt-5 pt-5 border-t border-cream-300 space-y-6">
                      {/* Store Official UPI Box */}
                      <div className="bg-white p-5 rounded-xl border border-gold-400/40 shadow-xs">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                          {/* Dynamic or Custom QR Code */}
                          <div className="text-center flex-shrink-0">
                            <div className="w-40 h-40 bg-white p-2.5 rounded-xl border-2 border-gold-500/50 shadow-sm inline-block">
                              <img
                                src={effectiveQrCodeUrl}
                                alt="Scan to Pay via UPI"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <span className="text-[10px] font-bold text-gold-700 uppercase tracking-wider block mt-1.5">
                              {upiSettings.useCustomQr ? 'Scan Merchant QR' : 'Scan with Any UPI App'}
                            </span>
                          </div>

                          {/* UPI Details & Copy */}
                          <div className="flex-1 space-y-3 text-left w-full">
                            <div className="bg-cream-50 p-3 rounded-lg border border-cream-300">
                              <span className="text-[10px] uppercase font-bold text-charcoal-muted tracking-wider block">
                                Payable Amount
                              </span>
                              <span className="font-serif text-2xl font-bold text-maroon-700 block">
                                &#8377;{total.toLocaleString('en-IN')}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] uppercase font-bold text-charcoal-muted tracking-wider block mb-1">
                                Official Store UPI ID:
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-maroon-900 bg-cream-100 px-3 py-1.5 rounded-lg border border-cream-300 truncate max-w-[220px]">
                                  {upiSettings.upiId}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(upiSettings.upiId)}
                                  className="px-3 py-1.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs flex-shrink-0"
                                >
                                  {copiedUpi ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-green-300" /> Copied!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5 text-gold-400" /> Copy UPI ID
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="text-xs text-charcoal-light space-y-1">
                              <p>
                                <strong className="text-charcoal">UPI Phone / Number:</strong>{' '}
                                <span className="font-mono font-bold text-maroon-800">
                                  +91 {upiSettings.upiNumber}
                                </span>
                              </p>
                              <p>
                                <strong className="text-charcoal">Recipient Name:</strong> {upiSettings.payeeName}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Instructions if provided */}
                      {upiSettings.instructions && (
                        <div className="p-3.5 bg-cream-50 rounded-xl border border-cream-300 text-xs text-charcoal-light leading-relaxed flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-gold-600 flex-shrink-0 mt-0.5" />
                          <span>{upiSettings.instructions}</span>
                        </div>
                      )}

                      {/* Step 2: Customer inputs UPI Transaction ID and Screenshot */}
                      <div className="space-y-4 pt-2">
                        <div>
                          <label className="text-xs uppercase tracking-wider font-bold text-maroon-900 block mb-1 flex items-center gap-1.5">
                            <Smartphone className="w-4 h-4 text-gold-600" />
                            UPI Transaction ID / 12-Digit UTR Number *
                          </label>
                          <input
                            type="text"
                            required={paymentMethod === 'UPI'}
                            value={upiTransactionId}
                            onChange={(e) => setUpiTransactionId(e.target.value)}
                            placeholder="e.g. 431289012345 (Found in your GPay / PhonePe / Paytm receipt)"
                            className="w-full px-3.5 py-2.5 bg-white border border-cream-400 rounded-lg text-sm text-charcoal font-mono placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-maroon-500"
                          />
                          <p className="text-[11px] text-charcoal-muted mt-1">
                            You can find this 12-digit reference number (UTR) in the transaction receipt of your payment app.
                          </p>
                        </div>

                        {/* Payment Screenshot Upload */}
                        <div>
                          <label className="text-xs uppercase tracking-wider font-bold text-maroon-900 block mb-1 flex items-center gap-1.5">
                            <UploadCloud className="w-4 h-4 text-gold-600" />
                            Payment Confirmation Screenshot (Recommended)
                          </label>

                          {!screenshotPreview ? (
                            <label className="border-2 border-dashed border-cream-400 hover:border-maroon-500 rounded-xl p-5 text-center cursor-pointer bg-white transition-all block">
                              <UploadCloud className="w-8 h-8 text-maroon-600 mx-auto mb-2" />
                              <span className="text-xs font-bold text-maroon-800 block">
                                Click to Upload Payment Screenshot
                              </span>
                              <span className="text-[11px] text-charcoal-muted block mt-0.5">
                                PNG, JPG, or WEBP up to 10MB
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                              />
                            </label>
                          ) : (
                            <div className="bg-white p-3.5 rounded-xl border border-cream-300 flex items-center justify-between gap-3 shadow-xs">
                              <div className="flex items-center gap-3">
                                <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-cream-300 bg-cream-50 flex-shrink-0">
                                  <img
                                    src={screenshotPreview}
                                    alt="Payment Screenshot Preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-charcoal flex items-center gap-1">
                                    <FileCheck className="w-3.5 h-3.5 text-green-600" />
                                    {screenshotFile?.name || 'Payment Screenshot Attached'}
                                  </span>
                                  <span className="text-[10px] text-charcoal-muted block">
                                    {screenshotFile ? `${(screenshotFile.size / 1024).toFixed(1)} KB` : ''} &bull; Ready to verify
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={removeScreenshot}
                                className="p-1.5 text-charcoal-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove screenshot"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/50 text-xs text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>Direct UPI payment is currently undergoing maintenance. Please select Cash on Delivery.</span>
                </div>
              )}

              {/* Option 2: Cash on Delivery */}
              <label
                className={`p-5 rounded-2xl border-2 flex flex-col cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-maroon-600 bg-maroon-50/20 shadow-sm'
                    : 'border-cream-300 bg-cream-50 hover:border-cream-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="text-maroon-600 focus:ring-maroon-500"
                    />
                    <div>
                      <span className="font-serif text-base font-bold text-maroon-900 block">
                        Cash on Delivery (COD)
                      </span>
                      <span className="text-xs text-charcoal-muted">
                        Pay cash directly to the courier upon doorstep delivery
                      </span>
                    </div>
                  </div>
                  <span className="bg-cream-200 text-charcoal text-[10px] font-semibold px-2 py-0.5 rounded uppercase">
                    Doorstep Cash
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-cream-400 shadow-royal space-y-6 sticky top-28">
          <h2 className="font-serif text-xl font-bold text-maroon-900 border-b border-cream-300 pb-3">
            Order Review
          </h2>

          {/* Mini items list */}
          <div className="max-h-64 overflow-y-auto divide-y divide-cream-200 pr-1">
            {items.map((item) => (
              <div key={item.productId._id} className="py-3 flex items-center gap-3">
                <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-cream-100 flex-shrink-0 border border-cream-300">
                  <Image
                    src={item.productId.images?.[0]?.url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200'}
                    alt={item.productId.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-charcoal truncate">{item.productId.name}</p>
                  <p className="text-[11px] text-charcoal-muted">Qty: {item.qty}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-maroon-700">
                    &#8377;{((item.productId.discountPrice || item.productId.price) * item.qty).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Cost Breakdown */}
          <div className="space-y-2.5 text-sm pt-4 border-t border-cream-300">
            <div className="flex justify-between text-charcoal-light">
              <span>Subtotal</span>
              <span className="font-semibold text-charcoal">&#8377;{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-charcoal-light">
              <span>Delivery</span>
              <span className="font-semibold text-charcoal">
                {shippingFee === 0 ? <strong className="text-green-700">FREE</strong> : `₹${shippingFee}`}
              </span>
            </div>
            <div className="pt-3 border-t border-cream-300 flex justify-between text-lg font-bold text-maroon-900">
              <span>Final Total</span>
              <span className="font-serif text-2xl text-maroon-600">&#8377;{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Place Order CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-maroon-700 to-maroon-600 hover:from-maroon-800 hover:to-maroon-700 text-cream-100 font-bold text-sm uppercase tracking-wider rounded-xl shadow-royal transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            <Lock className="w-4 h-4 text-gold-400" />
            {isSubmitting
              ? statusMessage || 'Securing Order...'
              : paymentMethod === 'COD'
              ? 'Confirm Cash On Delivery Order'
              : 'Submit UPI Order & Confirm'}
          </button>

          <p className="text-[11px] text-charcoal-muted text-center leading-tight">
            By placing order, you agree to Traditions By Tiya terms of sale and authentic handcrafted pledge.
          </p>
        </div>
      </form>
    </div>
  );
}
