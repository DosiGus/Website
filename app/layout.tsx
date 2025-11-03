import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conwix — Conversations made simple",
  description: "Placeholder website for Conwix. Replace with your real content.",
  openGraph: {
    title: "Conwix — Conversations made simple",
    description: "Placeholder website for Conwix.",
    url: "https://example.com",
    siteName: "Conwix",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
