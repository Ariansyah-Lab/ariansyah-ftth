"use client";

import { useEffect, useState } from "react";
import type {
  ChangeEvent,
  DragEvent,
  MutableRefObject,
} from "react";

import JSZip from "jszip";
import { UploadCloud } from "lucide-react";

type Props = {
  onUpload: (
    xml: string,
    fileName: string,
    fileType: "kml" | "kmz",
    zip?: JSZip,
  ) => void;
  clearRef: MutableRefObject<(() => void) | null>;
};

export default function UploadPanel({ onUpload, clearRef }: Props) {
  const [uploadedFile, setUploadedFile] = useState("");

  useEffect(() => {
    clearRef.current = () => {
      setUploadedFile("");
    };
  }, [clearRef]);

  async function processFile(file: File) {
    const fileName = file.name;
    setUploadedFile(fileName);

    const extension = fileName.split(".").pop()?.toLowerCase();

    if (extension === "kml") {
      const xml = await file.text();
      onUpload(xml, fileName, "kml");
      return;
    }

    if (extension === "kmz") {
      const zip = await JSZip.loadAsync(file);
      const kmlName = Object.keys(zip.files).find((name) =>
        name.toLowerCase().endsWith(".kml"),
      );

      if (!kmlName) {
        alert("KMZ tidak memiliki file KML.");
        return;
      }

      const kmlFile = zip.file(kmlName);

      if (!kmlFile) {
        alert("File KML tidak ditemukan.");
        return;
      }

      const xml = await kmlFile.async("text");
      onUpload(xml, fileName, "kmz", zip);
      return;
    }

    alert("Upload file KML atau KMZ.");
  }

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    await processFile(file);
    e.target.value = "";
  }

  async function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();

    const file = e.dataTransfer.files?.[0];

    if (!file) return;

    await processFile(file);
  }

  return (
    <div className="rounded-[2rem] bg-[#dedfe1] p-5 shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8] sm:p-6">
      <label className="block w-full cursor-pointer">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex min-h-60 flex-col items-center justify-center gap-4 rounded-[1.5rem] bg-[#dedfe1] px-6 py-10 text-center shadow-[inset_6px_6px_12px_#bfc0c3,inset_-6px_-6px_12px_#f7f7f8] transition-all duration-200 hover:shadow-[inset_8px_8px_16px_#bfc0c3,inset_-8px_-8px_16px_#f7f7f8]"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#dedfe1] text-[#68696d] shadow-[6px_6px_12px_#bfc0c3,-6px_-6px_12px_#f7f7f8]">
            <UploadCloud size={32} strokeWidth={1.6} />
          </div>

          <h2 className="text-xl font-semibold tracking-[-0.04em] text-[#3f4043]">
            Upload KMZ / KML
          </h2>

          {uploadedFile ? (
            <p className="max-w-full break-all text-sm font-medium text-[#68696d]">
              ✓ {uploadedFile}
            </p>
          ) : (
            <p className="text-sm text-[#77787c]">
              Drag &amp; Drop atau klik untuk upload
            </p>
          )}
        </div>

        <input
          hidden
          type="file"
          accept=".kml,.kmz"
          onChange={handleUpload}
        />
      </label>
    </div>
  );
}
