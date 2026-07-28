import Link from "next/link";

interface ToolCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
}

export default function ToolCard({
  title,
  description,
  icon,
  href,
}: ToolCardProps) {
  return (
    <Link href={href}>
      <div
        className="
          group
          rounded-2xl
          border
          border-white/10
          bg-white/5
          p-5
          backdrop-blur-md
          transition
          hover:-translate-y-1
          hover:border-white/20
          hover:bg-white/10
        "
      >

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-2xl">
          {icon}
        </div>

        <h3 className="mb-2 text-lg font-semibold text-white">
          {title}
        </h3>

        <p className="text-sm leading-relaxed text-gray-400">
          {description}
        </p>

      </div>
    </Link>
  );
}