'use client';

import { Menu } from "lucide-react";

export default function MobileTopbar() {
  return (
    <div className="sticky top-0 z-30 flex h-12 items-center border-b border-[#E2E8F0] bg-white px-4 lg:hidden">
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#475569] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4FD8] focus-visible:ring-offset-2"
        onClick={() => window.dispatchEvent(new Event("wesponde:sidebar:toggle"))}
        aria-label="Navigation öffnen"
      >
        <Menu className="h-5 w-5" />
      </button>
    </div>
  );
}
