import UploadPanel from "./UploadPanel";
import PastePanel from "./PastePanel";

import type { Dispatch, SetStateAction } from "react";
import type { CableResult } from "@/app/tools/trk-permit/utils/kmlParser";

type Props = {
  setData: Dispatch<SetStateAction<CableResult>>;
  clearData: () => void;
};

export default function Sidebar({ setData, clearData }: Props) {
  return (
    <aside className="w-full space-y-6 lg:w-80 lg:shrink-0">
      <UploadPanel setData={setData} />

      <PastePanel setData={setData} />

      <button
        type="button"
        onClick={clearData}
        className="h-12 w-full cursor-pointer rounded-2xl bg-[#dedfe1] text-sm font-semibold text-[#68696d] shadow-[7px_7px_14px_#bfc0c3,-7px_-7px_14px_#f7f7f8] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#303135] active:translate-y-0 active:shadow-[inset_5px_5px_10px_#bfc0c3,inset_-5px_-5px_10px_#f7f7f8]"
      >
        Clear Data
      </button>
    </aside>
  );
}
