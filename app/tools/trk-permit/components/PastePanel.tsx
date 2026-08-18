"use client";

import { useRef } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { CableResult } from "@/app/tools/trk-permit/utils/kmlParser";
import { parseKML } from "@/app/tools/trk-permit/utils/kmlParser";

type Props = {
  setData: Dispatch<SetStateAction<CableResult>>;
};

export default function PastePanel({ setData }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleProcess = () => {
    const xml = textareaRef.current?.value;

    if (!xml) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");
    const folder = doc.getElementsByTagName("Folder")[0];
    const title =
      folder
        ?.getElementsByTagName("name")[0]
        ?.textContent
        ?.trim() || "Cable Line Data";

    const result = parseKML(xml, title);
    setData(result);
  };

  return (
    <div className="rounded-[2rem] bg-[#dedfe1] p-5 shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8] sm:p-6">
      <h2 className="text-center text-xl font-semibold tracking-[-0.04em] text-[#3f4043]">
        Paste KML XML
      </h2>

      <textarea
        ref={textareaRef}
        placeholder="Paste KML XML di sini..."
        className="mt-5 h-40 w-full resize-none rounded-[1.5rem] bg-[#dedfe1] p-4 text-sm leading-6 text-[#3f4043] shadow-[inset_6px_6px_12px_#bfc0c3,inset_-6px_-6px_12px_#f7f7f8] outline-none transition-all duration-200 placeholder:text-[#a4a5a8] focus:shadow-[inset_8px_8px_16px_#bfc0c3,inset_-8px_-8px_16px_#f7f7f8]"
      />

      <button
        type="button"
        onClick={handleProcess}
        className="mt-4 h-12 w-full cursor-pointer rounded-2xl bg-[#dedfe1] text-sm font-semibold text-[#4f5054] shadow-[7px_7px_14px_#bfc0c3,-7px_-7px_14px_#f7f7f8] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#303135] active:translate-y-0 active:shadow-[inset_5px_5px_10px_#bfc0c3,inset_-5px_-5px_10px_#f7f7f8]"
      >
        Process KML
      </button>
    </div>
  );
}
