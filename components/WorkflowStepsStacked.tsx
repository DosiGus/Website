'use client'
import { useEffect, useRef, useState } from 'react'

const STEPS = [
  {
    step: '01',
    title: 'Verbinden',
    description: 'Instagram, Facebook und WhatsApp verbinden – wir übernehmen den Setup.',
    detail: 'Zugangsdaten einmalig eintragen. Alle Kanäle laufen dann automatisch.',
    from: '#6366f1',
    to: '#8b5cf6',
  },
  {
    step: '02',
    title: 'Konfigurieren',
    description: 'Vorlagen übernehmen, Sprache & Übergaben an dein Team definieren.',
    detail: 'Texte, Buttons und Ablauf-Logik im visuellen Editor anpassen – ohne Code.',
    from: '#8b5cf6',
    to: '#a855f7',
  },
  {
    step: '03',
    title: 'Live schalten',
    description: 'Antworten, Buchungen und Reviews laufen stabil – mit vollständigem Reporting.',
    detail: 'Alle Konversationen, Buchungen und Metriken übersichtlich im Dashboard.',
    from: '#4f46e5',
    to: '#06b6d4',
  },
]

const N = STEPS.length
const TITLE_H = 76   // collapsed title bar height in px
const CARD_H  = 308  // full card height in px

function arrive(j: number, t: number): number {
  return Math.max(0, Math.min(1, (t - (j - 0.5)) / 0.5))
}

function stackTY(i: number, t: number): number {
  let sum = 0
  for (let k = i + 1; k < N; k++) sum += arrive(k, t)
  return -TITLE_H * sum
}

export default function WorkflowStepsStacked() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [prog, setProg] = useState(0)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onScroll = () => {
      const scrollable = el.offsetHeight - window.innerHeight
      if (scrollable <= 0) return
      setProg(Math.max(0, Math.min(1, -el.getBoundingClientRect().top / scrollable)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const t = prog * (N - 0.5) // 0 → 2.5

  return (
    <div ref={wrapRef} style={{ height: '320vh' }} className="relative">
      <div className="sticky top-0 h-screen flex flex-col overflow-hidden">

        {/* Solid background — no bleed-through */}
        <div className="pointer-events-none absolute inset-0 bg-zinc-950" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900/80" />

        {/* ── Heading — z-20 + solid bg acts as shield over any card that rises up ── */}
        <div className="relative z-20 flex-none bg-zinc-950 px-4 pt-20 pb-8 text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Ablauf
          </span>
          <h2 className="mt-3 font-display text-4xl font-medium tracking-tight sm:text-5xl">
            In Minuten live, nicht in Tagen
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-zinc-400 sm:text-lg">
            Fertige Templates und geführtes Setup bringen dich schnell ans Ziel.
          </p>
        </div>

        {/* ── Card area — pt-44 = 176px = (N-1)×TITLE_H + 24px buffer, guarantees no overlap ── */}
        <div className="relative z-10 flex flex-1 justify-center px-4 pt-44">

          {/* Connecting path: heading → first card, fades on scroll */}
          <svg
            className="pointer-events-none absolute left-1/2 -translate-x-1/2"
            style={{ top: 12, opacity: Math.max(0, 1 - t * 2) }}
            width="24"
            height="148"
            viewBox="0 0 24 148"
            fill="none"
          >
            <defs>
              <linearGradient id="connGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.1" />
                <stop offset="55%"  stopColor="#6366f1" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.25" />
              </linearGradient>
            </defs>
            {/* Dashed line */}
            <line
              x1="12" y1="0" x2="12" y2="130"
              stroke="url(#connGrad)"
              strokeWidth="1.5"
              strokeDasharray="4 7"
              strokeLinecap="round"
            />
            {/* Chevron arrow */}
            <path
              d="M 5 124 L 12 132 L 19 124"
              stroke="#7c3aed"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.5"
            />
          </svg>
          <div
            className="relative w-full max-w-2xl"
            style={{ height: CARD_H }}
          >
            {STEPS.map((step, i) => {
              const p = t - i

              let ty: number, opacity: number, scale: number

              if (p < 0) {
                // Upcoming — enter from below
                const entry = Math.min(1, -p * 2)
                ty      = entry * 320
                opacity = 1 - entry
                scale   = 1 - entry * 0.04
              } else {
                // Active or past — solid, no transparency
                ty      = stackTY(i, t)
                opacity = 1
                scale   = 1 - Math.max(0, p - 1) * 0.008
              }

              const isActive = p >= 0 && p < 1

              return (
                <div
                  key={step.step}
                  className="absolute inset-x-0 overflow-hidden rounded-2xl border border-white/[0.09]"
                  style={{
                    zIndex: i + 1,
                    top: 0,
                    height: CARD_H,
                    // Fully opaque backgrounds — no text bleed-through
                    backgroundColor: isActive ? '#2a2a30' : '#1e1e23',
                    boxShadow: isActive
                      ? '0 0 0 1px rgba(255,255,255,0.08), 0 24px 48px -12px rgba(0,0,0,0.6)'
                      : '0 0 0 1px rgba(255,255,255,0.05)',
                    transform: `translateY(${ty}px) scale(${scale})`,
                    opacity,
                    willChange: 'transform',
                  }}
                >
                  {/* Accent line on active card */}
                  {isActive && (
                    <div
                      className="absolute left-0 top-0 h-full w-0.5 rounded-l-2xl"
                      style={{ background: `linear-gradient(to bottom, ${step.from}, ${step.to})` }}
                    />
                  )}

                  {/* Title bar */}
                  <div className="flex items-center gap-4 px-8" style={{ height: TITLE_H }}>
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${step.from}, ${step.to})` }}
                    >
                      {step.step}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                  </div>

                  {/* Divider */}
                  <div className="mx-8 h-px bg-zinc-700/40" />

                  {/* Content */}
                  <div className="px-8 pt-6 space-y-3">
                    <p className="text-lg leading-relaxed text-zinc-200">
                      {step.description}
                    </p>
                    <p className="text-base leading-relaxed text-zinc-500">
                      {step.detail}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
