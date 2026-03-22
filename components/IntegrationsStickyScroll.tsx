'use client';

import { useEffect, useRef, useState } from 'react';
import GoogleCalendarSyncDemo from './GoogleCalendarSyncDemo';
import GoogleReviewsFlow from './GoogleReviewsFlow';

const SECTIONS = [
  {
    tag: 'Integrationen',
    label: 'Kalender Sync',
    heading: 'Termine direkt in deinem Kalender.',
    description:
      'Wesponde prüft freie Slots in deinem Google Kalender und trägt bestätigte Buchungen automatisch ein – du siehst jeden Termin sofort, ohne manuell etwas übertragen zu müssen.',
  },
  {
    tag: null,
    label: 'Google Bewertungen',
    heading: 'Feedback nach dem Besuch anstoßen',
    description:
      'Versende nach jedem abgeschlossenen Termin eine persönliche Nachricht, die deine Kunden um ihr Feedback bittet – so bekommst du mehr Google-Rezensionen ohne Aufwand.',
  },
] as const;

function TextContent({
  section,
  active,
  fillRef,
}: {
  section: (typeof SECTIONS)[number];
  active: boolean;
  fillRef?: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div
      className={`flex items-stretch gap-5 transition-all duration-500 ${
        active ? 'opacity-100' : 'opacity-35'
      }`}
    >
      {/* Progress bar — only on desktop (rendered via fillRef presence) */}
      {fillRef && (
        <div className="relative w-[3px] flex-shrink-0 rounded-full bg-[#dde2ee]">
          <div
            ref={fillRef}
            className="absolute inset-x-0 top-0 rounded-full bg-[#2450b2]"
            style={{ height: '0%' }}
          />
        </div>
      )}

      <div className="max-w-sm">
        {section.tag && (
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-14 bg-[#8ea6de]" />
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#2450b2]">
              {section.tag}
            </p>
          </div>
        )}
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4c546f]">
          {section.label}
        </p>
        <h3
          className="mt-3 text-3xl font-semibold tracking-tight text-[#171923] sm:text-4xl"
          style={{ fontFamily: 'var(--font-home-display)' }}
        >
          {section.heading}
        </h3>
        <p className="mt-3 font-mono text-[14px] leading-relaxed text-[#2450b2]">
          {section.description}
        </p>
      </div>
    </div>
  );
}

export default function IntegrationsStickyScroll() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const fill1Ref = useRef<HTMLDivElement>(null);
  const fill2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let current = 0;
    let rafId: number;

    const tick = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const scrolled = -rect.top;
        const scrollable = containerRef.current.offsetHeight - window.innerHeight;

        if (scrollable > 0) {
          const progress = Math.max(0, Math.min(1, scrolled / scrollable));

          // Fill bars directly — no React state, smooth 60fps
          if (fill1Ref.current) {
            fill1Ref.current.style.height = `${Math.min(100, (progress / 0.5) * 100)}%`;
          }
          if (fill2Ref.current) {
            fill2Ref.current.style.height = `${Math.max(0, ((progress - 0.5) / 0.5) * 100)}%`;
          }

          const next = progress >= 0.5 ? 1 : 0;
          if (next !== current) {
            current = next;
            setActiveIndex(next);
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <>
      {/* ── Mobile: stacked ──────────────────────────────────────── */}
      <div className="space-y-16 py-16 sm:py-20 lg:hidden">
        <div>
          <TextContent section={SECTIONS[0]} active />
          <div className="mt-8">
            <GoogleCalendarSyncDemo compact />
          </div>
        </div>
        <div>
          <TextContent section={SECTIONS[1]} active />
          <div className="mt-8">
            <GoogleReviewsFlow compact />
          </div>
        </div>
      </div>

      {/* ── Desktop: sticky scroll ───────────────────────────────── */}
      {/*
        containerRef ist die Source of Truth für den Scroll-Fortschritt.
        progress = scrolled / (containerHeight - viewportHeight)
        Switch bei progress 0.5 = exakt in der Hälfte des Scroll-Weges.
      */}
      <div
        ref={containerRef}
        className="hidden lg:grid lg:grid-cols-[1fr_minmax(0,640px)] lg:items-start lg:gap-24"
      >
        {/* Left: natürlicher Scroll */}
        <div>
          <div className="pt-[35vh] pb-[55vh]">
            <TextContent section={SECTIONS[0]} active={activeIndex === 0} fillRef={fill1Ref} />
          </div>
          <div className="pt-[35vh] pb-[55vh]">
            <TextContent section={SECTIONS[1]} active={activeIndex === 1} fillRef={fill2Ref} />
          </div>
        </div>

        {/* Right: sticky Demo-Panel */}
        <div className="sticky top-0 flex h-screen items-start pt-[30vh]">
          <div className="grid w-full">

            {/* Demo 1 — Calendar */}
            <div
              className={`col-start-1 row-start-1 transition-all duration-700 ease-in-out ${
                activeIndex === 0
                  ? 'z-10 opacity-100 translate-y-0'
                  : 'z-0 pointer-events-none opacity-0 -translate-y-4'
              }`}
            >
              <GoogleCalendarSyncDemo compact />
            </div>

            {/* Demo 2 — Reviews */}
            <div
              className={`col-start-1 row-start-1 transition-all duration-700 ease-in-out ${
                activeIndex === 1
                  ? 'z-10 opacity-100 translate-y-0'
                  : 'z-0 pointer-events-none opacity-0 translate-y-4'
              }`}
            >
              <GoogleReviewsFlow compact />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
