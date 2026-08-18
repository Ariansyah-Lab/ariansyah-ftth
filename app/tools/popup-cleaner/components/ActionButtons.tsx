"use client";

type Props = {
  onProcess?: () => void;
  onClear?: () => void;
};

export default function ActionButtons({
  onProcess,
  onClear,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <button
        type="button"
        onClick={onProcess}
        className="h-14 cursor-pointer rounded-2xl bg-[#dedfe1] text-sm font-semibold text-[#4f5054] shadow-[7px_7px_14px_#bfc0c3,-7px_-7px_14px_#f7f7f8] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#303135] active:translate-y-0 active:shadow-[inset_5px_5px_10px_#bfc0c3,inset_-5px_-5px_10px_#f7f7f8]"
      >
        Process
      </button>

      <button
        type="button"
        onClick={onClear}
        className="h-14 cursor-pointer rounded-2xl bg-[#dedfe1] text-sm font-semibold text-[#68696d] shadow-[7px_7px_14px_#bfc0c3,-7px_-7px_14px_#f7f7f8] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#303135] active:translate-y-0 active:shadow-[inset_5px_5px_10px_#bfc0c3,inset_-5px_-5px_10px_#f7f7f8]"
      >
        Clear Data
      </button>
    </div>
  );
}
