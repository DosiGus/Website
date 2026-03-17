'use client';

import GoogleCalendarSyncDemo from './GoogleCalendarSyncDemo';
import GoogleReviewsFlow from './GoogleReviewsFlow';

export default function IntegrationsStickyScroll() {
  return (
    <div className="py-16 sm:py-20 lg:py-24">

      {/* ── Sektion 1: Kalender Sync ─────────────────────────────── */}
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_minmax(0,600px)] lg:gap-16">

        {/* Text links */}
        <div>
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-14 bg-[#8ea6de]" />
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#2450b2]">
              Integrationen
            </p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4c546f]">
            Kalender Sync
          </p>
          <h3
            className="mt-3 text-3xl font-semibold tracking-tight text-[#171923] sm:text-4xl"
            style={{ fontFamily: 'var(--font-home-display)' }}
          >
            Verfügbarkeit automatisch prüfen
          </h3>
          <p className="mt-3 max-w-[280px] font-mono text-[14px] leading-relaxed text-[#2450b2]">
            Freie Slots prüfen, passende Zeit bestätigen und direkt im Kalender eintragen.
          </p>
        </div>

        {/* Demo rechts */}
        <div className="rounded-[20px] bg-[#f0f0ee] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <GoogleCalendarSyncDemo compact />
        </div>

      </div>

      {/* Trenner */}
      <div className="my-16 h-px bg-black/8 sm:my-20" />

      {/* ── Sektion 2: Google Bewertungen ────────────────────────── */}
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_minmax(0,600px)] lg:gap-16">

        {/* Text links */}
        <div>
          <div className="flex gap-4">
            <div className="mt-0.5 w-0.5 self-stretch rounded-full bg-[#2450b2]" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4c546f]">
                Google Bewertungen
              </p>
              <h3
                className="mt-3 text-3xl font-semibold tracking-tight text-[#171923] sm:text-4xl"
                style={{ fontFamily: 'var(--font-home-display)' }}
              >
                Feedback nach dem Besuch anstoßen
              </h3>
              <p className="mt-3 max-w-[280px] font-mono text-[14px] leading-relaxed text-[#2450b2]">
                Nach dem Termin automatisch freundlich nach einer Google-Bewertung fragen.
              </p>
            </div>
          </div>
        </div>

        {/* Demo rechts */}
        <div className="rounded-[20px] bg-[#f0f0ee] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <GoogleReviewsFlow compact />
        </div>

      </div>

    </div>
  );
}
