"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";

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

export default function UploadPanel({ onUpload, clearRef }: Props) {
  const [uploadedFile, setUploadedFile] = useState("");

  // 🔁 Expose reset function ke parent via ref
  useEffect(() => {
    clearRef.current = () => {
      setUploadedFile("");
    };
  }, [clearRef]);

  // ─── Proses file ──────────────────────────────────────────────
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
  }

  // ─── Event handlers ───────────────────────────────────────────
  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    e.target.value = "";
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  }

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div
      className="
        rounded-2xl border border-white/15 bg-white/8
        backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]
        p-5
      "
    >
      <label
        className="
          block w-full cursor-pointer
          transition-all duration-300 hover:bg-white/5
        "
      >
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="
            min-h-56 rounded-xl border border-dashed border-white/25
            flex flex-col items-center justify-center gap-4
          "
        >
          <UploadCloud size={42} className="text-white" />
          <h2 className="text-xl font-semibold text-white">
            Upload KMZ / KML
          </h2>

          {uploadedFile ? (
            <p className="text-sm text-green-400 text-center">
              ✓ {uploadedFile}
            </p>
          ) : (
            <p className="text-sm text-white/50">
              Drag & Drop atau klik untuk upload
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