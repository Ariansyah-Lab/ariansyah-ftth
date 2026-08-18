"use client";

import { UploadCloud } from "lucide-react";
import type {
  ChangeEvent,
  Dispatch,
  DragEvent,
  SetStateAction,
} from "react";
import JSZip from "jszip";

import type { CableResult } from "@/app/tools/trk-permit/utils/kmlParser";
import { parseKML } from "@/app/tools/trk-permit/utils/kmlParser";

type Props = {
  setData: Dispatch<SetStateAction<CableResult>>;
};

export default function UploadPanel({ setData }: Props) {
  async function processFile(file: File) {
    let kmlText = "";

    if (file.name.toLowerCase().endsWith(".kml")) {
      kmlText = await file.text();
    } else if (file.name.toLowerCase().endsWith(".kmz")) {
      const zip = await JSZip.loadAsync(file);
      const kmlName = Object.keys(zip.files).find((name) =>
        name.toLowerCase().endsWith(".kml"),
      );

      if (!kmlName) {
        alert("KMZ tidak memiliki file KML");
        return;
      }

      const kmlFile = zip.file(kmlName);

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

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    if (!file) return;

    await processFile(file);
  }

  return (
    <div className="rounded-[2rem] bg-[#dedfe1] p-5 shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8] sm:p-6">
      <label className="block w-full cursor-pointer">
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          className="flex min-h-60 flex-col items-center justify-center gap-5 rounded-[1.5rem] bg-[#dedfe1] p-6 text-center shadow-[inset_6px_6px_12px_#bfc0c3,inset_-6px_-6px_12px_#f7f7f8] transition-all duration-200 hover:shadow-[inset_8px_8px_16px_#bfc0c3,inset_-8px_-8px_16px_#f7f7f8]"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#dedfe1] text-[#68696d] shadow-[6px_6px_12px_#bfc0c3,-6px_-6px_12px_#f7f7f8]">
            <UploadCloud size={32} strokeWidth={1.6} />
          </div>

          <div>
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-[#3f4043]">
              Upload KMZ / KML
            </h2>

            <p className="mt-2 text-sm text-[#77787c]">
              Drag &amp; Drop atau klik untuk Upload
            </p>
          </div>
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
