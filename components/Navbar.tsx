import Link from "next/link";

export default function Navbar() {
  return (
    <header className="w-full border-b">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold text-xl tracking-tight">
          Conwix
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/contact" className="hover:underline">Contact</Link>
          <Link href="/impressum" className="hover:underline">Impressum</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
        </nav>
      </div>
    </header>
  )
}
