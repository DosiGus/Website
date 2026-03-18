'use client';

import { useState } from 'react';
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

  return (
    <div className="divide-y divide-[#2a4ea7]/10">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={faq.question}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="group flex w-full items-start gap-4 py-5 text-left sm:py-6"
            >
              {/* Number */}
              <span className="mt-0.5 w-7 flex-shrink-0 font-mono text-[11px] font-medium tabular-nums text-[#7284ae] transition-colors group-hover:text-[#3558ac]">
                {String(index + 1).padStart(2, '0')}
              </span>

              {/* Question */}
              <h3
                className={`flex-1 text-sm font-medium leading-relaxed transition-colors sm:text-base ${
                  isOpen
                    ? 'text-[#173983]'
                    : 'text-[#35508f] group-hover:text-[#173983]'
                }`}
              >
                {faq.question}
              </h3>

              {/* Toggle */}
              <div
                className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                  isOpen
                    ? 'border-[#2a4ea7]/30 bg-[#2a4ea7]/8'
                    : 'border-[#2a4ea7]/14 bg-white/70 group-hover:border-[#2a4ea7]/22'
                }`}
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-all duration-300 ${
                    isOpen
                      ? 'rotate-180 text-[#2a4ea7]'
                      : 'text-[#6d7eaa] group-hover:text-[#3558ac]'
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
                <p className="text-sm leading-relaxed text-[#5d6f99] sm:text-base">
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
