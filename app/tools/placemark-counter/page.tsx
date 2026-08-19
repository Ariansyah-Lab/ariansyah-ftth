"use client";

import Header from "@/app/tools/placemark-counter/components/Header";
import PlacemarkWorkspace from "@/app/tools/placemark-counter/components/PlacemarkWorkspace";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#dedfe1] text-[#3f4043]">
      <Header />

      <section className="mx-auto w-full max-w-[1600px] px-5 pb-16 pt-6 sm:px-8 lg:px-12">
        <PlacemarkWorkspace />
      </section>
    </main>
  );
}
