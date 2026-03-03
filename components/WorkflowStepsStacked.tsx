'use client'
import { useEffect, useRef } from 'react'

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
const TITLE_H = 72   // visible height when stacked
const CARD_H  = 300  // full card height

// Smooth deceleration curve – feels like spring landing
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

export default function WorkflowStepsStacked() {
  const wrapRef  = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const dotRefs  = useRef<(HTMLDivElement | null)[]>([])
  const rafId    = useRef(0)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    const update = () => {
      const scrollable = wrap.offsetHeight - window.innerHeight
      if (scrollable <= 0) return

      const rawProg = Math.max(0, Math.min(1, -wrap.getBoundingClientRect().top / scrollable))
      // t: 0 → N-0.5  (last card is fully seated at t = N-0.5)
      const t = rawProg * (N - 0.5)

      for (let i = 0; i < N; i++) {
        const card = cardRefs.current[i]
        const dot  = dotRefs.current[i]
        if (!card) continue

        // How far later cards have "landed" (pushes this card upward)
        // Card k starts entering at t = k-0.5, fully seated at t = k
        let stackPush = 0
        for (let k = i + 1; k < N; k++) {
          const raw = Math.max(0, Math.min(1, (t - k + 0.5) / 0.5))
          stackPush += easeOutQuart(raw)
        }

        // This card's own entry progress:
        // Enters from below between t = i-0.5 and t = i
        const p = t - i
        let ty: number, opacity: number, scale: number

        if (p < 0) {
          // Not yet seated — sliding in from below
          const rawEntry = Math.max(0, Math.min(1, p / 0.5 + 1)) // 0→1 as p: -0.5→0
          const entry = easeOutQuart(rawEntry)
          ty      = (1 - entry) * (CARD_H + 80)
          opacity = entry
          scale   = 0.96 + 0.04 * entry
        } else {
          // Seated — only stacking translation applies
          ty      = -TITLE_H * stackPush
          opacity = 1
          scale   = 1 - stackPush * 0.012
        }

        // Apply directly to DOM — zero React overhead
        card.style.transform = `translate3d(0, ${ty}px, 0) scale(${scale})`
        card.style.opacity   = String(Math.max(0, opacity))

        // Active = seated and not yet being pushed
        const isActive = p >= 0 && stackPush < 0.05
        card.dataset.active = isActive ? 'true' : 'false'

        if (dot) {
          dot.style.opacity          = isActive ? '1' : '0.25'
          dot.style.transform        = isActive ? 'scale(1.3)' : 'scale(1)'
          dot.style.backgroundColor  = isActive ? STEPS[i].from : ''
        }
      }
    }

    const onScroll = () => {
      cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId.current)
    }
  }, [])

  return (
    <div ref={wrapRef} style={{ height: '320vh' }} className="relative">
      <div className="sticky top-0 h-screen flex flex-col overflow-hidden">

        {/* Solid background — prevents any bleed-through */}
        <div className="pointer-events-none absolute inset-0 bg-zinc-950" />

        {/* Heading */}
        <div className="relative z-20 flex-none bg-zinc-950 px-4 pt-20 pb-8 text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Ablauf
          </span>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            In Minuten live, nicht in Tagen
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-zinc-400 sm:text-lg">
            Fertige Templates und geführtes Setup bringen dich schnell ans Ziel.
          </p>
        </div>

        {/* Card area — top padding = room for stacked title bars */}
        <div
          className="relative z-10 flex flex-1 justify-center px-4"
          style={{ paddingTop: (N - 1) * TITLE_H + 16 }}
        >
          {/* Step dots — right side progress */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2.5">
            {STEPS.map((step, i) => (
              <div
                key={i}
                ref={el => { dotRefs.current[i] = el }}
                className="h-1.5 w-1.5 rounded-full bg-zinc-600 transition-all duration-300"
                style={{ opacity: i === 0 ? 1 : 0.25, backgroundColor: i === 0 ? step.from : '' }}
              />
            ))}
          </div>

          <div className="relative w-full max-w-2xl" style={{ height: CARD_H }}>
            {STEPS.map((step, i) => (
              <div
                key={step.step}
                ref={el => { cardRefs.current[i] = el }}
                data-active={i === 0 ? 'true' : 'false'}
                className="absolute inset-x-0 overflow-hidden rounded-2xl border border-white/[0.07]
                           [&[data-active=true]]:border-white/[0.1]
                           [&[data-active=true]]:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_32px_64px_-16px_rgba(0,0,0,0.7)]"
                style={{
                  zIndex: i + 1,
                  top: 0,
                  height: CARD_H,
                  backgroundColor: i === 0 ? '#22222a' : '#18181e',
                  opacity: i === 0 ? 1 : 0,
                  willChange: 'transform, opacity',
                  transform: i === 0
                    ? 'translate3d(0,0,0) scale(1)'
                    : `translate3d(0,${CARD_H + 80}px,0) scale(0.96)`,
                  boxShadow: i === 0
                    ? '0 0 0 1px rgba(255,255,255,0.06), 0 32px 64px -16px rgba(0,0,0,0.7)'
                    : 'none',
                }}
              >
                {/* Left accent bar — gradient, visible on active card */}
                <div
                  className="absolute left-0 inset-y-0 w-[3px]"
                  style={{
                    background: `linear-gradient(to bottom, ${step.from}, ${step.to})`,
                    opacity: i === 0 ? 1 : 0,
                    borderTopLeftRadius: '1rem',
                    borderBottomLeftRadius: '1rem',
                  }}
                />

                {/* Title bar — always visible when stacked */}
                <div
                  className="flex items-center gap-4 px-7"
                  style={{ height: TITLE_H }}
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${step.from}, ${step.to})` }}
                  >
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                </div>

                {/* Divider */}
                <div className="mx-7 h-px bg-white/5" />

                {/* Body */}
                <div className="px-7 pt-6 space-y-2.5">
                  <p className="text-lg leading-relaxed text-zinc-100">
                    {step.description}
                  </p>
                  <p className="text-sm leading-relaxed text-zinc-500">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
