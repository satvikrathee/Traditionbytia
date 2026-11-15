'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      toast.success('Password reset instructions sent!');
    } catch (err: any) {
      toast.error(err.message || 'Error requesting password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl border border-cream-400 p-8 sm:p-10 shadow-royal max-w-md w-full text-center">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-maroon-900">
          Recover Your Password
        </h1>
        <p className="text-xs text-charcoal-muted mt-2 mb-6">
          Enter your registered email address and we will dispatch a secure reset link.
        </p>

        {submitted ? (
          <div className="p-6 bg-cream-50 rounded-2xl border border-cream-400 space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <p className="text-sm font-semibold text-charcoal">
              If an account is associated with <strong>{email}</strong>, you will receive an email shortly.
            </p>
            <Link
              href="/login"
              className="inline-block text-xs font-bold text-maroon-600 uppercase tracking-wider hover:underline"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-1">
                Account Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-maroon-500"
                  placeholder="your.email@domain.com"
                />
                <Mail className="absolute left-3 top-3 w-4 h-4 text-charcoal-muted" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-maroon-700 to-maroon-600 hover:from-maroon-800 hover:to-maroon-700 text-cream-100 font-bold text-xs uppercase tracking-wider rounded-xl shadow-royal transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Dispatching Link...' : 'Send Reset Link'}
              <ArrowRight className="w-4 h-4 text-gold-400" />
            </button>

            <div className="text-center pt-4">
              <Link href="/login" className="text-xs text-charcoal-muted hover:text-maroon-600">
                Remember your password? Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

