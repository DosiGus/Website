import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  verification: {
    google: "t8FmDZWa1jcsmCyAG4JoWBSRgLVadnybGtu353e7M-Q",
  },
  title: "Wesponde – Messenger Automation for Service Brands",
  description:
    "Automatisiere Reservierungen, Kundenchats und Buchungen mit Wesponde. Gebaut für Restaurants, Salons und Praxen, die Instagram, Facebook und WhatsApp effizient nutzen wollen.",
  keywords:
    "messenger automation, instagram dm reservations, service business booking, whatsapp business, restaurant booking tool, friseur online termin, customer messaging",
  openGraph: {
    title: "Wesponde – Messenger Automation for Service Brands",
    description:
      "Automatisierte Messenger-Flows für moderne Dienstleistungsunternehmen. Verbinde Instagram, Facebook und WhatsApp in Minuten.",
    url: "https://wesponde.com",
    siteName: "Wesponde",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="dark">
      <head>
        <link rel="privacy-policy" href="https://wesponde.com/privacy" />
      </head>
      <body
        className={`${displayFont.variable} ${bodyFont.variable} flex min-h-screen flex-col bg-zinc-950 text-white antialiased`}
      >
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
