"use client";

import Link from "next/link";
import { House } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  return (
    <header className="mx-auto w-full max-w-[1600px] px-5 pb-8 pt-6 sm:px-8 lg:px-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Back to home"
            className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-[#dedfe1] text-[#68696d] shadow-[7px_7px_14px_#bfc0c3,-7px_-7px_14px_#f7f7f8] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#303135] active:translate-y-0 active:shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8]"
          >
            <House size={21} strokeWidth={1.8} />
          </button>

          <div>
            <h1 className="text-xl font-semibold tracking-[-0.04em] text-[#303135] sm:text-2xl">
              TRK Permit
            </h1>
            <p className="mt-0.5 text-xs text-[#77787c] sm:text-sm">
              Ariansyah-Lab / Permit Utility
            </p>
          </div>
        </div>

        <Link
          href="/how-to-use"
          className="rounded-full bg-[#dedfe1] px-4 py-2.5 text-xs font-medium text-[#68696d] shadow-[5px_5px_10px_#bfc0c3,-5px_-5px_10px_#f7f7f8] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#303135] active:translate-y-0 active:shadow-[inset_3px_3px_6px_#bfc0c3,inset_-3px_-3px_6px_#f7f7f8] sm:px-5 sm:text-sm"
        >
          How to use ↗
        </Link>
      </div>
    </header>
  );
}
