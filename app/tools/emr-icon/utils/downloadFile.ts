import JSZip from "jszip";

export async function downloadFile(
  kml: string,
  fileName: string,
  type: "kml" | "kmz",
  zip?: JSZip
) {
  if (type === "kml") {
    const blob = new Blob([kml], {
      type: "application/vnd.google-earth.kml+xml",
    });

    save(blob, `${fileName}.kml`);
    return;
  }

  if (!zip) return;

  const kmlEntry = Object.keys(zip.files).find((name) =>
    name.toLowerCase().endsWith(".kml")
  );

  if (!kmlEntry) return;

  zip.file(kmlEntry, kml);

  const kmzBlob = await zip.generateAsync({
    type: "blob",
  });

  save(kmzBlob, `${fileName}.kmz`);
}

function save(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = fileName;

  document.body.appendChild(a);

  a.click();

  a.remove();

  URL.revokeObjectURL(url);
}