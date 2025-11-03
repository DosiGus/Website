import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-500 flex items-center justify-between flex-col sm:flex-row gap-4">
        <p>© {new Date().getFullYear()} Conwix. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link href="/impressum" className="hover:underline">Impressum</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
        </div>
      </div>
    </footer>
  )
}
