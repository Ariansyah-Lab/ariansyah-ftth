"use client";

import HPDBHeader from "@/app/tools/hpdb/components/HPDBHeader";
import HPDBWorkspace from "@/app/tools/hpdb/components/HPDBWorkspace";

export default function HPDBPage() {
  return (
    <main className="min-h-screen bg-[#dedfe1] text-[#3f4043]">
      <HPDBHeader />

      <div className="mx-auto w-full max-w-[1600px] px-5 pb-12 sm:px-8 lg:px-12">
        <HPDBWorkspace />
      </div>
    </main>
  );
}
