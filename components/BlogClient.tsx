'use client';

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, Lightbulb, Map } from "lucide-react";

const noiseDataUri = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`;

const POSTS = [
  // ── Playbooks ──────────────────────────────────────────────────────────────
  {
    slug: "instagram-dm-reservierungen",
    title: "Wie 30 % mehr Reservierungen über Instagram DMs möglich werden",
    tag: "Playbook" as const,
    icon: Map,
    accent: "#2450b2",
    accentBg: "rgba(36,80,178,0.07)",
    excerpt:
      "Der konkrete Ablauf, der aus Anfragen Buchungen macht – inklusive Bestätigung, Reminder und Follow-ups.",
    readTime: "8 Min.",
  },
  {
    slug: "neukunden-aktivierung-playbook",
    title: "Das Willkommens-Playbook: Neukunden in 3 Nachrichten aktivieren",
    tag: "Playbook" as const,
    icon: Map,
    accent: "#2450b2",
    accentBg: "rgba(36,80,178,0.07)",
    excerpt:
      "Wie du neue Follower in zahlende Kunden verwandelst – mit einem simplen, automatisierten Begrüßungs-Flow.",
    readTime: "6 Min.",
  },
  {
    slug: "comeback-playbook-inaktive-kunden",
    title: "Comeback-Playbook: Inaktive Kunden mit einer DM zurückgewinnen",
    tag: "Playbook" as const,
    icon: Map,
    accent: "#2450b2",
    accentBg: "rgba(36,80,178,0.07)",
    excerpt:
      "Der Ablauf, der Kunden, die länger nichts gebucht haben, mit einer persönlichen DM reaktiviert.",
    readTime: "5 Min.",
  },
  // ── Best Practices ─────────────────────────────────────────────────────────
  {
    slug: "reminder-design-no-shows",
    title: "Reminder-Design: der präzise Ablauf gegen No-Shows",
    tag: "Best Practice" as const,
    icon: Lightbulb,
    accent: "#1e6b4a",
    accentBg: "rgba(30,107,74,0.07)",
    excerpt:
      "Timing, Tonalität und Trigger – so bleibt dein Kalender zuverlässig gefüllt.",
    readTime: "5 Min.",
  },
  {
    slug: "sprache-ton-dm-automatisierung",
    title: "Sprache & Ton: So klingt dein Bot nicht wie ein Bot",
    tag: "Best Practice" as const,
    icon: Lightbulb,
    accent: "#1e6b4a",
    accentBg: "rgba(30,107,74,0.07)",
    excerpt:
      "Warum Formulierungen, Emoji-Einsatz und Antwortgeschwindigkeit darüber entscheiden, ob Kunden antworten.",
    readTime: "4 Min.",
  },
  {
    slug: "quick-replies-conversion",
    title: "Quick Replies richtig einsetzen: weniger Tipp-Aufwand, mehr Abschluss",
    tag: "Best Practice" as const,
    icon: Lightbulb,
    accent: "#1e6b4a",
    accentBg: "rgba(30,107,74,0.07)",
    excerpt:
      "Wie du Antwortoptionen so gestaltest, dass Kunden durchklicken statt abspringen.",
    readTime: "4 Min.",
  },
  // ── Guides ─────────────────────────────────────────────────────────────────
  {
    slug: "bewertungen-skalieren",
    title: "Bewertungen skalieren: von Besuch zu 5-Sterne-Review",
    tag: "Guide" as const,
    icon: BookOpen,
    accent: "#6b3a1e",
    accentBg: "rgba(107,58,30,0.07)",
    excerpt:
      "Wie du Bewertungen ohne Druck aktivierst und damit deine Sichtbarkeit steigerst.",
    readTime: "6 Min.",
  },
  {
    slug: "instagram-dm-automatisierung-einrichten",
    title: "Instagram DM Automatisierung einrichten: Schritt für Schritt",
    tag: "Guide" as const,
    icon: BookOpen,
    accent: "#6b3a1e",
    accentBg: "rgba(107,58,30,0.07)",
    excerpt:
      "Von der Verknüpfung deines Instagram-Kontos bis zum ersten aktiven Flow – der vollständige Setup-Guide.",
    readTime: "9 Min.",
  },
  {
    slug: "flow-builder-trigger-variablen",
    title: "Flow-Builder verstehen: Trigger, Knoten und Variablen erklärt",
    tag: "Guide" as const,
    icon: BookOpen,
    accent: "#6b3a1e",
    accentBg: "rgba(107,58,30,0.07)",
    excerpt:
      "Ein Überblick über alle Bausteine des Flow-Builders – und wie du sie für deinen Use Case kombinierst.",
    readTime: "7 Min.",
  },
];

const CATEGORIES = ["Alle", "Playbooks", "Best Practices", "Guides"] as const;
type Category = (typeof CATEGORIES)[number];

const TAG_BY_CATEGORY: Record<Category, string | null> = {
  Alle: null,
  Playbooks: "Playbook",
  "Best Practices": "Best Practice",
  Guides: "Guide",
};

export default function BlogClient() {
  const [active, setActive] = useState<Category>("Alle");

  const filtered =
    active === "Alle"
      ? POSTS
      : POSTS.filter((p) => p.tag === TAG_BY_CATEGORY[active]);

  const featured = active === "Alle" ? filtered[0] : null;
  const grid = active === "Alle" ? filtered.slice(1) : filtered;

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-24">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #0a1a55 0%, #2a4ea7 22%, #ffffff 83%, #ffffff 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "100px 100px",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.22]"
          style={{ backgroundImage: noiseDataUri, backgroundSize: "200px 200px" }}
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm"
            style={{ animation: "fadeInUp 0.5s ease both" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#7aaeff]" />
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/80">
              Insights
            </p>
          </div>

          <h1
            className="mt-6 max-w-2xl text-5xl font-semibold tracking-tight text-white sm:text-6xl"
            style={{
              fontFamily: "var(--font-home-display)",
              animation: "fadeInUp 0.6s ease 0.1s both",
            }}
          >
            Playbooks für skalierbares Messaging.
          </h1>

          <p
            className="mt-5 max-w-xl font-mono text-[15px] leading-relaxed text-white/70"
            style={{ animation: "fadeInUp 0.6s ease 0.2s both" }}
          >
            Strategien, Benchmarks und konkrete Abläufe für Service-Brands.
          </p>

          {/* Filter pills */}
          <div
            className="mt-8 flex flex-wrap gap-2"
            style={{ animation: "fadeInUp 0.6s ease 0.3s both" }}
          >
            {CATEGORIES.map((label) => (
              <button
                key={label}
                onClick={() => setActive(label)}
                className={`inline-flex items-center rounded-xl px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                  active === label
                    ? "bg-white text-[#2450b2]"
                    : "border border-white/20 bg-white/10 text-white/70 backdrop-blur-sm hover:bg-white/20"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Posts ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">

        {/* Featured (only in "Alle" view) */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group mb-10 flex flex-col overflow-hidden rounded-2xl border border-[#2a4ea7]/15 bg-white shadow-[0_4px_24px_rgba(28,53,122,0.06)] transition-all hover:shadow-[0_8px_32px_rgba(28,53,122,0.12)] lg:flex-row"
            style={{ animation: "fadeInUp 0.6s ease 0.4s both" }}
          >
            <div
              className="relative flex min-h-[220px] flex-col items-start justify-between p-8 lg:w-[420px] lg:flex-shrink-0 lg:p-10"
              style={{
                background:
                  "linear-gradient(140deg, #e8f0ff 0%, #c8d8ff 50%, #b0c6ff 100%)",
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.13]"
                style={{ backgroundImage: noiseDataUri, backgroundSize: "200px 200px" }}
              />
              <span className="relative inline-flex items-center gap-1.5 rounded-xl border border-[#2450b2]/20 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#2450b2]">
                <featured.icon className="h-3 w-3" />
                {featured.tag}
              </span>
              <div className="relative mt-auto">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/60 shadow-[0_4px_16px_rgba(36,80,178,0.12)] backdrop-blur-sm">
                  <featured.icon className="h-7 w-7 text-[#2450b2]" />
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-between p-8 lg:p-10">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#7485ad]">Featured</span>
                  <span className="h-px flex-1 bg-[#dde2ee]" />
                  <span className="font-mono text-[11px] text-[#7485ad]">{featured.readTime} Lesezeit</span>
                </div>
                <h2 className="mt-5 text-2xl font-semibold leading-snug tracking-tight text-[#171923] transition-colors group-hover:text-[#2450b2] sm:text-3xl">
                  {featured.title}
                </h2>
                <p className="mt-4 max-w-lg font-mono text-[14px] leading-relaxed text-[#4c546f]">
                  {featured.excerpt}
                </p>
              </div>
              <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-[#2450b2]">
                Artikel lesen
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        )}

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {grid.map((post, idx) => {
            const Icon = post.icon;
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#2a4ea7]/15 bg-white shadow-[0_4px_16px_rgba(28,53,122,0.04)] transition-all hover:shadow-[0_8px_24px_rgba(28,53,122,0.10)]"
                style={{ animation: `fadeInUp 0.6s ease ${0.05 * idx}s both` }}
              >
                <div
                  className="relative flex items-start justify-between px-6 pt-6 pb-4"
                  style={{ backgroundColor: post.accentBg }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.13]"
                    style={{ backgroundImage: noiseDataUri, backgroundSize: "200px 200px" }}
                  />
                  <span
                    className="relative inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
                    style={{
                      color: post.accent,
                      borderColor: `${post.accent}25`,
                      backgroundColor: "rgba(255,255,255,0.7)",
                    }}
                  >
                    <Icon className="h-3 w-3" />
                    {post.tag}
                  </span>
                  <span className="relative font-mono text-[11px] text-[#7485ad]">{post.readTime}</span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="text-[15px] font-semibold leading-snug tracking-tight text-[#171923] transition-colors group-hover:text-[#2450b2]">
                    {post.title}
                  </h2>
                  <p className="mt-3 flex-1 font-mono text-[12px] leading-relaxed text-[#4c546f]">
                    {post.excerpt}
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#2450b2]">
                    Artikel lesen
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Newsletter CTA ─────────────────────────────────────────── */}
        <div className="mt-16 overflow-hidden rounded-2xl">
          <div
            className="relative px-8 py-14 sm:px-16 sm:py-16"
            style={{ backgroundColor: "#0a1a55" }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.18]"
              style={{ backgroundImage: noiseDataUri, backgroundSize: "200px 200px" }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
                backgroundSize: "80px 80px",
              }}
            />
            <div className="relative mx-auto max-w-2xl text-center">
              <span
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-white/60"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#7aaeff]" />
                Newsletter
              </span>
              <h3
                className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
                style={{ fontFamily: "var(--font-home-display)" }}
              >
                Neue Insights direkt ins Postfach
              </h3>
              <p
                className="mx-auto mt-4 max-w-md font-mono text-[14px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Monatlich die neuesten Playbooks, Benchmarks und Best Practices –
                direkt für Service-Brands.
              </p>
              <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  placeholder="Deine E-Mail-Adresse"
                  className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 transition-colors focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: "rgba(122,170,255,0.08)",
                    border: "1px solid rgba(122,170,255,0.15)",
                  }}
                />
                <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0a1a55] transition-all hover:bg-[#e8efff]">
                  Anmelden
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </section>
    </>
  );
}
