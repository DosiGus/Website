'use client'

import { useEffect, useRef } from 'react'

const paragraphs = [
  'Jede Nachricht, die unbeantwortet bleibt, ist eine Buchung, die verloren geht. Wesponde beantwortet eingehende Nachrichten automatisch, qualifiziert Buchungswünsche und trägt Termine direkt in den Kalender ein, sodass kein Interessent unbeantwortet bleibt und kein Termin verloren geht.',
  'Direkt in deinen Social Media Kanälen — dort, wo deine Kunden mit dir kommunizieren wollen. Dein Team konzentriert sich auf den Gast. Wesponde kümmert sich um die Kommunikation.',
]

export default function ProduktSection() {
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let rafId: number

    const update = () => {
      if (!textRef.current) return
      const readingLine = window.innerHeight * 0.65
      const spans = textRef.current.querySelectorAll<HTMLSpanElement>('[data-word]')
      spans.forEach((el) => {
        const top = el.getBoundingClientRect().top
        el.style.color = top < readingLine ? '#11131a' : '#c4cede'
      })
    }

    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update()

    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
    }
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

          {/* Left — label + heading + description, sticky on scroll */}
          <div className="mx-auto w-full max-w-[360px] lg:sticky lg:top-28 lg:max-w-none">
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

          {/* Right — fließtext mit scroll-highlight animation */}
          <div ref={textRef} className="space-y-8">
            {paragraphs.map((text, pi) => (
              <p
                key={pi}
                className="text-2xl leading-[1.7] tracking-tight sm:text-3xl"
                style={{ fontFamily: 'var(--font-home-display)' }}
              >
                {text.split(' ').map((word, wi) => (
                  <span
                    key={`${pi}-${wi}`}
                    data-word
                    style={{
                      color: '#c4cede',
                      transition: 'color 350ms ease-out',
                    }}
                  >
                    {word}
                    {wi < text.split(' ').length - 1 ? ' ' : ''}
                  </span>
                ))}
              </p>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
