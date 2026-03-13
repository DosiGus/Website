'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

type FaqItem = {
  question: string;
  answer: string;
};

type FaqAccordionProps = {
  faqs: FaqItem[];
};

export default function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const pathname = usePathname();
  const isHomeV2Route = pathname === '/home-v2';

  return (
    <div className={isHomeV2Route ? "divide-y divide-[#2a4ea7]/10" : "divide-y divide-white/[0.06]"}>
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={faq.question}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="group flex w-full items-start gap-4 py-5 text-left sm:py-6"
            >
              {/* Number */}
              <span
                className={`mt-0.5 w-7 flex-shrink-0 font-mono text-[11px] font-medium tabular-nums transition-colors ${
                  isHomeV2Route
                    ? 'text-[#7284ae] group-hover:text-[#3558ac]'
                    : 'text-zinc-600 group-hover:text-zinc-500'
                }`}
              >
                {String(index + 1).padStart(2, '0')}
              </span>

              {/* Question */}
              <h3
                className={`flex-1 text-sm font-medium leading-relaxed transition-colors sm:text-base ${
                  isHomeV2Route
                    ? isOpen
                      ? 'text-[#173983]'
                      : 'text-[#35508f] group-hover:text-[#173983]'
                    : isOpen
                      ? 'text-white'
                      : 'text-zinc-300 group-hover:text-white'
                }`}
              >
                {faq.question}
              </h3>

              {/* Toggle */}
              <div
                className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                  isHomeV2Route
                    ? isOpen
                      ? 'border-[#2a4ea7]/30 bg-[#2a4ea7]/8'
                      : 'border-[#2a4ea7]/14 bg-white/70 group-hover:border-[#2a4ea7]/22'
                    : isOpen
                      ? 'border-indigo-500/40 bg-indigo-500/[0.08]'
                      : 'border-white/[0.08] bg-white/[0.03] group-hover:border-white/15'
                }`}
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-all duration-300 ${
                    isHomeV2Route
                      ? isOpen
                        ? 'rotate-180 text-[#2a4ea7]'
                        : 'text-[#6d7eaa] group-hover:text-[#3558ac]'
                      : isOpen
                        ? 'rotate-180 text-indigo-400'
                        : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}
                />
              </div>
            </button>

            {/* Answer */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? 'grid-rows-[1fr] opacity-100 pb-5 sm:pb-6' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden pl-11">
                <p
                  className={`text-sm leading-relaxed sm:text-base ${
                    isHomeV2Route ? 'text-[#5d6f99]' : 'text-zinc-400'
                  }`}
                >
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
