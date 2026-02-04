'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

type FaqItem = {
  question: string;
  answer: string;
};

type FaqAccordionProps = {
  faqs: FaqItem[];
};

export default function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="mx-auto max-w-2xl divide-y divide-white/10">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={faq.question} className="group">
            <button
              onClick={() => toggleFaq(index)}
              className="flex w-full items-start justify-between gap-4 py-6 text-left"
            >
              <h3 className={`text-base font-medium transition-colors sm:text-lg ${
                isOpen ? 'text-white' : 'text-zinc-300 group-hover:text-white'
              }`}>
                {faq.question}
              </h3>
              <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border transition-all ${
                isOpen
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : 'border-white/20 bg-white/5 group-hover:border-white/30'
              }`}>
                {isOpen ? (
                  <Minus className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Plus className="h-3.5 w-3.5 text-zinc-400 group-hover:text-white" />
                )}
              </div>
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? 'grid-rows-[1fr] opacity-100 pb-6' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
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
