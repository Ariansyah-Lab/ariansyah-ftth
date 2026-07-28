"use client";

import { forwardRef } from "react";

const PastePanel = forwardRef<
  HTMLTextAreaElement
>((_, ref) => {

  return (

    <div
      className="
        rounded-2xl
        bg-white/5
        border
        border-white/10
        p-6
        backdrop-blur-xl
      "
    >

      <h2
        className="
          text-lg
          font-semibold
          text-white
          text-center
        "
      >
        Paste KML XML
      </h2>


      <textarea
        ref={ref}
        placeholder="Paste KML atau XML di sini..."
        className="
          mt-5
          w-full
          h-44
          resize-none
          rounded-xl
          bg-black/20
          border
          border-white/15
          p-4
          text-sm
          text-white
          placeholder:text-white/30
          outline-none
          transition-all
          duration-200
          focus:border-white/30
          focus:ring-1
          focus:ring-white/10
        "
      />

    </div>

  );

});

PastePanel.displayName = "PastePanel";

export default PastePanel;