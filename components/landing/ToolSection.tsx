import ToolCard from "./ToolCard";

const tools = [
  {
    title: "Line Counter",
    description:
      "FTTH line analysis & route information.",
    icon: "🔌",
    href: "/tools/cable-counter",
  },
  {
    title: "Popup Cleaner",
    description:
      "KML/KMZ popup data cleaning utility.",
    icon: "🧹",
    href: "/tools/popup-cleaner",
  },
  {
    title: "TRK Permit",
    description:
      "KML/KMZ to Excel permit processing.",
    icon: "📄",
    href: "/tools/trk-permit",
  },
];

export default function ToolSection() {
  return (
    <div className="grid gap-4">
      {tools.map((tool) => (
        <ToolCard
          key={tool.title}
          title={tool.title}
          description={tool.description}
          icon={tool.icon}
          href={tool.href}
        />
      ))}
    </div>
  );
}