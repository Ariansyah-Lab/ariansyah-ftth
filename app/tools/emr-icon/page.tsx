"use client";

import { useRef, useState } from "react";
import JSZip from "jszip";

import Header from "@/app/tools/emr-icon/components/Header";
import UploadPanel from "@/app/tools/emr-icon/components/UploadPanel";
import ActionButtons from "@/app/tools/emr-icon/components/ActionButtons";

import { repairEMRIcon } from "@/app/tools/emr-icon/utils/emrIcon";
import { downloadFile } from "@/app/tools/emr-icon/utils/downloadFile";

export default function Home() {
  const uploadClearRef = useRef<(() => void) | null>(null);

  const [xml, setXml] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"kml" | "kmz">("kml");
  const [zip, setZip] = useState<JSZip | null>(null);

  function handleUpload(
    text: string,
    name: string,
    type: "kml" | "kmz",
    zipFile?: JSZip,
  ) {
    setXml(text);
    setFileName(name);
    setFileType(type);
    setZip(zipFile ?? null);
  }

  async function handleProcess() {
    if (!xml) {
      alert("Upload KMZ atau KML terlebih dahulu.");
      return;
    }

    const result = repairEMRIcon(xml);

    await downloadFile(
      result,
      fileName.replace(/\.(kml|kmz)$/i, ""),
      fileType,
      zip ?? undefined,
    );
  }

  function handleClear() {
    setXml("");
    setFileName("");
    setFileType("kml");
    setZip(null);
    uploadClearRef.current?.();
  }

  return (
    <main className="min-h-screen bg-[#dedfe1] text-[#3f4043]">
      <Header />

      <section className="mx-auto w-full max-w-[1600px] px-5 pb-16 pt-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <UploadPanel
            onUpload={handleUpload}
            clearRef={uploadClearRef}
          />

          <ActionButtons
            onProcess={handleProcess}
            onClear={handleClear}
          />
        </div>
      </section>
    </main>
  );
}
