'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { Users, Search, Phone, Mail, MapPin, ShoppingBag } from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get('/admin/customers');
        if (res.success) {
          setCustomers(res.customers);
        }
      } catch (err) {
        console.error('Failed to fetch customers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600 block">
          Patron Directory
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-maroon-900 mt-0.5">
          Registered Patrons ({customers.length})
        </h1>
        <p className="text-xs text-charcoal-muted mt-1">
          Registered client accounts, order volume, and lifetime value analytics.
        </p>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-cream-400 shadow-sm max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Search patrons by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-cream-50 border border-cream-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-maroon-500"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-charcoal-muted" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-cream-400 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-cream-100 text-charcoal-muted uppercase tracking-wider font-semibold border-b border-cream-300">
                <th className="p-4">Patron Name &amp; Email</th>
                <th className="p-4">Contact Phone</th>
                <th className="p-4">Total Orders</th>
                <th className="p-4">Lifetime Spend</th>
                <th className="p-4">Saved Locations</th>
                <th className="p-4 text-right">Patron Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200 text-charcoal">
              {filtered.map((c) => (
                <tr key={c._id} className="hover:bg-cream-50 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-sm text-charcoal block">{c.name}</span>
                    <span className="text-[11px] text-charcoal-muted flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-gold-600" /> {c.email}
                    </span>
                  </td>

                  <td className="p-4 text-charcoal-muted font-medium">
                    {c.phone ? (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gold-600" /> {c.phone}
                      </span>
                    ) : (
                      'Not provided'
                    )}
                  </td>

                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cream-100 border border-cream-300 text-maroon-800">
                      <ShoppingBag className="w-3 h-3 text-gold-600" />
                      {c.orderCount} order{c.orderCount !== 1 ? 's' : ''}
                    </span>
                  </td>

                  <td className="p-4 font-bold text-sm text-maroon-700">
                    &#8377;{(c.totalSpent || 0).toLocaleString('en-IN')}
                  </td>

                  <td className="p-4 text-[11px] text-charcoal-light">
                    {c.addresses?.length > 0 ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gold-600 flex-shrink-0" />
                        {c.addresses[0].city}, {c.addresses[0].state}
                        {c.addresses.length > 1 && ` (+${c.addresses.length - 1} more)`}
                      </span>
                    ) : (
                      'None'
                    )}
                  </td>

                  <td className="p-4 text-right text-charcoal-muted">
                    {new Date(c.joinedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

