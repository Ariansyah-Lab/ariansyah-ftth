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
        className="h-14 cursor-pointer rounded-2xl bg-[#dedfe1] font-medium text-[#3f4043] shadow-[7px_7px_14px_#bfc0c3,-7px_-7px_14px_#f7f7f8] transition duration-200 hover:-translate-y-0.5 hover:text-[#242529] active:translate-y-0 active:shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8]"
      >
        Process
      </button>

      <button
        type="button"
        onClick={onClear}
        className="h-14 cursor-pointer rounded-2xl bg-[#dedfe1] font-medium text-[#77787c] shadow-[7px_7px_14px_#bfc0c3,-7px_-7px_14px_#f7f7f8] transition duration-200 hover:-translate-y-0.5 hover:text-[#3f4043] active:translate-y-0 active:shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8]"
      >
        Clear Data
      </button>
    </div>
  );
}
