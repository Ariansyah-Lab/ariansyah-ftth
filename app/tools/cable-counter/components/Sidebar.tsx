import UploadPanel from "./UploadPanel";
import PastePanel from "./PastePanel";

import type { Dispatch, SetStateAction } from "react";
import type { CableResult } from "@/app/tools/cable-counter/utils/kmlParser";

type Props = {
  setData: Dispatch<
    SetStateAction<CableResult>
  >;

  clearData: () => void;
};


export default function Sidebar({
  setData,
  clearData,
}: Props) {

return (

<aside
  className="
    w-80
    p-6
    space-y-6
  "
>


  <UploadPanel
    setData={setData}
  />


  <PastePanel
    setData={setData}
  />


  <button
    onClick={clearData}
    className="
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
    Clear Data
  </button>


</aside>

);

}