"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    clearRef.current = () => {
      setUploadedFile("");

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    };

    return () => {
      clearRef.current = null;
    };
  }, [clearRef]);

  const processFile = useCallback(
    async (file: File) => {
      const fileName = file.name;
      const extension = fileName.split(".").pop()?.toLowerCase();

      if (extension !== "kml" && extension !== "kmz") {
        alert("Upload file KML atau KMZ.");
        return;
      }

      setUploadedFile(fileName);

      if (extension === "kml") {
        const xml = await file.text();
        onUpload(xml, fileName, "kml");
        return;
      }

      const zip = await JSZip.loadAsync(file);
      const kmlName = Object.keys(zip.files).find((name) =>
        name.toLowerCase().endsWith(".kml"),
      );

      if (!kmlName) {
        alert("KMZ tidak memiliki file KML.");
        setUploadedFile("");
        return;
      }

      const kmlFile = zip.file(kmlName);

      if (!kmlFile) {
        alert("File KML tidak ditemukan.");
        setUploadedFile("");
        return;
      }

      const xml = await kmlFile.async("text");
      onUpload(xml, fileName, "kmz", zip);
    },
    [onUpload],
  );

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    await processFile(file);
    event.target.value = "";
  }

  async function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files?.[0];

    if (!file) return;

    await processFile(file);
  }

  return (
    <div className="rounded-[2rem] bg-[#dedfe1] p-5 shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8]">
      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="flex min-h-64 cursor-pointer flex-col items-center justify-center gap-5 rounded-[1.5rem] bg-[#dedfe1] p-6 text-center shadow-[inset_6px_6px_12px_#bfc0c3,inset_-6px_-6px_12px_#f7f7f8] transition duration-300 hover:text-[#303135]"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#dedfe1] text-[#77787c] shadow-[5px_5px_10px_#bfc0c3,-5px_-5px_10px_#f7f7f8]">
          <UploadCloud size={32} strokeWidth={1.7} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#3f4043]">
            Upload KMZ / KML
          </h2>

          {uploadedFile ? (
            <p className="mt-2 max-w-[240px] truncate text-sm text-[#68696d]">
              ✓ {uploadedFile}
            </p>
          ) : (
            <p className="mt-2 text-sm text-[#77787c]">
              Drag &amp; drop atau klik untuk upload
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
  