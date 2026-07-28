"use client";

import { useRef, useState } from "react";

import JSZip from "jszip";

import Header from "@/app/tools/popup-cleaner/components/Header";
import UploadPanel from "@/app/tools/popup-cleaner/components/UploadPanel";
import PastePanel from "@/app/tools/popup-cleaner/components/PastePanel";
import ActionButtons from "@/app/tools/popup-cleaner/components/ActionButtons";

import { cleanPopup } from "@/app/tools/popup-cleaner/utils/popupCleaner";
import { downloadFile } from "@/app/tools/popup-cleaner/utils/downloadFile";

export default function Home() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const uploadClearRef = useRef<(() => void) | null>(null);

  const [xml, setXml] = useState("");
  const [fileName, setFileName] = useState("");
  const [isUpload, setIsUpload] = useState(false);
  const [fileType, setFileType] = useState<"kml" | "kmz">("kml");
  const [zip, setZip] = useState<JSZip | null>(null);

  function getTopFolderName(kml: string) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(kml, "text/xml");
    const folderName = xml.querySelector("Document > Folder > name");
    return folderName?.textContent?.trim() || "popup_cleaned";
  }

  function handleUpload(
    text: string,
    name: string,
    type: "kml" | "kmz",
    zipFile?: JSZip
  ) {
    setXml(text);
    setFileName(name);
    setIsUpload(true);
    setFileType(type);
    setZip(zipFile ?? null);
  }

  function handleProcess() {
    const input = xml || textareaRef.current?.value || "";
    if (!input) {
      alert("Upload atau Paste KML terlebih dahulu.");
      return;
    }

    const result = cleanPopup(input);
    const cleanName = isUpload
      ? fileName.replace(/\.(kml|kmz)$/i, "")
      : getTopFolderName(input);

    downloadFile(result.cleanedKml, cleanName, fileType, zip ?? undefined);
  }

  function handleClear() {
    setXml("");
    setFileName("");
    setIsUpload(false);
    setFileType("kml");
    setZip(null);

    if (uploadClearRef.current) uploadClearRef.current();
    if (textareaRef.current) textareaRef.current.value = "";
  }

  return (
    <>
      {/* ✅ Header dibungkus dengan class yang sama seperti sebelumnya */}
      <header className="px-6 pt-3">
        <Header />
      </header>

      {/* ✅ Main dengan padding dan posisi tengah */}
      <main className="flex justify-center px-6 py-8">
        <div className="w-full max-w-2xl space-y-6">
          <UploadPanel onUpload={handleUpload} clearRef={uploadClearRef} />
          <PastePanel ref={textareaRef} />
          <ActionButtons onProcess={handleProcess} onClear={handleClear} />
        </div>
      </main>
    </>
  );
}