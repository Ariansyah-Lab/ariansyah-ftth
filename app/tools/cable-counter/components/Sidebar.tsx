import UploadPanel from "./UploadPanel";
import PastePanel from "./PastePanel";

import type { Dispatch, SetStateAction } from "react";
import type { CableResult } from "@/app/tools/cable-counter/utils/kmlParser";

type Props = {
  setData: Dispatch<SetStateAction<CableResult>>;
  clearData: () => void;
};

export default function Sidebar({ setData, clearData }: Props) {
  return (
    <aside className="w-full shrink-0 space-y-6 lg:w-80">
      <UploadPanel setData={setData} />

      <PastePanel setData={setData} />

      <button
        type="button"
        onClick={clearData}
        className="w-full cursor-pointer rounded-2xl bg-[#dedfe1] py-3.5 text-sm font-medium text-[#68696d] shadow-[7px_7px_14px_#bfc0c3,-7px_-7px_14px_#f7f7f8] transition duration-200 hover:-translate-y-0.5 hover:text-[#303135] active:shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8]"
      >
        Clear Data
      </button>
    </aside>
  );
}
