'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, CheckCircle2, Clock, ExternalLink, Star, Zap } from 'lucide-react';

type GoogleReviewsFlowProps = {
  compact?: boolean;
};

function InstagramAvatar() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-gradient-to-br from-fuchsia-500 via-pink-500 to-orange-400">
      <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    </div>
  );
}

function GoogleG({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function CompactReviewsFlow() {
  return (
    <div className="rounded-[34px] border border-white/55 bg-white/46 p-6 shadow-[0_12px_34px_rgba(28,53,122,0.08),inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-md xl:p-7">
      <div className="rounded-[14px] border border-[#d9ddea] bg-white px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <div className="flex items-center gap-3">
          <InstagramAvatar />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium leading-none text-[#232738]">Instagram DM</p>
            <p className="mt-1 text-[11px] text-[#a2a7b8]">Kunde · nach dem Besuch</p>
          </div>
          <span className="inline-flex h-3 w-3 rounded-full bg-[#4be2a1] shadow-[0_0_10px_rgba(75,226,161,0.7)]" />
        </div>
        <div className="mt-4 rounded-[12px] bg-[#f5f5f8] px-4 py-3 text-[13px] leading-relaxed text-[#444a59]">
          Danke für deinen Besuch! Wie war dein Erlebnis?
        </div>
        <div className="mt-3 flex items-center gap-2">
          {[1, 2, 3, 4].map((rating) => (
            <span
              key={rating}
              className="inline-flex h-7 min-w-9 items-center justify-center rounded-[10px] border border-[#d8ddea] bg-white px-3 text-[11px] font-medium text-[#656f86]"
            >
              {rating}
            </span>
          ))}
          <span className="inline-flex h-7 min-w-10 items-center justify-center rounded-[10px] bg-[#6366f1] px-3 text-[11px] font-semibold text-white shadow-[0_6px_14px_rgba(99,102,241,0.25)]">
            5★
          </span>
        </div>
      </div>

      <div className="relative flex h-16 items-center justify-center">
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#e4e6ee]" />
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#d7dbe7] bg-white text-[#9aa3b7] shadow-[0_8px_18px_rgba(76,91,125,0.08)]">
          <ArrowDown className="h-5 w-5" />
        </span>
      </div>

      <div className="overflow-hidden rounded-[16px] bg-white shadow-[0_18px_40px_rgba(76,91,125,0.16)] ring-1 ring-[#eef1f7]">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e3e8f2] bg-white shadow-sm">
            <GoogleG className="h-3.5 w-3.5" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7480a0]">Google Reviews</p>
          <div className="ml-auto flex items-center gap-1">
            {[0,1,2,3,4].map((i) => (
              <Star key={i} className="h-3 w-3 fill-[#fbbc04] text-[#fbbc04]" />
            ))}
            <span className="ml-1 text-[11px] font-semibold text-[#3c4257]">4,9</span>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="rounded-[14px] border border-[#e8eaf0] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            {/* Reviewer row */}
            <div className="flex items-start gap-3">
              {/* Google-style colored avatar */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1a73e8] text-[13px] font-semibold text-white shadow-sm">
                L
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold leading-tight text-[#202124]">Lisa Müller</p>
                <p className="mt-0.5 text-[11px] text-[#70757a]">Ortskundige Guide · 4 Bewertungen</p>
              </div>
              <GoogleG className="h-4 w-4 flex-shrink-0 mt-0.5" />
            </div>

            {/* Stars + date */}
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[0, 1, 2, 3, 4].map((star) => (
                  <Star key={star} className="h-4 w-4 fill-[#fbbc04] text-[#fbbc04]" />
                ))}
              </div>
              <span className="text-[11px] text-[#70757a]">vor 2 Tagen</span>
            </div>

            {/* Review text */}
            <p className="mt-2.5 text-[13px] leading-relaxed text-[#202124]">
              Super Service und tolles Ambiente! Kann ich nur empfehlen.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-[#eef1f7] px-4 py-3 text-[#35b77a]">
          <CheckCircle2 className="h-4 w-4" />
          <p className="text-[11px]">Bewertung veröffentlicht</p>
        </div>
      </div>
    </div>
  );
}

function FullReviewsFlow() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % 6);
    }, 1600);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative">
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-black/8 bg-white/90 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.05)] sm:p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <InstagramAvatar />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6b7490]">Instagram DM</span>
          </div>

          <p className="text-base font-semibold text-[#171923]">Automatische Nachricht nach Besuch</p>

          <div className={`mt-4 transform transition-all duration-500 ${step >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
            <div className="inline-flex max-w-[260px] rounded-2xl rounded-bl-sm bg-[linear-gradient(135deg,#7d8eef_0%,#8a72e8_100%)] px-4 py-3 text-sm leading-relaxed text-white shadow-[0_8px_20px_rgba(92,87,214,0.2)]">
              Danke für deinen Besuch bei uns! Wie war dein Erlebnis?
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  className={`min-w-[40px] rounded-xl border px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                    step >= 3 && rating === 5
                      ? 'border-indigo-400 bg-indigo-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)]'
                      : 'border-black/12 bg-white text-[#333]'
                  }`}
                >
                  {rating === 5 ? '5★' : rating}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-[#6b7490]">
            <div className={`h-2 w-2 rounded-full transition-colors ${step >= 1 ? 'bg-emerald-400' : 'bg-black/15'}`} />
            Trigger: Nach Check-out
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className={`flex items-center gap-2 transition-all duration-500 ${step >= 3 ? 'opacity-100' : 'opacity-25'}`}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm lg:hidden">
              <ArrowRight className="h-4 w-4 rotate-90 text-[#5570b9]" />
            </div>
            <div className="hidden items-center gap-1.5 lg:flex">
              <div className="h-px w-6 bg-black/15" />
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
                <ArrowRight className="h-4 w-4 text-[#5570b9]" />
              </div>
              <div className="h-px w-6 bg-black/15" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/8 bg-white/90 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.05)] sm:p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/8 bg-white">
              <GoogleG className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6b7490]">Google Reviews</span>
          </div>

          <p className="text-base font-semibold text-[#171923]">Direkter Link zur Bewertung</p>

          <div className={`mt-4 transform rounded-xl border border-black/8 bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-500 ${step >= 4 ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">LM</div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">Lisa M.</p>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-3 w-3 fill-[#fbbc04] text-[#fbbc04]" />)}
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600">Super Service und tolles Ambiente! Kann ich nur empfehlen.</p>
          </div>

          <div className={`mt-4 flex items-center gap-2 text-xs transition-all duration-500 ${step >= 5 ? 'text-emerald-600' : 'text-[#6b7490]'}`}>
            {step >= 5
              ? <><CheckCircle2 className="h-4 w-4" />Bewertung veröffentlicht</>
              : <><ExternalLink className="h-4 w-4" />Weiterleitung zu Google</>
            }
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
        {[
          { icon: Zap, label: 'Vollautomatisch', detail: 'Kein manuelles Nachfassen – die Anfrage geht nach dem Besuch automatisch raus.' },
          { icon: ExternalLink, label: 'Direktlink zu Google', detail: 'Ein Klick zur Bewertungsseite – kein Suchen, kein Umweg.' },
          { icon: Clock, label: 'Richtiger Zeitpunkt', detail: 'Die Nachricht wird gesendet, wenn das Erlebnis noch frisch ist.' },
        ].map(({ icon: Icon, label, detail }) => (
          <div key={label} className="flex items-start gap-3 rounded-xl border border-black/8 bg-white/70 p-4 sm:p-5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-black/8 bg-white text-[#5570b9]">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#171923]">{label}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#6b7490]">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GoogleReviewsFlow({ compact = false }: GoogleReviewsFlowProps) {
  return compact ? <CompactReviewsFlow /> : <FullReviewsFlow />;
}
