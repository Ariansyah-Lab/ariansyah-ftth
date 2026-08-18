import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import ToolSection from "@/components/landing/ToolSection";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#dedfe1] text-[#3f4043]">
      <Header />

      <div className="relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -right-40 top-32 h-[34rem] w-[34rem] rounded-full bg-[#d5d6d8] shadow-[20px_20px_50px_rgba(191,192,195,0.6),-20px_-20px_50px_rgba(247,247,248,0.9)]" />
          <div className="absolute -right-8 top-56 h-[22rem] w-[22rem] rounded-full border border-white/75 opacity-80" />
          <div className="absolute -right-20 top-64 h-[25rem] w-[14rem] rotate-[-28deg] rounded-[50%] border border-[#c4c5c8]/60" />
        </div>

        <div className="relative z-10">
          <Hero />
          <ToolSection />
        </div>
      </div>
    </main>
  );
}
