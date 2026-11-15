'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { User, Mail, Lock, Phone, ArrowRight, ShieldCheck, Clock, RefreshCw, KeyRound, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const { sendSignupOtp, verifySignupOtp } = useAuth();

  // Form State
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP State
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 minutes (300s)
  const [timerActive, setTimerActive] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // 5-minute countdown timer
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Step 1: Send 4-Digit OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      let res: any;
      if (typeof sendSignupOtp === 'function') {
        res = await sendSignupOtp(name, email, password, phone);
      } else {
        res = await api.post('/auth/send-signup-otp', { name, email, password, phone });
      }

      if (res.success) {
        toast.success(res.message || '4-digit verification code sent to your email!');
        setStep('otp');
        setOtp(['', '', '', '']);
        setTimerSeconds(300); // 5 minutes
        setTimerActive(true);
      } else {
        toast.error(res.message || 'Failed to send verification code');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate registration');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP input change (4 individual boxes with auto-focus)
  const handleOtpChange = (index: number, val: string) => {
    if (/^[0-9]?$/.test(val)) {
      const newOtp = [...otp];
      newOtp[index] = val;
      setOtp(newOtp);

      // Auto-advance to next box
      if (val && index < 3) {
        const nextInput = document.getElementById(`otp-box-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-box-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Step 2: Verify 4-Digit OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('').trim();
    if (otpCode.length !== 4) {
      toast.error('Please enter the complete 4-digit verification code');
      return;
    }

    if (timerSeconds <= 0) {
      toast.error('Verification code has expired (valid for 5 minutes only). Please request a new code.');
      return;
    }

    setLoading(true);
    try {
      let user: any = null;
      if (typeof verifySignupOtp === 'function') {
        user = await verifySignupOtp(email, otpCode);
      } else {
        const res = await api.post('/auth/verify-signup-otp', { email, otp: otpCode });
        if (res.success && res.user) {
          if (res.token) {
            localStorage.setItem('token', res.token);
          }
          user = res.user;
        }
      }

      if (user) {
        try {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch {}
        toast.success('Your royal account is verified! Welcome to Traditions By Tiya.', { icon: '👑', duration: 5000 });
        if (user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push(redirect);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (timerSeconds > 240) {
      toast.error('Please wait a moment before requesting another code');
      return;
    }

    setResending(true);
    try {
      let res: any;
      if (typeof sendSignupOtp === 'function') {
        res = await sendSignupOtp(name, email, password, phone);
      } else {
        res = await api.post('/auth/send-signup-otp', { name, email, password, phone });
      }

      if (res.success) {
        toast.success('New 4-digit code sent to your email!');
        setOtp(['', '', '', '']);
        setTimerSeconds(300); // 5 minutes
        setTimerActive(true);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl border border-cream-400 p-8 sm:p-10 shadow-royal max-w-md w-full">
        {step === 'form' ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600 block mb-1">
                Join the Heritage Family
              </span>
              <h1 className="font-serif text-3xl font-bold text-maroon-900">
                Create Your Account
              </h1>
              <p className="text-xs text-charcoal-muted mt-2">
                Experience handcrafted luxury, private previews, and real-time order concierge
              </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-maroon-500"
                    placeholder="Enter your full name"
                  />
                  <User className="absolute left-3 top-3 w-4 h-4 text-charcoal-muted" />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-maroon-500"
                    placeholder="Enter your email address"
                  />
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-charcoal-muted" />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-1">
                  Mobile Phone (Optional)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-cream-50 border border-cream-400 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-maroon-500"
                    placeholder="Enter 10-digit mobile number"
                  />
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-charcoal-muted" />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted block mb-1">
                  Password * (Min 6 characters)
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
                  Confirm Password *
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
                className="w-full mt-4 py-3.5 bg-gradient-to-r from-maroon-700 to-maroon-600 hover:from-maroon-800 hover:to-maroon-700 text-cream-100 font-bold text-xs uppercase tracking-wider rounded-xl shadow-royal transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Sending 4-Digit Code...' : 'Send Verification Code'}
                <ArrowRight className="w-4 h-4 text-gold-400" />
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-cream-300 text-center">
              <p className="text-xs text-charcoal-light">
                Already have an account?{' '}
                <Link href={`/login?redirect=${redirect}`} className="text-maroon-600 font-bold hover:underline">
                  Sign In Here
                </Link>
              </p>
            </div>
          </>
        ) : (
          /* Step 2: 4-Digit OTP Screen */
          <div className="space-y-6">
            <button
              onClick={() => setStep('form')}
              className="inline-flex items-center gap-1.5 text-xs text-charcoal-muted hover:text-maroon-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to details
            </button>

            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-maroon-50 border border-gold-400/40 rounded-2xl flex items-center justify-center text-maroon-700 shadow-sm">
                <KeyRound className="w-7 h-7 text-gold-600" />
              </div>
              <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600 block mb-1">
                Security Verification
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-maroon-900">
                Enter 4-Digit Code
              </h2>
              <p className="text-xs text-charcoal-light mt-2 leading-relaxed">
                We sent a 4-digit code to your registered email <br />
                <strong className="text-maroon-800">{email}</strong>
              </p>
            </div>

            {/* 4-Digit Box Inputs */}
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-center gap-3 sm:gap-4">
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    id={`otp-box-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[idx]}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-14 h-16 sm:w-16 sm:h-20 text-center text-2xl sm:text-3xl font-bold font-mono text-maroon-900 bg-cream-50 border-2 border-gold-400/60 rounded-2xl focus:border-maroon-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all shadow-sm"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              {/* 5-Minute Timer Display */}
              <div className="text-center">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                    timerSeconds > 0
                      ? 'bg-amber-50 text-amber-800 border border-amber-300'
                      : 'bg-red-50 text-red-700 border border-red-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {timerSeconds > 0 ? (
                    <span>Valid for: <strong>{formatTimer(timerSeconds)}</strong></span>
                  ) : (
                    <span>Code expired (5 minutes passed)</span>
                  )}
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || otp.join('').length !== 4 || timerSeconds <= 0}
                className="w-full py-3.5 bg-gradient-to-r from-maroon-700 to-maroon-600 hover:from-maroon-800 hover:to-maroon-700 text-cream-100 font-bold text-xs uppercase tracking-wider rounded-xl shadow-royal transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying Code...' : 'Verify & Create Account'}
                <ShieldCheck className="w-4 h-4 text-gold-400" />
              </button>
            </form>

            {/* Resend Action */}
            <div className="pt-4 border-t border-cream-300 text-center space-y-2">
              <p className="text-xs text-charcoal-muted">Didn&apos;t receive the code or expired?</p>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending || timerSeconds > 240}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-maroon-700 hover:text-maroon-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                {resending ? 'Sending New Code...' : 'Resend 4-Digit Code'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
