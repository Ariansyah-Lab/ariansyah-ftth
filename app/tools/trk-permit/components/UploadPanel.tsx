"use client";

import { UploadCloud } from "lucide-react";

import type { Dispatch, SetStateAction } from "react";
import type { CableResult } from "@/app/tools/trk-permit/utils/kmlParser";

import { parseKML } from "@/app/tools/trk-permit/utils/kmlParser";

import JSZip from "jszip";

type Props = {
  setData: Dispatch<SetStateAction<CableResult>>;
};

export default function UploadPanel({ setData }: Props) {
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    let kmlText = "";

    // KML langsung
    if (file.name.toLowerCase().endsWith(".kml")) {
      kmlText = await file.text();
    }
    // KMZ extract
    else if (file.name.toLowerCase().endsWith(".kmz")) {
      const zip = await JSZip.loadAsync(file);
      const kmlName = Object.keys(zip.files).find((name) =>
        name.toLowerCase().endsWith(".kml")
      );
      if (!kmlName) {
        alert("KMZ tidak memiliki file KML");
        return;
      }
      kmlText = await zip.files[kmlName].async("text");
    } else {
      alert("Upload file KML atau KMZ");
      return;
    }

    const title = file.name.replace(/\.kmz$/i, "").replace(/\.kml$/i, "");
    const result = parseKML(kmlText, title);
    setData(result);
  }

  return (
    // ✅ Tambahkan wrapper dengan class sama persis seperti di cable-counter
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
      <label
        className="
          w-full
          min-h-60
          rounded-xl
          border
          border-dashed
          border-white/25
          flex
          flex-col
          items-center
          justify-center
          gap-5
          p-5
          cursor-pointer
          transition-all
          duration-300
          hover:bg-white/5
        "
      >
        <div
          className="
            w-16
            h-16
            rounded-2xl
            bg-white/10
            border border-white/15
            flex
            items-center
            justify-center
            shadow-lg
          "
        >
          <UploadCloud size={34} className="text-white" />
        </div>

        <div className="text-center">
          <h2 className="text-lg font-semibold text-white">
            Upload KMZ / KML
          </h2>
          <p className="mt-2 text-sm text-white/50">
            Drag & Drop atau klik untuk Upload
          </p>
        </div>

        <input
          type="file"
          accept=".kml,.kmz"
          hidden
          onChange={handleUpload}
        />
      </label>
    </div>
  );
}