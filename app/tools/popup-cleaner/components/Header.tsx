"use client";

import { House } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Header() {

  const router = useRouter();

  return (

    <div className="flex items-center gap-4">

      <div
        onClick={() => router.push("/")}
        className="
          w-12
          h-12
          rounded-xl
          bg-white/10
          border border-white/10
          flex
          items-center
          justify-center
          cursor-pointer
          transition-all
          duration-200
          hover:scale-105
        "
      >

        <House
          size={22}
          className="text-white"
        />

      </div>


      <div>

        <h1
          className="
            text-2xl
            font-semibold
            tracking-wide
            text-white
          "
        >
          Popup Cleaner
        </h1>

        <p
          className="
            text-sm
            text-white/50
          "
        >
          Ariansyah-Lab
        </p>

      </div>

    </div>

  );

}