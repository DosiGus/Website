import Link from "next/link";

const infoLinks = [
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog (Soon)" },
  { href: "/contact", label: "Support" },
  { href: "/privacy", label: "Privacy" },
  { href: "/login", label: "Login" },
];

const legalLinks = [
  { href: "/impressum", label: "Impressum" },
  { href: "/terms", label: "AGB" },
];

const socialLinks = [
  { href: "https://www.linkedin.com", label: "LinkedIn" },
  { href: "https://www.instagram.com", label: "Instagram" },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 text-sm text-slate-600 lg:flex-row lg:justify-between">
        <div className="max-w-sm space-y-4">
          <p className="text-lg font-semibold text-slate-900">Wesponde</p>
          <p>
            Automatisierte Chat-Workflows für Restaurants, Salons und Praxen. Wir verbinden
            Social Messenger, POS und CRM, damit dein Team wachsen kann.
          </p>
          <div className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-brand-dark"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Explore
            </p>
            <ul className="mt-3 space-y-2">
              {infoLinks.map((link) => (
                <li key={link.href}>
                  <Link className="transition hover:text-brand-dark" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Legal
            </p>
            <ul className="mt-3 space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link className="transition hover:text-brand-dark" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold text-slate-900">
            Bereit für automatisierte Gespräche?
          </p>
          <p className="text-xs text-slate-500">
            Trage dich in die Beta ein und erhalte Zugang, sobald neue Plätze frei werden.
          </p>
          <a
            href="#beta"
            className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
          >
            Join Beta Waitlist
          </a>
        </div>
      </div>
      <div className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Wesponde. All rights reserved.
      </div>
    </footer>
  );
}
