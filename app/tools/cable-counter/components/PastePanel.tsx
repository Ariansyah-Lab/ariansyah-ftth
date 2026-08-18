"use client";

import { useState } from "react";
import { ClipboardPaste } from "lucide-react";

import type { Dispatch, SetStateAction } from "react";
import type { CableResult } from "@/app/tools/cable-counter/utils/kmlParser";
import { parseKML } from "@/app/tools/cable-counter/utils/kmlParser";

type Props = {
  setData: Dispatch<SetStateAction<CableResult>>;
};

export default function PastePanel({ setData }: Props) {
  const [xml, setXml] = useState("");

  function handleProcess() {
    if (!xml.trim()) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");
    const folder = doc.getElementsByTagName("Folder")[0];
    const title =
      folder?.getElementsByTagName("name")[0]?.textContent?.trim() ||
      "Cable Line Data";

    const result = parseKML(xml, title);
    setData(result);
  }

  return (
    <div className="rounded-[2rem] bg-[#dedfe1] p-5 shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dedfe1] text-[#77787c] shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8]">
          <ClipboardPaste size={18} strokeWidth={1.8} />
        </div>

        <h2 className="text-base font-semibold text-[#3f4043]">
          Paste KML XML
        </h2>
      </div>

      <textarea
        value={xml}
        onChange={(event) => setXml(event.target.value)}
        placeholder="Paste KML XML di sini..."
        className="mt-5 h-40 w-full resize-none rounded-2xl bg-[#dedfe1] p-4 text-sm leading-6 text-[#3f4043] shadow-[inset_6px_6px_12px_#bfc0c3,inset_-6px_-6px_12px_#f7f7f8] outline-none placeholder:text-[#a4a5a8] focus:ring-2 focus:ring-[#b4b5b8]"
      />

      <button
        type="button"
        onClick={handleProcess}
        className="mt-4 w-full cursor-pointer rounded-2xl bg-[#dedfe1] py-3 text-sm font-medium text-[#68696d] shadow-[5px_5px_10px_#bfc0c3,-5px_-5px_10px_#f7f7f8] transition duration-200 hover:-translate-y-0.5 hover:text-[#303135] active:shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8]"
      >
        Process KML
      </button>
    </div>
  );
}
