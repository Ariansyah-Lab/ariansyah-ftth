import type { ReactNode } from "react";

type Props = {
  title: string;
  value: string;
  icon: ReactNode;
};

export default function StatCard({ title, value, icon }: Props) {
  return (
    <div className="rounded-[1.75rem] bg-[#dedfe1] p-5 text-[#3f4043] shadow-[9px_9px_18px_#bfc0c3,-9px_-9px_18px_#f7f7f8] transition duration-300 hover:-translate-y-1">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dedfe1] text-[#77787c] shadow-[inset_5px_5px_10px_#bfc0c3,inset_-5px_-5px_10px_#f7f7f8]">
        {icon}
      </div>

      <p className="text-sm text-[#77787c]">{title}</p>

      <h2 className="mt-2 break-words text-3xl font-semibold tracking-[-0.05em] text-[#3f4043]">
        {value}
      </h2>
    </div>
  );
}
