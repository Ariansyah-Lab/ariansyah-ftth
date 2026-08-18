"use client";

import Header from "@/app/tools/ftth-point-editor/components/Header";
import EditorWorkspace from "@/app/tools/ftth-point-editor/components/EditorWorkspace";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#dedfe1] text-[#3f4043]">
      <Header />

      <section className="mx-auto w-full max-w-[1600px] px-5 pb-16 pt-6 sm:px-8 lg:px-12">
        <EditorWorkspace />
      </section>
    </main>
  );
}
