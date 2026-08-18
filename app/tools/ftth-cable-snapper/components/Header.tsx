"use client";

import Link from "next/link";
import { ArrowUpRight, House } from "lucide-react";

export default function Header() {
  return (
    <header className="flex items-center justify-between gap-4 py-3 sm:py-5">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <Link
          href="/"
          aria-label="Kembali ke Home"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#dedfe1] text-[#68696d] shadow-[6px_6px_12px_#bfc0c3,-6px_-6px_12px_#f7f7f8] transition duration-200 hover:-translate-y-0.5 hover:text-[#303135] active:translate-y-0"
        >
          <House size={21} strokeWidth={1.7} />
        </Link>

        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-[-0.045em] text-[#303135] sm:text-2xl">
            FTTH Cable Snapper
          </h1>
          <p className="truncate text-xs text-[#77787c] sm:text-sm">
            Ariansyah-Lab / Spatial Utility
          </p>
        </div>
      </div>

      <Link
        href="/how-to-use"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#dedfe1] px-3.5 py-2.5 text-[11px] font-medium text-[#68696d] shadow-[5px_5px_10px_#bfc0c3,-5px_-5px_10px_#f7f7f8] transition duration-200 hover:-translate-y-0.5 hover:text-[#303135] active:translate-y-0 sm:px-5 sm:text-xs"
      >
        <span>How to use</span>
        <ArrowUpRight size={14} strokeWidth={1.8} />
      </Link>
    </header>
  );
}
