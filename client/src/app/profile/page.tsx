'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Address } from '../../types';
import { User, Phone, MapPin, Plus, Trash2, Shield, Save, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, updateProfile, addAddress, deleteAddress } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // New Address State
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddr, setNewAddr] = useState<Omit<Address, '_id'>>({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile');
      return;
    }
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user, isAuthenticated, authLoading, router]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await updateProfile({ name, phone });
      toast.success('Profile details updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAddAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addAddress(newAddr);
      toast.success('Address added to your address book');
      setShowAddAddress(false);
      setNewAddr({
        name: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false,
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to add address');
    }
  };

  const handleDeleteAddress = async (id?: string) => {
    if (!id) return;
    try {
      await deleteAddress(id);
      toast.success('Address removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete address');
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="mb-8">
        <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600 block">
          Patron Profile
        </span>
        <h1 className="font-serif text-3xl font-bold text-maroon-900 mt-1">
          Account &amp; Saved Addresses
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left: Profile Information Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-400 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-cream-300">
            <div className="w-12 h-12 rounded-full bg-maroon-600 text-cream-100 flex items-center justify-center font-bold text-lg uppercase shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-charcoal">{user?.name}</h2>
              <span className="text-xs text-charcoal-muted capitalize flex items-center gap-1">
                {user?.role === 'admin' ? (
                  <span className="text-maroon-700 font-bold flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-gold-600" /> Royal Administrator
                  </span>
                ) : (
                  'Valued Patron'
                )}
              </span>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-xl text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-maroon-500"
                />
                <User className="absolute left-3 top-3 w-4 h-4 text-charcoal-muted" />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-1">
                Registered Email (Permanent)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-sm text-charcoal-muted cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-1">
                Contact Phone
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-xl text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-maroon-500"
                />
                <Phone className="absolute left-3 top-3 w-4 h-4 text-charcoal-muted" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full py-3 bg-maroon-600 hover:bg-maroon-700 text-cream-100 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isUpdatingProfile ? 'Saving...' : 'Update Details'}
            </button>
          </form>
        </div>

        {/* Right: Saved Addresses Book */}
        <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-cream-400 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-cream-300">
            <div>
              <h2 className="font-serif text-xl font-bold text-maroon-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gold-600" /> Saved Delivery Addresses
              </h2>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Manage your residential and ceremonial delivery locations
              </p>
            </div>
            <button
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="px-3.5 py-2 bg-cream-100 hover:bg-cream-200 text-maroon-800 text-xs font-bold rounded-xl border border-cream-300 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> {showAddAddress ? 'Cancel' : 'Add New'}
            </button>
          </div>

          {/* New Address Form */}
          {showAddAddress && (
            <form onSubmit={handleAddAddressSubmit} className="p-5 bg-cream-50 rounded-2xl border border-gold-400/40 space-y-4">
              <h3 className="font-serif text-sm font-bold text-maroon-800">Add New Delivery Location</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Recipient Name"
                  value={newAddr.name}
                  onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                  className="px-3 py-2 bg-white border border-cream-400 rounded-lg text-xs"
                />
                <input
                  type="tel"
                  required
                  placeholder="Mobile Phone"
                  value={newAddr.phone}
                  onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                  className="px-3 py-2 bg-white border border-cream-400 rounded-lg text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="Street / Suite / Landmark"
                  value={newAddr.street}
                  onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                  className="sm:col-span-2 px-3 py-2 bg-white border border-cream-400 rounded-lg text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={newAddr.city}
                  onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                  className="px-3 py-2 bg-white border border-cream-400 rounded-lg text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="State"
                  value={newAddr.state}
                  onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                  className="px-3 py-2 bg-white border border-cream-400 rounded-lg text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="Pincode"
                  value={newAddr.pincode}
                  onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                  className="px-3 py-2 bg-white border border-cream-400 rounded-lg text-xs"
                />
                <label className="flex items-center gap-2 text-xs text-charcoal">
                  <input
                    type="checkbox"
                    checked={newAddr.isDefault}
                    onChange={(e) => setNewAddr({ ...newAddr, isDefault: e.target.checked })}
                    className="rounded text-maroon-600"
                  />
                  Set as default shipping address
                </label>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-maroon-600 text-cream-100 font-bold text-xs uppercase rounded-lg"
              >
                Save Address
              </button>
            </form>
          )}

          {/* List of Addresses */}
          {user?.addresses && user.addresses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {user.addresses.map((addr) => (
                <div
                  key={addr._id}
                  className="p-5 rounded-2xl border border-cream-300 bg-cream-50/50 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-charcoal">{addr.name}</span>
                      {addr.isDefault && (
                        <span className="text-[10px] font-bold text-gold-700 bg-gold-100 px-2 py-0.5 rounded uppercase">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-charcoal-light leading-relaxed">
                      {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                    <p className="text-xs text-charcoal-muted font-semibold mt-2">
                      Phone: {addr.phone}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-cream-200 mt-4 flex justify-end">
                    <button
                      onClick={() => handleDeleteAddress(addr._id)}
                      className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-charcoal-muted">
              No saved addresses found. Add an address for rapid checkout.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

