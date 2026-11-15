'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Crown, Sparkles, CheckCircle2 } from 'lucide-react';

interface WelcomeOverlayProps {
  userName?: string;
  isAdmin?: boolean;
  onFinish?: () => void;
}

export const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({
  userName = 'Royal Patron',
  isAdmin = false,
  onFinish,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Launch celebratory royal confetti bursts
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#C9A24B', '#7B1E3A', '#FFF8EE', '#D4AF37', '#521225'],
      });

      const timer2 = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#C9A24B', '#7B1E3A', '#D4AF37'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#C9A24B', '#7B1E3A', '#D4AF37'],
        });
      }, 400);

      return () => clearTimeout(timer2);
    } catch (e) {
      // Confetti fallback
    }
  }, []);

  useEffect(() => {
    // Smooth progress bar filling up over ~2 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 90);

    const finishTimeout = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2200);

    return () => {
      clearInterval(interval);
      clearTimeout(finishTimeout);
    };
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#2D0712] via-[#521225] to-[#1A0309] text-cream-100 overflow-hidden animate-in fade-in duration-300">
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(201,162,75,0.22)_0%,transparent_70%)] blur-3xl animate-pulse" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-maroon-700/30 blur-2xl rounded-full" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-gold-500/20 blur-2xl rounded-full" />

        {/* Subtle geometric gold dot matrix */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(#C9A24B 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Center Welcome Card */}
      <div className="relative z-10 max-w-md w-full mx-4 p-8 sm:p-10 text-center rounded-3xl bg-maroon-950/80 border-2 border-gold-500/40 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-6 animate-in zoom-in-95 duration-500">
        {/* Animated Medallion with Crown */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          {/* Pulsating golden ring */}
          <div className="absolute inset-0 rounded-full border-2 border-gold-400/40 animate-ping opacity-60" />
          <div className="absolute -inset-2 rounded-full border border-dashed border-gold-400/30 animate-spin" style={{ animationDuration: '20s' }} />

          <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-maroon-800 via-gold-600 to-gold-400 p-[2px] shadow-gold">
            <div className="w-full h-full rounded-full bg-maroon-900 flex items-center justify-center flex-col shadow-inner">
              <Crown className="w-8 h-8 text-gold-400 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gold-500/20 border border-gold-400/40 text-[11px] font-bold uppercase tracking-[0.25em] text-gold-300">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            {isAdmin ? 'Welcome Administrator' : 'Welcome to the Royal Family'}
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-cream-100 leading-snug">
            Welcome, <span className="text-gold-400 italic">{userName}</span>
          </h2>

          <p className="text-xs text-cream-300 max-w-xs mx-auto font-light leading-relaxed">
            {isAdmin
              ? 'Opening your live administrator control room and order telemetry...'
              : 'Preparing your exclusive handcrafted trunk shows and private atelier curations...'}
          </p>
        </div>

        {/* Shimmering Gold Progress Bar */}
        <div className="space-y-2 pt-2">
          <div className="w-full h-2 rounded-full bg-maroon-900/90 border border-gold-500/30 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-500 rounded-full transition-all duration-150 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-gold-400/80 uppercase tracking-widest font-semibold px-1">
            <span>Authenticating Patron</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
