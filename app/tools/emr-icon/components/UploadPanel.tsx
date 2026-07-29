"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { ChangeEvent, DragEvent } from "react";

import JSZip from "jszip";
import { UploadCloud } from "lucide-react";

type Props = {
  onUpload: (
    xml: string,
    fileName: string,
    fileType: "kml" | "kmz",
    zip?: JSZip
  ) => void;
  clearRef: React.MutableRefObject<(() => void) | null>;
};

export default function UploadPanel({
  onUpload,
  clearRef,
}: Props) {
  const [uploadedFile, setUploadedFile] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    clearRef.current = () => {
      setUploadedFile("");
    };

    // Cleanup ref saat komponen unmount (opsional, tapi lebih bersih)
    return () => {
      clearRef.current = null;
    };
  }, [clearRef]);

  const processFile = useCallback(
    async (file: File) => {
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
          name.toLowerCase().endsWith(".kml")
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
    },
    [onUpload]
  );

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    await processFile(file);
    e.target.value = "";
  }

  async function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    await processFile(file);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/4 backdrop-blur-xl p-5 shadow-lg">
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="
          min-h-56
          rounded-xl
          border
          border-dashed
          border-white/15
          flex
          flex-col
          items-center
          justify-center
          gap-5
          cursor-pointer
          transition-all
          duration-300
          hover:border-white/25
          hover:bg-white/3
        "
      >
        <UploadCloud
          size={52}
          strokeWidth={1.8}
          className="text-white/70"
        />

        <div className="text-center">
          <h2 className="text-xl font-semibold text-white">
            Upload KMZ / KML
          </h2>

          {uploadedFile ? (
            <p className="mt-2 text-sm text-green-400">
              ✓ {uploadedFile}
            </p>
          ) : (
            <p className="mt-2 text-sm text-white/50">
              Drag & Drop atau klik untuk upload
            </p>
          )}
        </div>

        <input
          ref={inputRef}
          hidden
          type="file"
          accept=".kml,.kmz"
          onChange={handleUpload}
        />
      </label>
    </div>
  );
}