'use client';

import { useState } from "react";

type WatchDemoButtonProps = {
  className?: string;
  label?: string;
};

export default function WatchDemoButton({ className, label = "Demo ansehen" }: WatchDemoButtonProps) {
  const [open, setOpen] = useState(false);

  const baseClassName =
    "inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${baseClassName} ${className ?? ""}`}
      >
        {label}
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 px-4 py-10"
          role="dialog"
          aria-modal="true"
          aria-label="Wesponde Demo Video"
        >
          <button
            type="button"
            className="absolute right-6 top-6 rounded-full border border-white/30 p-2 text-white transition hover:text-brand-light"
            onClick={() => setOpen(false)}
            aria-label="Demo schließen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/20 bg-black shadow-2xl shadow-brand/20">
            <div className="aspect-video w-full">
              <iframe
                className="h-full w-full"
                src="https://www.youtube.com/embed/bB9nAeiSuf4?rel=0"
                title="Wesponde Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="bg-slate-900/60 px-6 py-4 text-sm text-white/80">
              Placeholder-Video: Ersetze den Link durch deine echte Produktdemo.
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
