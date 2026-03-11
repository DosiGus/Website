'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";

const navLinks = [
  { href: "/#product", label: "Produkt" },
  { href: "/blog",     label: "Insights" },
  { href: "/about",    label: "Über uns" },
  { href: "/contact",  label: "Kontakt" },
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

  const renderLinks = (onNavigate?: () => void) =>
    navLinks.map((link) => (
      <Link
        key={link.href}
        href={link.href}
        onClick={onNavigate}
        className="text-sm font-medium text-zinc-300 transition-colors hover:text-white focus:outline-none focus-visible:text-white"
      >
        {link.label}
      </Link>
    ));

  return (
    <header
      className={`fixed left-0 top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? 'border-b border-white/[0.07] bg-zinc-950/90 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.04)]'
          : 'bg-gradient-to-b from-black/40 to-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
            <span className="text-sm font-bold text-white">W</span>
          </div>
          <span className="font-display text-base font-medium tracking-tight text-white">
            Wesponde
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-7 lg:flex">
          {renderLinks()}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login?view=login"
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Login
          </Link>
          <Link
            href="/login?view=signup"
            className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
          >
            Jetzt starten
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 lg:hidden"
          aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="border-t border-white/[0.07] bg-zinc-950/95 backdrop-blur-xl lg:hidden">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2.5 border-t border-white/[0.07] pt-4">
              <Link
                href="/login?view=login"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/login?view=signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
                onClick={() => setMenuOpen(false)}
              >
                Jetzt starten
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
