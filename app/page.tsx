import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import ToolSection from "@/components/landing/ToolSection";

export default function Home() {
  return (
    <>

      <Header />

      <section className="relative h-screen overflow-hidden">

        {/* Background */}
        <div className="pointer-events-none absolute inset-0">

          {/* Blue Glow */}
          <div
            className="
              absolute
              -left-80
              top-1/2
              h-460
              w-460
              -translate-y-1/2
              rounded-full
              bg-linear-to-r
              from-cyan-400/30
              via-blue-500/50
              to-indigo-700/40
              blur-[140px]
            "
          />

          {/* Black Eclipse */}
          <div
            className="
              absolute
              -left-135
              top-1/2
              h-400
              w-400
              -translate-y-1/2
              rounded-full
            "
            style={{
              background: `
                radial-gradient(
                  circle at 70% 50%,
                  #020617 0%,
                  #000000 55%,
                  #000000 100%
                )
              `,
              boxShadow: `
                inset 10px 0 200px rgba(37,99,235,0.65),
                inset 20px 0 100px rgba(56,189,248,0.25),
                inset -1000px 0 10px rgba(0,0,0,1),
                0 0 400px rgba(59,130,246,0.55)
              `,
            }}
          />

          {/* Eclipse Rim Light */}
          <div
            className="
              absolute
              -left-135
              top-1/2
              h-400
              w-400
              -translate-y-1/2
              rounded-full
              border
              border-blue-400/20
            "
          />

          {/* Noise Overlay */}
          <div
            className="
              absolute
              inset-0
              opacity-[0.7]
              mix-blend-overlay
            "
            style={{
              backgroundImage: "url('/noise.svg')",
              backgroundRepeat: "repeat",
            }}
          />

        </div>

        {/* Main Content */}
        <div className="relative z-10 flex h-screen items-center gap-12 overflow-hidden px-8">

          {/* Hero Left */}
          <div className="flex-1">
            <Hero />
          </div>

          {/* Tools Right */}
          <div className="w-87.5 -translate-x-62.5">
            <ToolSection />
          </div>

        </div>

      </section>

    </>
  );
}