import type { Dispatch, SetStateAction } from "react";
import type { CableResult } from "@/app/tools/cable-counter/utils/kmlParser";

import { parseKML } from "@/app/tools/cable-counter/utils/kmlParser";


type Props = {
  setData: Dispatch<
    SetStateAction<CableResult>
  >;
};


export default function PastePanel({
  setData,
}: Props) {


  const handleProcess = () => {

    const textarea =
      document.querySelector(
        "textarea"
      ) as HTMLTextAreaElement;


    const xml =
      textarea.value;


    if (!xml) return;


    const parser =
      new DOMParser();


    const doc =
      parser.parseFromString(
        xml,
        "text/xml"
      );


    const folder =
      doc.getElementsByTagName(
        "Folder"
      )[0];


    const title =
      folder
        ?.getElementsByTagName("name")[0]
        ?.textContent
        ?.trim()
        ||
        "Cable Line Data";


    const result =
      parseKML(
        xml,
        title
      );


    setData(result);

  };



  return (
    <div
      className="
        rounded-2xl
        border border-white/15
        bg-white/8
        backdrop-blur-xl
        shadow-[0_20px_50px_rgba(0,0,0,0.35)]
        p-5
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
        placeholder="Paste KML XML disini..."
        className="
          mt-5
          w-full
          h-40
          resize-none
          rounded-xl
          bg-black/20
          border border-white/15
          p-4
          text-sm
          text-white
          placeholder:text-white/30
          outline-none
          focus:border-white/30
          transition
        "
      />



      <button
        onClick={handleProcess}
        className="
          mt-4
          w-full
          rounded-xl
          bg-white/10
          border border-white/15
          py-3
          text-sm
          font-medium
          text-white
          cursor-pointer
          transition-all
          duration-200
          hover:scale-105
          hover:bg-white/15
        "
      >
        Process KML
      </button>


    </div>
  );
}