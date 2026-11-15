'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { WelcomeOverlay } from '../../components/common/WelcomeOverlay';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = useState(false);

  // Welcome Animation State
  const [welcomeData, setWelcomeData] = useState<{
    show: boolean;
    userName: string;
    isAdmin: boolean;
    destination: string;
  }>({
    show: false,
    userName: '',
    isAdmin: false,
    destination: '/',
  });

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '42702559018-lcuhkhfmgcclrt3gjsesdtv1pobes3gj.apps.googleusercontent.com';

  const initGoogleAuth = () => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id && GOOGLE_CLIENT_ID) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            if (response.credential) {
              setLoading(true);
              try {
                const googleUser = await loginWithGoogle({ credential: response.credential });
                setWelcomeData({
                  show: true,
                  userName: googleUser?.name || 'Royal Patron',
                  isAdmin: googleUser?.role === 'admin',
                  destination: googleUser?.role === 'admin' ? '/admin' : redirect,
                });
              } catch (err: any) {
                toast.error(err.message || 'Google authentication failed');
              } finally {
                setLoading(false);
              }
            }
          },
        });

        const btnDiv = document.getElementById('googleSignInBtn');
        if (btnDiv) {
          (window as any).google.accounts.id.renderButton(btnDiv, {
            theme: 'outline',
            size: 'large',
            width: '360',
            text: 'continue_with',
            shape: 'pill',
          });
          setIsGoogleScriptLoaded(true);
        }
      } catch (e) {
        console.error('Google Auth Init error:', e);
      }
    }
  };

  useEffect(() => {
    initGoogleAuth();
  }, [isGoogleScriptLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      // Trigger luxurious welcome animation
      setWelcomeData({
        show: true,
        userName: loggedUser?.name || 'Royal Patron',
        isAdmin: loggedUser?.role === 'admin',
        destination: loggedUser?.role === 'admin' ? '/admin' : redirect,
      });
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatedGoogleAuth = async () => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt();
      return;
    }

    try {
      const googleUser = await loginWithGoogle({
        email: 'royal.patron@example.com',
        name: 'Royal Patron',
        googleId: 'google_oauth_mock_123',
      });
      setWelcomeData({
        show: true,
        userName: googleUser?.name || 'Royal Patron',
        isAdmin: googleUser?.role === 'admin',
        destination: googleUser?.role === 'admin' ? '/admin' : redirect,
      });
    } catch (err: any) {
      toast.error('Google Sign-In failed');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      {/* Welcome Animation Overlay */}
      {welcomeData.show && (
        <WelcomeOverlay
          userName={welcomeData.userName}
          isAdmin={welcomeData.isAdmin}
          onFinish={() => router.push(welcomeData.destination)}
        />
      )}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogleAuth}
      />
      <div className="bg-white rounded-3xl border border-cream-400 p-8 sm:p-10 shadow-royal max-w-md w-full">
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600 block mb-1">
            Patron Concierge
          </span>
          <h1 className="font-serif text-3xl font-bold text-maroon-900">
            Sign In to Traditions
          </h1>
          <p className="text-xs text-charcoal-muted mt-2">
            Access your saved addresses, live orders, and private festive curations
          </p>
        </div>

        {/* Google Sign-in */}
        <div className="mb-6 flex flex-col items-center">
          <div id="googleSignInBtn" className="w-full flex justify-center mb-1" />
          {!isGoogleScriptLoaded && (
            <button
              type="button"
              onClick={handleSimulatedGoogleAuth}
              className="w-full py-3 px-4 border border-cream-400 rounded-xl text-xs font-semibold text-charcoal hover:bg-cream-50 transition-colors flex items-center justify-center gap-3 shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>
          )}
        </div>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-cream-300" />
          <span className="px-3 text-[11px] uppercase tracking-wider text-charcoal-muted">or with email</span>
          <div className="flex-grow border-t border-cream-300" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-maroon-500"
                placeholder="you@domain.com"
              />
              <Mail className="absolute left-3 top-3 w-4 h-4 text-charcoal-muted" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-maroon-600 hover:underline font-medium"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-maroon-500"
                placeholder="••••••••"
              />
              <Lock className="absolute left-3 top-3 w-4 h-4 text-charcoal-muted" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-gradient-to-r from-maroon-700 to-maroon-600 hover:from-maroon-800 hover:to-maroon-700 text-cream-100 font-bold text-xs uppercase tracking-wider rounded-xl shadow-royal transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4 text-gold-400" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-cream-300 text-center">
          <p className="text-xs text-charcoal-light">
            New to Traditions By Tiya?{' '}
            <Link href={`/signup?redirect=${redirect}`} className="text-maroon-600 font-bold hover:underline">
              Create an Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

