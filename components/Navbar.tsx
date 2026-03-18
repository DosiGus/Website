'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";

const navLinks = [
  { href: "/#home",      label: "Home" },
  { href: "/#solutions", label: "Solutions" },
  { href: "/agentur",    label: "Agentur" },
  { href: "/blog",       label: "Insights" },
  { href: "/pricing",    label: "Pricing" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isAppRoute = pathname?.startsWith('/app');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isAppRoute) return null;

  return (
    <header className="fixed left-0 top-3 z-50 w-full px-4 sm:px-6 lg:px-8">
      <div
        className={`mx-auto max-w-7xl overflow-hidden rounded-2xl transition-all duration-300 ${
          scrolled
            ? "shadow-[0_8px_32px_rgba(28,53,122,0.14)]"
            : "shadow-[0_4px_20px_rgba(28,53,122,0.09)]"
        }`}
        style={{ background: '#ffffff' }}
      >
        <div className="flex items-center justify-between px-5 py-3 sm:px-7">
          <Link href="/" className="leading-none tracking-tight text-[#2450b3]">
            <span className="font-display text-xl">Wesponde</span>
          </Link>

          <nav className="hidden items-center gap-3 lg:flex">
            {navLinks.map((link, index) => (
              <div key={link.href} className="flex items-center gap-3">
                {index > 0 ? (
                  <span className="text-[11px] text-[#4767bf]/80" aria-hidden>
                    •
                  </span>
                ) : null}
                <Link
                  href={link.href}
                  className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#2a4ea7] transition-colors hover:text-[#173983]"
                >
                  {link.label}
                </Link>
              </div>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/login?view=login"
              className="text-sm font-medium text-[#2a4ea7] transition-colors hover:text-[#173983]"
            >
              Login
            </Link>
            <Link
              href="/login?view=signup"
              className="group inline-flex items-center justify-center gap-2 rounded-xl border border-[#2a4ea7]/20 bg-white/70 px-4 py-2 text-sm font-semibold text-[#1f3f90] transition-colors hover:bg-white"
            >
              Jetzt starten
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#2a4ea7]/20 bg-white/70 text-[#2a4ea7] transition-colors hover:bg-white lg:hidden"
            aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-[#2e4da8]/15 px-5 py-4 sm:px-7 lg:hidden">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-semibold text-[#2a4ea7] transition-colors hover:bg-white/70 hover:text-[#173983]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 flex flex-col gap-2">
              <Link
                href="/login?view=login"
                className="inline-flex items-center justify-center rounded-xl border border-[#2a4ea7]/20 bg-white/70 px-3 py-2.5 text-sm font-semibold text-[#2a4ea7]"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/login?view=signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2a4ea7]/20 bg-white/70 px-3 py-2.5 text-sm font-semibold text-[#2a4ea7]"
                onClick={() => setMenuOpen(false)}
              >
                Jetzt starten
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
