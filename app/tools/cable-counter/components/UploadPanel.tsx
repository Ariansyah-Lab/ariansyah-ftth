"use client";

import { UploadCloud } from "lucide-react";
import JSZip from "jszip";

import type {
  ChangeEvent,
  Dispatch,
  DragEvent,
  SetStateAction,
} from "react";
import type { CableResult } from "@/app/tools/cable-counter/utils/kmlParser";
import { parseKML } from "@/app/tools/cable-counter/utils/kmlParser";

type Props = {
  setData: Dispatch<SetStateAction<CableResult>>;
};

export default function UploadPanel({ setData }: Props) {
  async function processFile(file: File) {
    let kmlText = "";
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".kml")) {
      kmlText = await file.text();
    } else if (fileName.endsWith(".kmz")) {
      const zip = await JSZip.loadAsync(file);
      const kmlName = Object.keys(zip.files).find((name) =>
        name.toLowerCase().endsWith(".kml"),
      );

      if (!kmlName) {
        alert("KMZ tidak memiliki file KML");
        return;
      }

      const kmlFile = zip.files[kmlName];

      if (!kmlFile) {
        alert("File KML tidak ditemukan");
        return;
      }

      kmlText = await kmlFile.async("text");
    } else {
      alert("Upload file KML atau KMZ");
      return;
    }

    const title = file.name
      .replace(/\.kmz$/i, "")
      .replace(/\.kml$/i, "");

    const result = parseKML(kmlText, title);
    setData(result);
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    await processFile(file);
    event.target.value = "";
  }

  async function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    if (!file) return;

    await processFile(file);
  }

  return (
    <div className="rounded-[2rem] bg-[#dedfe1] p-5 shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8]">
      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="flex min-h-60 w-full cursor-pointer flex-col items-center justify-center gap-5 rounded-[1.5rem] bg-[#dedfe1] p-5 text-center shadow-[inset_6px_6px_12px_#bfc0c3,inset_-6px_-6px_12px_#f7f7f8] transition duration-200 hover:text-[#303135]"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#dedfe1] text-[#77787c] shadow-[5px_5px_10px_#bfc0c3,-5px_-5px_10px_#f7f7f8]">
          <UploadCloud size={32} strokeWidth={1.7} />
        </div>

        <div>
          <h2 className="text-base font-semibold text-[#3f4043]">
            Upload KMZ / KML
          </h2>

          <p className="mt-2 text-xs leading-5 text-[#77787c]">
            Drag &amp; drop atau klik untuk upload
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
