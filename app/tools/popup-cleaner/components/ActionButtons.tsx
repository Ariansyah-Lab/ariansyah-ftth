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

    <div
      className="
        grid
        grid-cols-2
        gap-4
      "
    >

      <button
        onClick={onProcess}
        className="
          h-14
          rounded-xl
          bg-white/10
          border
          border-white/15
          text-white
          font-medium
          transition-all
          duration-200
          hover:bg-white/15
          hover:scale-[1.02]
          active:scale-100
          cursor-pointer
        "
      >
        Process
      </button>

      <button
        onClick={onClear}
        className="
          h-14
          rounded-xl
          bg-white/10
          border
          border-white/15
          text-white
          font-medium
          transition-all
          duration-200
          hover:bg-red-500/20
          hover:border-red-500/30
          hover:scale-[1.02]
          active:scale-100
          cursor-pointer
        "
      >
        Clear Data
      </button>

    </div>

  );

}