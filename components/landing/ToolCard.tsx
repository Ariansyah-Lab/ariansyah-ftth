import Link from "next/link";

interface ToolCardProps {
  title: string;
  description: string;
  icon: string;
  category: string;
  href: string;
  index: number;
}

export default function ToolCard({
  title,
  description,
  icon,
  category,
  href,
  index,
}: ToolCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-[250px] flex-col rounded-[2rem] bg-[#dedfe1] p-7 text-[#3f4043] shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8] transition duration-300 hover:-translate-y-1 hover:text-[#242529] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f9094] focus-visible:ring-offset-4 focus-visible:ring-offset-[#dedfe1] sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dedfe1] text-2xl grayscale shadow-[inset_5px_5px_10px_#bfc0c3,inset_-5px_-5px_10px_#f7f7f8]">
          {icon}
        </div>
        <span className="text-sm font-semibold tabular-nums text-[#b2b3b6]">
          0{index + 1}
        </span>
      </div>

      <div className="mt-auto pt-9">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#77787c]">
          {category}
        </p>

        <div className="flex items-end justify-between gap-4">
          <h3 className="max-w-[15ch] text-2xl font-bold leading-tight tracking-[-0.05em] text-[#3f4043] sm:text-3xl">
            {title}
          </h3>

          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dedfe1] text-xl text-[#77787c] shadow-[5px_5px_10px_#bfc0c3,-5px_-5px_10px_#f7f7f8] transition duration-300 group-hover:text-[#303135] group-active:shadow-[inset_3px_3px_6px_#bfc0c3,inset_-3px_-3px_6px_#f7f7f8]">
            ↗
          </span>
        </div>

        <p className="mt-3 max-w-[36ch] text-sm leading-6 text-[#68696d]">
          {description}
        </p>
      </div>
    </Link>
  );
}
