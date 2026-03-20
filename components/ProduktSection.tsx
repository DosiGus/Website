'use client'

import { useEffect, useRef } from 'react'

const paragraphs = [
  'Jede Nachricht, die unbeantwortet bleibt, ist eine Buchung, die verloren geht. Wesponde beantwortet eingehende Nachrichten automatisch, qualifiziert Buchungswünsche und trägt Termine direkt in den Kalender ein, sodass kein Interessent unbeantwortet bleibt und kein Termin verloren geht.',
  'Direkt in deinen Social Media Kanälen — dort, wo deine Kunden mit dir kommunizieren wollen. Dein Team konzentriert sich auf den Gast. Wesponde kümmert sich um die Kommunikation.',
]

export default function ProduktSection() {
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = textRef.current
    if (!container) return

    const wordSpans = Array.from(container.querySelectorAll<HTMLElement>('[data-word]'))
    if (!wordSpans.length) return

    // IntersectionObserver: Wort wird highlighted sobald es in den Viewport scrollt
    // rootMargin '0px 0px -8% 0px' = Trigger knapp vor dem unteren Bildschirmrand
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement
          if (entry.isIntersecting) {
            // Wort scrollt ins Bild → highlighten
            el.style.color = '#11131a'
          } else {
            // Wort verlässt den Viewport — nur grau machen wenn es
            // nach UNTEN rausgescrollt ist (= User scrollt nach oben)
            if (entry.boundingClientRect.top > 0) {
              el.style.color = '#a8bcd4'
            }
            // Wenn top < 0: Wort ist nach oben raus → bleibt highlighted
          }
        })
      },
      {
        root: null,
        rootMargin: '0px 0px -8% 0px',
        threshold: 0,
      }
    )

    wordSpans.forEach((span) => observer.observe(span))

    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="produkt"
      className="relative overflow-hidden bg-[#f6f9ff] py-20 sm:py-24 lg:py-32"
    >
      {/* Decorative radial glow */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-[600px] w-[600px] -translate-y-[20%] translate-x-[20%]"
        style={{
          background: 'radial-gradient(circle, rgba(42,78,167,0.06) 0%, transparent 60%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.48fr_1fr] lg:items-start lg:gap-24">

          {/* Left — label + h2, sticky on scroll */}
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

          {/* Right — fließtext mit scroll-highlight */}
          <div ref={textRef} className="space-y-8">
            {paragraphs.map((text, pi) => {
              const words = text.split(' ')
              return (
                <p
                  key={pi}
                  className="text-2xl leading-[1.7] tracking-tight sm:text-3xl"
                  style={{ fontFamily: 'var(--font-home-display)' }}
                >
                  {words.map((word, wi) => (
                    <span
                      key={`${pi}-${wi}`}
                      data-word
                      style={{
                        color: '#a8bcd4',
                        transition: 'color 800ms ease-out',
                        display: 'inline',
                      }}
                    >
                      {word}
                      {wi < words.length - 1 ? ' ' : ''}
                    </span>
                  ))}
                </p>
              )
            })}
          </div>

        </div>
      </div>
    </section>
  )
}
