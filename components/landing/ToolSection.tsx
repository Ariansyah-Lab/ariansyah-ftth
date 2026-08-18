import Link from "next/link";
import ToolCard from "./ToolCard";

const tools = [
  {
    title: "Line Counter",
    description: "FTTH line analysis & route information.",
    icon: "🔌",
    category: "FTTH Analysis",
    href: "/tools/cable-counter",
  },
  {
    title: "Popup Cleaner",
    description: "KML/KMZ popup data cleaning utility.",
    icon: "🧹",
    category: "KML / KMZ",
    href: "/tools/popup-cleaner",
  },
  {
    title: "TRK Permit",
    description: "KML/KMZ to Excel permit processing.",
    icon: "📄",
    category: "Permit Processing",
    href: "/tools/trk-permit",
  },
  {
    title: "EMR Standard Icon",
    description: "Standardize KMZ icons, colors, scales, and line styles.",
    icon: "📍",
    category: "Map Utilities",
    href: "/tools/emr-icon",
  },
  {
    title: "FTTH Point Editor",
    description: "Rename, reorder, and export FTTH point data.",
    icon: "🗺️",
    category: "Spatial Utility",
    href: "/tools/ftth-point-editor",
  },
  {
    title: "FTTH Cable Snapper",
    description: "Snap cable vertices to nearby poles and export corrected KMZ.",
    icon: "🧲",
    category: "Spatial Utility",
    href: "/tools/ftth-cable-snapper",
  },
];

export default function ToolSection() {
  return (
    <section
      id="tools"
      aria-labelledby="tools-heading"
      className="relative flex min-h-screen items-center px-8 py-28 sm:px-16 lg:px-24"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-12 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.22em] text-[#77787c]">
              Ariansyah-Lab / Tools
            </p>
            <h2
              id="tools-heading"
              className="text-5xl font-normal tracking-[-0.065em] text-[#303135] sm:text-7xl"
            >
              All tools.
            </h2>
          </div>

          <Link
            href="/how-to-use"
            className="w-fit rounded-full bg-[#dedfe1] px-5 py-3 text-xs font-medium text-[#68696d] shadow-[5px_5px_10px_#bfc0c3,-5px_-5px_10px_#f7f7f8] transition hover:-translate-y-0.5 hover:text-[#303135]"
          >
            How to use ↗
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {tools.map((tool, index) => (
            <ToolCard
              key={tool.title}
              index={index}
              title={tool.title}
              description={tool.description}
              icon={tool.icon}
              category={tool.category}
              href={tool.href}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
