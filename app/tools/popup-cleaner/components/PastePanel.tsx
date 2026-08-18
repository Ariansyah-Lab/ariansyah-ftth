"use client";

import { forwardRef } from "react";

const PastePanel = forwardRef<HTMLTextAreaElement>((_, ref) => {
  return (
    <div className="rounded-[2rem] bg-[#dedfe1] p-5 shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8] sm:p-6">
      <h2 className="text-center text-xl font-semibold tracking-[-0.04em] text-[#3f4043]">
        Paste KML XML
      </h2>

      <textarea
        ref={ref}
        placeholder="Paste KML atau XML di sini..."
        className="mt-5 h-44 w-full resize-none rounded-[1.5rem] bg-[#dedfe1] p-4 text-sm leading-6 text-[#3f4043] shadow-[inset_6px_6px_12px_#bfc0c3,inset_-6px_-6px_12px_#f7f7f8] outline-none transition-all duration-200 placeholder:text-[#a4a5a8] focus:shadow-[inset_8px_8px_16px_#bfc0c3,inset_-8px_-8px_16px_#f7f7f8]"
      />
    </div>
  );
});

PastePanel.displayName = "PastePanel";

export default PastePanel;
