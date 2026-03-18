'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const STATS = [
  {
    value: '24/7',
    label: 'Fragen automatisch beantworten',
    detail:
      'Wesponde antwortet zu jeder Tages- und Nachtzeit – auch am Wochenende und an Feiertagen. Kein Kunde wartet auf eine Antwort, kein Anruf bleibt unbeantwortet.',
    tone: 'bg-[#becae0] text-[#2450b2]',
  },
  {
    value: '1-Klick',
    label: 'Reservierungen & Termine direkt bestätigen',
    detail:
      'Sobald ein Kunde den Wunschtermin auswählt, sendet Wesponde automatisch eine Bestätigung und trägt alles direkt in den Kalender ein – ohne manuellen Aufwand.',
    tone: 'bg-[#a7b9db] text-white',
  },
  {
    value: '100%',
    label: 'Termine in Google Kalender überführen',
    detail:
      'Jeder gebuchte Termin landet automatisch in Google Kalender – inklusive Kontaktdaten, Uhrzeit und Anmerkungen des Kunden. Kein manuelles Übertragen mehr.',
    tone: 'bg-[#7f9fd3] text-white',
  },
  {
    value: '+50%',
    label: 'Google Bewertungen automatisch anstoßen',
    detail:
      'Nach einem abgeschlossenen Termin fragt Wesponde freundlich nach einer Google-Bewertung. Mehr Sterne, mehr Vertrauen, mehr Neukunden.',
    tone: 'bg-[#4975c3] text-white',
  },
  {
    value: '−30%',
    label: 'No-Shows durch Erinnerungen senken',
    detail:
      '24 Stunden vor dem Termin schickt Wesponde automatisch eine Erinnerung an den Kunden. Weniger vergessene Termine, weniger Umsatzverlust.',
    tone: 'bg-[#2450b2] text-white',
  },
];

export default function SolutionStats() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-0">
      {STATS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={item.value}
            className={`cursor-pointer select-none rounded-[18px] px-6 py-4 transition-all duration-300 sm:px-7 sm:py-5 ${item.tone}`}
            onClick={() => setOpenIndex(isOpen ? null : i)}
          >
            {/* Row */}
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-[26px] leading-none sm:text-[32px]">
                {item.value}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-right font-mono text-[13px] sm:text-[14px]">
                  {item.label}
                </span>
                <ChevronDown
                  className={`h-4 w-4 flex-shrink-0 opacity-60 transition-transform duration-300 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>

            {/* Expandable detail */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? 'mt-3 grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <p className="font-mono text-[13px] leading-relaxed opacity-80">
                  {item.detail}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
