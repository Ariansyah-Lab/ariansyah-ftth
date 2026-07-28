import React from "react";

type Props = {
  title: string;
  value: string;
  icon: React.ReactNode;
};

export default function StatCard({
  title,
  value,
  icon,
}: Props) {
  return (
    <div
      className="
        rounded-2xl
        border border-white/15
        bg-white/8
        backdrop-blur-xl
        shadow-[0_20px_50px_rgba(0,0,0,0.35)]
        p-5
        transition-all
        duration-300
        hover:-translate-y-1
        hover:bg-white/10
      "
    >

      <div
        className="
          w-11
          h-11
          rounded-xl
          bg-white/10
          border border-white/15
          flex
          items-center
          justify-center
          mb-5
        "
      >
        {icon}
      </div>


      <p className="text-sm text-white/60">
        {title}
      </p>


      <h2 className="
        mt-2
        text-3xl
        font-semibold
        text-white
      ">
        {value}
      </h2>


    </div>
  );
}