import JSZip from "jszip";

export async function downloadFile(
  cleanedXml: string,
  fileName: string,
  fileType: "kml" | "kmz",
  zip?: JSZip
) {

  // =====================
  // Download KML
  // =====================

  if (fileType === "kml") {

    const blob = new Blob(
      [cleanedXml],
      {
        type: "application/vnd.google-earth.kml+xml",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      fileName.replace(
        /\.kml$/i,
        ""
      ) + "_cleaned.kml";

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    return;

  }

  // =====================
  // Download KMZ
  // =====================

  if (
    fileType === "kmz" &&
    zip
  ) {

    const kmlName =
      Object.keys(zip.files)
        .find((name) =>
          name
            .toLowerCase()
            .endsWith(".kml")
        );

    if (!kmlName) {

      alert(
        "File KML tidak ditemukan di dalam KMZ."
      );

      return;

    }

    zip.file(
      kmlName,
      cleanedXml
    );

    const blob =
      await zip.generateAsync({
        type: "blob",
      });

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      fileName.replace(
        /\.kmz$/i,
        ""
      ) + "_cleaned.kmz";

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);

  }

}