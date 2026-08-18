import Link from "next/link";
import Header from "@/components/landing/Header";

const toolGuides = [
  {
    number: "01",
    title: "Line Counter",
    description:
      "Gunakan tool ini untuk menganalisis jumlah line FTTH dan informasi rute.",
    steps: [
      "Buka halaman Line Counter.",
      "Upload file data FTTH Anda.",
      "Periksa hasil analisis line dan rute.",
      "Download hasil jika sudah sesuai.",
    ],
  },
  {
    number: "02",
    title: "Popup Cleaner",
    description:
      "Bersihkan dan rapikan data popup dari file KML atau KMZ.",
    steps: [
      "Buka halaman Popup Cleaner.",
      "Upload file KML atau KMZ.",
      "Pilih data popup yang ingin dibersihkan.",
      "Download file hasil yang sudah dirapikan.",
    ],
  },
  {
    number: "03",
    title: "TRK Permit",
    description:
      "Ubah data rute KML atau KMZ menjadi file Excel untuk kebutuhan permit.",
    steps: [
      "Buka halaman TRK Permit.",
      "Upload file rute KML atau KMZ.",
      "Periksa data permit yang dibuat.",
      "Export hasilnya ke file Excel.",
    ],
  },
  {
    number: "04",
    title: "EMR Standard Icon",
    description:
      "Standarisasi icon, warna, skala, dan line style pada file KMZ.",
    steps: [
      "Buka halaman EMR Standard Icon.",
      "Upload file KMZ yang ingin diproses.",
      "Atur icon dan style sesuai kebutuhan.",
      "Download file KMZ yang sudah distandarisasi.",
    ],
  },
];

export default function HowToUsePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#dedfe1] text-[#3f4043]">
      <Header />

      <section className="relative px-8 pb-28 pt-36 sm:px-16 lg:px-24">
        <div className="pointer-events-none absolute -right-40 top-24 h-[32rem] w-[32rem] rounded-full bg-[#d5d6d8] shadow-[20px_20px_50px_rgba(191,192,195,0.6),-20px_-20px_50px_rgba(247,247,248,0.9)]" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <Link
            href="/#tools"
            className="inline-flex rounded-full bg-[#dedfe1] px-5 py-3 text-sm text-[#68696d] shadow-[5px_5px_10px_#bfc0c3,-5px_-5px_10px_#f7f7f8] transition hover:-translate-y-0.5 hover:text-[#303135]"
          >
            ← Back to tools
          </Link>

          <div className="mt-16 max-w-2xl">
            <p className="mb-5 text-xs uppercase tracking-[0.22em] text-[#77787c]">
              Ariansyah-Lab / Guide
            </p>
            <h1 className="text-6xl font-normal leading-[0.95] tracking-[-0.075em] text-[#303135] sm:text-8xl">
              How to use.
            </h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-[#68696d] sm:text-lg">
              Pilih tool sesuai kebutuhan, upload file yang diperlukan, periksa hasilnya, lalu download output yang sudah diproses.
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-2">
            {toolGuides.map((tool) => (
              <article
                key={tool.number}
                className="rounded-[2rem] bg-[#dedfe1] p-7 shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8] sm:p-8"
              >
                <div className="flex items-start justify-between gap-5">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dedfe1] text-sm font-semibold text-[#77787c] shadow-[inset_5px_5px_10px_#bfc0c3,inset_-5px_-5px_10px_#f7f7f8]">
                    {tool.number}
                  </span>
                  <span className="text-xs uppercase tracking-[0.18em] text-[#a4a5a8]">
                    Guide
                  </span>
                </div>

                <h2 className="mt-10 text-3xl font-bold tracking-[-0.05em] text-[#3f4043]">
                  {tool.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#68696d]">
                  {tool.description}
                </p>

                <ol className="mt-7 space-y-3">
                  {tool.steps.map((step, index) => (
                    <li
                      key={step}
                      className="flex gap-3 text-sm leading-6 text-[#68696d]"
                    >
                      <span className="font-semibold text-[#a4a5a8]">
                        {index + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
