'use client'

import { useEffect, useRef } from 'react'

const text =
  'Jede unbeantwortete Nachricht kann eine verlorene Buchung bedeuten. Wesponde beantwortet Anfragen automatisch, qualifiziert Buchungswünsche und trägt Termine nahtlos in den Kalender ein. Das reduziert manuellen Aufwand und schafft mehr Zeit für persönlichen Service.'

const words = text.split(' ')
const PREHIGHLIGHTED = 3

export default function ProduktSection() {
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = textRef.current
    if (!container) return

    const spans = Array.from(container.querySelectorAll<HTMLElement>('[data-word]'))
    if (!spans.length) return

    const remaining = spans.length - PREHIGHLIGHTED
    let rafId: number | null = null

    const update = () => {
      const rect = container.getBoundingClientRect()
      const viewH = window.innerHeight

      // progress 0 → Container-Oberkante bei 70% des Viewports (Text voll sichtbar)
      // progress 1 → Container-Oberkante bei 20% des Viewports (weit oben gescrollt)
      const startY = viewH * 0.7
      const endY = viewH * 0.2
      const raw = (startY - rect.top) / (startY - endY)
      const progress = Math.max(0, Math.min(1, raw))

      // Wörter streng sequenziell nach Index hervorheben
      const highlightUpTo = progress * remaining

      for (let i = PREHIGHLIGHTED; i < spans.length; i++) {
        const adjustedI = i - PREHIGHLIGHTED
        spans[i].style.color = adjustedI < highlightUpTo ? '#11131a' : '#a8bcd4'
      }

      rafId = null
    }

    const onScroll = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(update)
    }

    document.addEventListener('scroll', onScroll, { passive: true, capture: true })
    update()

    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true })
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <section
      id="produkt"
      className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-32"
    >
      {/* Grid background mit Verlauf oben/unten */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.32]"
        style={{
          backgroundImage: 'linear-gradient(rgba(42,78,167,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(42,78,167,0.06) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 22%, black 100%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 22%, black 100%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.48fr_1fr] lg:items-start lg:gap-24">

          {/* Left — sticky heading */}
          <div>
            <div className="lg:sticky lg:top-28">
              <div className="flex items-center gap-4">
                <span className="h-px w-16 bg-[#7d9be2]" />
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#3159bb]">
                  Produkt
                </p>
              </div>
              <h2
                className="mt-3 text-4xl font-semibold leading-[1.1] tracking-tight text-[#11131a] sm:text-5xl"
                style={{ fontFamily: 'var(--font-home-display)' }}
              >
                Automatisiere deine Kundenkommunikation
              </h2>
            </div>
          </div>

          {/* Right — word-by-word scroll-highlight */}
          <div ref={textRef}>
            <p
              className="text-2xl leading-[1.7] tracking-tight sm:text-3xl"
              style={{ fontFamily: 'var(--font-home-display)' }}
            >
              {words.map((word, wi) => (
                <span
                  key={wi}
                  data-word
                  style={{
                    color: wi < PREHIGHLIGHTED ? '#11131a' : '#a8bcd4',
                    transition: 'color 400ms ease-out',
                    display: 'inline',
                  }}
                >
                  {word}
                  {wi < words.length - 1 ? ' ' : ''}
                </span>
              ))}
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}
