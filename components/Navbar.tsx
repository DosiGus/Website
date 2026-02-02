'use client';

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { href: "/#product", label: "Produkt" },
  { href: "/#outcomes", label: "Ergebnisse" },
  { href: "/#cases", label: "Cases" },
  { href: "/#workflow", label: "Ablauf" },
  { href: "/#use-cases", label: "Branchen" },
  { href: "/blog", label: "Insights" },
  { href: "/about", label: "Über uns" },
  { href: "/contact", label: "Support" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const renderLinks = (onNavigate?: () => void) =>
    navLinks.map((link) => (
      <Link
        key={link.href}
        href={link.href}
        onClick={onNavigate}
        className="transition hover:text-brand-light focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      >
        {link.label}
      </Link>
    ));

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-ink/90 backdrop-blur shadow-[0_12px_30px_-20px_rgba(0,0,0,0.6)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-white transition hover:text-brand-light"
        >
          Wesponde
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-200 md:flex">
          {renderLinks()}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/50 hover:text-white md:block"
          >
            Login für Partner
          </Link>
          <Link
            href="/#beta"
            className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-lg shadow-white/20 transition hover:bg-sand md:inline-flex md:items-center"
          >
            Pilotzugang
          </Link>
          <button
            type="button"
            className="rounded-full border border-white/30 p-2 text-white/80 transition hover:text-white md:hidden"
            aria-label="Menü öffnen"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {menuOpen ? (
        <div className="border-t border-white/10 bg-ink/95 px-4 py-6 text-sm font-semibold text-slate-100 md:hidden">
          <div className="flex flex-col gap-4">{renderLinks(() => setMenuOpen(false))}</div>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/login"
              className="rounded-full border border-white/20 px-4 py-2 text-center text-sm font-semibold text-slate-100 transition hover:border-white/50 hover:text-white"
              onClick={() => setMenuOpen(false)}
            >
              Login für Partner
            </Link>
            <Link
              href="/#beta"
              className="rounded-full bg-white px-4 py-2 text-center text-sm font-semibold text-ink shadow-lg shadow-white/20 transition hover:bg-sand"
              onClick={() => setMenuOpen(false)}
            >
              Pilotzugang
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
