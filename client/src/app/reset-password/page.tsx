'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      toast.success('Your password has been successfully reset!');
    } catch (err: any) {
      toast.error(err.message || 'Password reset failed or token expired');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl border border-cream-400 p-8 sm:p-10 shadow-royal max-w-md w-full text-center">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-maroon-900">
          Set New Password
        </h1>
        <p className="text-xs text-charcoal-muted mt-2 mb-6">
          Choose a secure new password for your Traditions By Tiya account
        </p>

        {success ? (
          <div className="p-6 bg-cream-50 rounded-2xl border border-cream-400 space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <p className="text-sm font-semibold text-charcoal">
              Your password has been successfully updated.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-2.5 bg-maroon-600 text-cream-100 text-xs font-bold uppercase rounded-lg shadow-sm"
            >
              Sign In Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-1">
                New Password (Min 6 chars)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-maroon-500"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-3 w-4 h-4 text-charcoal-muted" />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-maroon-500"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-3 w-4 h-4 text-charcoal-muted" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-maroon-700 to-maroon-600 hover:from-maroon-800 hover:to-maroon-700 text-cream-100 font-bold text-xs uppercase tracking-wider rounded-xl shadow-royal transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
              <ArrowRight className="w-4 h-4 text-gold-400" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

