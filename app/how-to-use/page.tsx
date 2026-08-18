import Link from "next/link";
import { ArrowLeft, ArrowUpRight, House } from "lucide-react";

const guides = [
  {
    number: "01",
    title: "Line Counter",
    category: "FTTH Analysis",
    description: "Analyze cable lines from KML or KMZ files and review route information in a readable table.",
    steps: [
      "Upload or drag a KML/KMZ file into the upload panel.",
      "Use the result cards to review total length, line count, longest line, and shortest line.",
      "Review the detailed cable table and clear the data when you want to start again.",
    ],
    href: "/tools/cable-counter",
  },
  {
    number: "02",
    title: "Popup Cleaner",
    category: "KML / KMZ",
    description: "Clean popup information from KML/KMZ data before using the file in mapping workflows.",
    steps: [
      "Upload a KML/KMZ file or paste the KML XML into the text area.",
      "Press Process to remove the popup content while keeping the map structure.",
      "Download the cleaned KML/KMZ file, or use Clear Data to reset the tool.",
    ],
    href: "/tools/popup-cleaner",
  },
  {
    number: "03",
    title: "TRK Permit",
    category: "Permit Processing",
    description: "Convert line information from KML/KMZ files into a permit-oriented table and Excel output.",
    steps: [
      "Upload or drag a KML/KMZ file, or paste the KML XML if needed.",
      "Review the extracted permit rows and check the route information.",
      "Export the processed result to Excel for further reporting or submission.",
    ],
    href: "/tools/trk-permit",
  },
  {
    number: "04",
    title: "EMR Standard Icon",
    category: "Map Utilities",
    description: "Standardize icons, colors, scales, and line styles in EMR KML/KMZ files.",
    steps: [
      "Upload the KML/KMZ file that contains the EMR map data.",
      "Press Process to apply the standard icon and style rules.",
      "Download the repaired file and use it in your mapping workflow.",
    ],
    href: "/tools/emr-icon",
  },
  {
    number: "05",
    title: "FTTH Point Editor",
    category: "Spatial Utility",
    description: "Rename and reorder FTTH point data, then export the updated map and CSV results.",
    steps: [
      "Upload or drag a KML/KMZ file containing the points you want to edit.",
      "Choose a folder, apply a natural sort or manual marker order, and configure the rename rules.",
      "Download the renamed KMZ or export the point table as CSV.",
    ],
    href: "/tools/ftth-point-editor",
  },
  {
    number: "06",
    title: "FTTH Cable Snapper",
    category: "Spatial Utility",
    description: "Snap cable vertices to nearby poles, add missing vertices along cable segments, and export a corrected KMZ.",
    steps: [
      "Upload or drag a KML/KMZ file containing a folder named POLE and cable LineString data outside that folder.",
      "Set the snapping threshold, choose the pole offset distance, and enable or disable the perpendicular offset.",
      "Press Process snapping to update the cable coordinates and review the original and processed visualization.",
      "Press Download KMZ to export the corrected file while preserving the original KML structure, styles, folders, and names.",
    ],
    href: "/tools/ftth-cable-snapper",
  },
];

export default function HowToUsePage() {
  return (
    <main className="min-h-screen bg-[#dedfe1] px-5 pb-16 pt-5 text-[#3f4043] sm:px-8 sm:pt-8 lg:px-12">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link
              href="/"
              aria-label="Kembali ke Home"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#dedfe1] text-[#68696d] shadow-[6px_6px_12px_#bfc0c3,-6px_-6px_12px_#f7f7f8] transition duration-200 hover:-translate-y-0.5 hover:text-[#303135] active:translate-y-0"
            >
              <House size={21} strokeWidth={1.7} />
            </Link>

            <div className="min-w-0">
              <p className="truncate text-xs text-[#77787c] sm:text-sm">
                Ariansyah-Lab / Guide
              </p>
              <h1 className="truncate text-2xl font-semibold tracking-[-0.055em] text-[#303135] sm:text-3xl">
                How to use.
              </h1>
            </div>
          </div>

          <Link
            href="/#tools"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#dedfe1] px-3.5 py-2.5 text-[11px] font-medium text-[#68696d] shadow-[5px_5px_10px_#bfc0c3,-5px_-5px_10px_#f7f7f8] transition duration-200 hover:-translate-y-0.5 hover:text-[#303135] active:translate-y-0 sm:px-5 sm:text-xs"
          >
            <ArrowLeft size={14} strokeWidth={1.8} />
            <span>All tools</span>
          </Link>
        </header>

        <section className="mt-12 sm:mt-16">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs uppercase tracking-[0.22em] text-[#77787c]">
              Ariansyah-Lab / Workflow Guide
            </p>
            <h2 className="text-5xl font-normal tracking-[-0.07em] text-[#303135] sm:text-7xl">
              Work with every tool.
            </h2>
            <p className="mt-6 text-sm leading-7 text-[#68696d] sm:text-base">
              Each utility is designed to process FTTH and KML/KMZ data directly in the browser. Choose a tool below to open it and follow its workflow.
            </p>
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-2" aria-label="Tool guides">
          {guides.map((guide) => (
            <article
              key={guide.number}
              className="rounded-[2rem] bg-[#dedfe1] p-6 shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8] sm:p-8"
            >
              <div className="flex items-start justify-between gap-5">
                <span className="text-sm font-semibold tracking-[0.16em] text-[#a4a5a8]">
                  {guide.number}
                </span>
                <span className="rounded-full bg-[#dedfe1] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#77787c] shadow-[inset_3px_3px_6px_#bfc0c3,inset_-3px_-3px_6px_#f7f7f8]">
                  {guide.category}
                </span>
              </div>

              <h3 className="mt-8 text-2xl font-semibold tracking-[-0.055em] text-[#303135] sm:text-3xl">
                {guide.title}
              </h3>
              <p className="mt-4 text-sm leading-6 text-[#68696d]">
                {guide.description}
              </p>

              <ol className="mt-6 space-y-3">
                {guide.steps.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-start gap-3 text-sm leading-6 text-[#68696d]"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#dedfe1] text-[11px] font-semibold text-[#68696d] shadow-[3px_3px_6px_#bfc0c3,-3px_-3px_6px_#f7f7f8]">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              <Link
                href={guide.href}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#dedfe1] px-5 py-3 text-xs font-semibold text-[#68696d] shadow-[5px_5px_10px_#bfc0c3,-5px_-5px_10px_#f7f7f8] transition duration-200 hover:-translate-y-0.5 hover:text-[#303135] active:translate-y-0"
              >
                Open tool
                <ArrowUpRight size={15} strokeWidth={1.8} />
              </Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
