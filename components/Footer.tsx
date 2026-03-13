'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";

const productLinks = [
  { href: "/#product",       label: "Produkt" },
  { href: "/#workflow",      label: "Ablauf" },
  { href: "/#calendar-sync", label: "Google Kalender" },
  { href: "/#reviews",       label: "Bewertungen" },
];

const companyLinks = [
  { href: "/about",   label: "Über uns" },
  { href: "/blog",    label: "Blog" },
  { href: "/contact", label: "Kontakt" },
];

const legalLinks = [
  { href: "/privacy",    label: "Datenschutz" },
  { href: "/impressum",  label: "Impressum" },
  { href: "/terms",      label: "AGB" },
];

export default function Footer() {
  const pathname = usePathname();
  const isHomeV2Route = pathname === "/home-v2";
  const footerBg = isHomeV2Route ? "bg-[#edf1f8]" : "bg-zinc-950";
  const mutedText = isHomeV2Route ? "text-[#54668f]" : "text-zinc-500";
  const subtleText = isHomeV2Route ? "text-[#7485ad]" : "text-zinc-600";
  const divider = isHomeV2Route ? "border-[#2e4da8]/14" : "border-white/[0.06]";
  const buttonCls = isHomeV2Route
    ? "group mt-6 inline-flex items-center gap-2 rounded-xl border border-[#2a4ea7]/20 bg-white/72 px-4 py-2.5 text-sm font-semibold text-[#1f3f90] transition-all hover:bg-white"
    : "group mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10";

  if (pathname?.startsWith('/app')) return null;

  return (
    <footer className={`relative ${footerBg}`}>
      {/* Top gradient line */}
      <div className={`pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent ${isHomeV2Route ? "via-[#2e4da8]/18" : "via-white/10"} to-transparent`} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Main grid */}
        <div className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.8fr_1fr_1fr_1.4fr] lg:gap-8">

          {/* ── Brand column ── */}
          <div>
            <Link href="/" className={`inline-flex leading-none tracking-tight ${isHomeV2Route ? "text-[#2450b3]" : "text-white"}`}>
              <span className="font-display text-xl">Wesponde</span>
            </Link>

            <p className={`mt-5 max-w-xs text-sm leading-relaxed ${mutedText}`}>
              Instagram-Automation für Service-Brands. Reservierungen, Termine und Bewertungen – vollautomatisch.
            </p>

            {/* Social links — text style */}
            <div className="mt-8 flex flex-col gap-3">
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noreferrer"
                className={`group inline-flex items-center gap-2 text-sm transition-colors ${isHomeV2Route ? "hover:text-[#173983]" : "hover:text-white"} ${subtleText}`}
              >
                <span>LinkedIn</span>
                <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                <span className={`h-px flex-1 max-w-[40px] transition-colors ${isHomeV2Route ? "bg-[#2e4da8]/18 group-hover:bg-[#2e4da8]/45" : "bg-zinc-800 group-hover:bg-white/55"}`} />
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noreferrer"
                className={`group inline-flex items-center gap-2 text-sm transition-colors ${isHomeV2Route ? "hover:text-[#173983]" : "hover:text-white"} ${subtleText}`}
              >
                <span>Instagram</span>
                <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                <span className={`h-px flex-1 max-w-[40px] transition-colors ${isHomeV2Route ? "bg-[#2e4da8]/18 group-hover:bg-[#2e4da8]/45" : "bg-zinc-800 group-hover:bg-white/55"}`} />
              </a>
            </div>
          </div>

          {/* ── Product links ── */}
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${subtleText}`}>
              Produkt
            </p>
            <ul className="mt-5 space-y-3.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-sm transition-colors ${isHomeV2Route ? "text-[#35508f] hover:text-[#173983]" : "text-zinc-400 hover:text-white"}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Company links ── */}
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${subtleText}`}>
              Unternehmen
            </p>
            <ul className="mt-5 space-y-3.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-sm transition-colors ${isHomeV2Route ? "text-[#35508f] hover:text-[#173983]" : "text-zinc-400 hover:text-white"}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── CTA column ── */}
          <div className={`lg:pl-8 lg:border-l ${divider}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${subtleText}`}>
              Loslegen
            </p>
            <p className={`mt-5 text-sm leading-relaxed ${isHomeV2Route ? "text-[#54668f]" : "text-zinc-400"}`}>
              Bereit, Ihre DMs zu automatisieren? Wir zeigen Ihnen in einem kurzen Gespräch, was Wesponde für Ihren Betrieb leisten kann.
            </p>
            <Link
              href="/contact"
              className={buttonCls}
            >
              Kontakt aufnehmen
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className={`flex flex-col items-start justify-between gap-4 border-t py-6 sm:flex-row sm:items-center ${divider}`}>
          <p className={`text-xs ${isHomeV2Route ? "text-[#7a8aaf]" : "text-zinc-700"}`}>
            © {new Date().getFullYear()} Wesponde. Alle Rechte vorbehalten.
          </p>
          <div className="flex items-center gap-5">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs transition-colors ${isHomeV2Route ? "text-[#7a8aaf] hover:text-[#173983]" : "text-zinc-700 hover:text-zinc-400"}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
