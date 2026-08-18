export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-8 pb-20 pt-32 sm:px-16 lg:px-24">
      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between">
        <div className="max-w-xl">
          <h1 className="text-7xl font-normal leading-[0.95] tracking-[-0.075em] text-[#303135] sm:text-8xl lg:text-[clamp(5.5rem,9vw,9rem)]">
            SND
            <span className="block">Toolkit</span>
          </h1>

          <p className="mt-8 max-w-md text-base leading-7 text-[#68696d] sm:text-lg">
            Smart tools to visualize information, analyze FTTH data, process maps, and support field decisions.
          </p>

          <a
            href="#tools"
            className="mt-8 inline-flex rounded-full bg-[#dedfe1] px-7 py-3 text-sm font-medium text-[#4f5054] shadow-[7px_7px_14px_#bfc0c3,-7px_-7px_14px_#f7f7f8] transition hover:-translate-y-0.5 hover:text-[#242529]"
          >
            Tools
          </a>
        </div>

        <div className="hidden h-[420px] w-[420px] rounded-full bg-[#d5d6d8] shadow-[20px_20px_50px_#bfc0c3,-20px_-20px_50px_#f7f7f8] lg:block" />
      </div>
    </section>
  );
}
