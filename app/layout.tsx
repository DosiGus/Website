import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wesponde – Smart Conversations for Service Businesses",
  description:
    "Automatisiere Reservierungen, Kundenchats und Buchungen mit Wesponde. Gebaut für Restaurants, Salons und Praxen, die Instagram, Facebook und WhatsApp effizient nutzen wollen.",
  keywords:
    "chatbot, restaurant booking tool, automated reservations, instagram business bot, messenger automation, friseur online termin, AI assistant for service business",
  openGraph: {
    title: "Wesponde – Smart Conversations for Service Businesses",
    description:
      "Automatisierte Messenger-Flows für moderne Dienstleistungsunternehmen. Verbinde Instagram, Facebook und WhatsApp in Minuten.",
    url: "https://example.com",
    siteName: "Wesponde",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
        <Navbar />
        <main className="flex-1 bg-white text-slate-900">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
