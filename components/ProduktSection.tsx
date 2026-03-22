'use client'

import { useEffect, useRef } from 'react'

const text =
  'Jede unbeantwortete Nachricht kann eine verlorene Buchung bedeuten. Wesponde beantwortet Anfragen automatisch, qualifiziert Buchungswünsche und trägt Termine nahtlos in den Kalender ein. Das reduziert manuellen Aufwand und schafft mehr Zeit für persönlichen Service.'

const words = text.split(' ')
const PREHIGHLIGHTED = 3
const DELAY_PER_WORD = 180 // ms between words on the same line

export default function ProduktSection() {
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = textRef.current
    if (!container) return

    const spans = Array.from(container.querySelectorAll<HTMLElement>('[data-word]'))
    if (!spans.length) return

    // After layout: measure which words are on the same visual line,
    // and assign a stagger delay based on position within that line.
    const assignDelays = () => {
      let currentLineTop = -Infinity
      let posInLine = 0

      spans.forEach((span, i) => {
        const top = Math.round(span.getBoundingClientRect().top)
        if (Math.abs(top - currentLineTop) > 4) {
          // new line
          currentLineTop = top
          posInLine = 0
        }
        span.dataset.delay = String(posInLine * DELAY_PER_WORD)
        posInLine++
      })
    }

    requestAnimationFrame(assignDelays)

    let rafId: number | null = null

    const update = () => {
      const threshold = window.innerHeight * 0.82
      const tops = spans.map((s) => s.getBoundingClientRect().top)

      tops.forEach((top, i) => {
        if (i < PREHIGHLIGHTED) return // stays highlighted always

        const span = spans[i]
        if (top < threshold) {
          // highlight: apply stagger delay
          span.style.transitionDelay = `${span.dataset.delay ?? 0}ms`
          span.style.color = '#11131a'
        } else {
          // un-highlight: instant (no delay)
          span.style.transitionDelay = '0ms'
          span.style.color = '#a8bcd4'
        }
      })

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

          {/* Left — grid cell (nicht sticky), innerer div ist sticky */}
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

          {/* Right — fließtext mit word-by-word scroll-highlight */}
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
                    transition: 'color 500ms ease-out',
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
