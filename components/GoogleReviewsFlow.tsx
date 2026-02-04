'use client';

import { useEffect, useState } from 'react';
import { Star, MessageSquare, ArrowRight, ExternalLink, CheckCircle2 } from 'lucide-react';

/* ========================================
   GOOGLE REVIEWS FLOW COMPONENT
   Visual demonstration of how reviews are
   requested from DMs and submitted to Google.
   ======================================== */

export default function GoogleReviewsFlow() {
  const [step, setStep] = useState(0);
  const [cycleKey, setCycleKey] = useState(0);

  useEffect(() => {
    setStep(0);
    const timeouts: NodeJS.Timeout[] = [];

    const steps = [
      { delay: 800, step: 1 },   // Show DM request
      { delay: 2500, step: 2 },  // Show rating selection
      { delay: 4200, step: 3 },  // Show selected rating
      { delay: 5500, step: 4 },  // Show Google redirect
      { delay: 7000, step: 5 },  // Show success
    ];

    steps.forEach(({ delay, step: s }) => {
      const timeout = setTimeout(() => setStep(s), delay);
      timeouts.push(timeout);
    });

    // Restart loop
    const restartTimeout = setTimeout(() => {
      setCycleKey((prev) => prev + 1);
    }, 10000);
    timeouts.push(restartTimeout);

    return () => timeouts.forEach(clearTimeout);
  }, [cycleKey]);

  return (
    <div className="relative">
      {/* Main Flow Visualization */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Step 1: DM Request */}
        <div className={`relative overflow-hidden rounded-xl border bg-zinc-900/50 p-4 transition-all duration-500 sm:rounded-2xl sm:p-6 ${
          step >= 1 ? 'border-indigo-500/30 shadow-lg shadow-indigo-500/10' : 'border-white/10'
        }`}>
          <div className="absolute -right-8 -top-8 hidden h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl sm:block" />

          <div className="relative">
            {/* Instagram Badge */}
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
                <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                </svg>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Instagram DM</span>
            </div>

            <p className="text-sm font-medium text-zinc-300">
              Automatische Nachricht nach Besuch
            </p>

            {/* Chat Bubble */}
            <div className={`mt-4 transform rounded-2xl rounded-br-md bg-gradient-to-r from-indigo-500 to-violet-500 p-4 transition-all duration-500 ${
              step >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
              <p className="text-sm text-white">
                Danke für deinen Besuch bei uns! Wie war dein Erlebnis?
              </p>
              <div className="mt-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                      step >= 3 && rating === 5
                        ? 'scale-110 border-amber-400 bg-amber-500 text-white'
                        : 'border-white/30 bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {rating === 5 ? '5 ★' : rating}
                  </button>
                ))}
              </div>
            </div>

            {/* Step indicator */}
            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
              <div className={`h-2 w-2 rounded-full transition-colors ${step >= 1 ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
              Trigger: Nach Check-out
            </div>
          </div>
        </div>

        {/* Connector Arrow - Mobile: vertical, Desktop: horizontal */}
        <div className="flex items-center justify-center py-2 lg:hidden">
          <div className={`flex items-center gap-2 transition-all duration-500 ${
            step >= 3 ? 'opacity-100' : 'opacity-30'
          }`}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
              <ArrowRight className="h-4 w-4 rotate-90 text-indigo-400" />
            </div>
          </div>
        </div>
        <div className="hidden items-center justify-center lg:flex">
          <div className={`flex items-center gap-2 transition-all duration-500 ${
            step >= 3 ? 'opacity-100' : 'opacity-30'
          }`}>
            <div className="h-px w-8 bg-gradient-to-r from-indigo-500 to-violet-500" />
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
              <ArrowRight className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="h-px w-8 bg-gradient-to-r from-violet-500 to-amber-500" />
          </div>
        </div>

        {/* Step 2: Google Redirect */}
        <div className={`relative overflow-hidden rounded-xl border bg-zinc-900/50 p-4 transition-all duration-500 sm:rounded-2xl sm:p-6 ${
          step >= 4 ? 'border-amber-500/30 shadow-lg shadow-amber-500/10' : 'border-white/10'
        }`}>
          <div className="absolute -right-8 -top-8 hidden h-24 w-24 rounded-full bg-amber-500/10 blur-2xl sm:block" />

          <div className="relative">
            {/* Google Badge */}
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Google Reviews</span>
            </div>

            <p className="text-sm font-medium text-zinc-300">
              Direkter Link zur Bewertung
            </p>

            {/* Google Review Card */}
            <div className={`mt-4 transform rounded-xl border border-white/10 bg-white p-4 transition-all duration-500 ${
              step >= 4 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
                <div>
                  <p className="text-xs font-semibold text-zinc-900">Lisa M.</p>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-zinc-600">
                Super Service und tolles Ambiente! Kann ich nur empfehlen.
              </p>
            </div>

            {/* Success indicator */}
            <div className={`mt-4 flex items-center gap-2 text-xs transition-all duration-500 ${
              step >= 5 ? 'text-emerald-400' : 'text-zinc-500'
            }`}>
              {step >= 5 ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Bewertung veröffentlicht
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Weiterleitung zu Google
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-4">
        {[
          { value: '+41%', label: 'mehr Reviews', color: 'text-emerald-400' },
          { value: '4.8', label: 'Ø Rating', color: 'text-amber-400' },
          { value: '< 2min', label: 'bis zur Bewertung', color: 'text-indigo-400' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-white/10 bg-zinc-900/50 p-2.5 text-center sm:rounded-xl sm:p-4">
            <div className={`text-lg font-bold sm:text-2xl ${stat.color}`}>{stat.value}</div>
            <div className="mt-0.5 text-[10px] text-zinc-500 sm:mt-1 sm:text-xs">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
