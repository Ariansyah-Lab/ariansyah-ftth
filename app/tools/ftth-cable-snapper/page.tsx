"use client";

import Header from "@/app/tools/ftth-cable-snapper/components/Header";
import SnapWorkspace from "@/app/tools/ftth-cable-snapper/components/SnapWorkspace";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#dedfe1] px-5 pb-12 pt-4 text-[#3f4043] sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <Header />
        <SnapWorkspace />
      </div>
    </main>
  );
}
