export type CableLine = {
  group: string;
  category: string;
  name: string;
  length: number;
};

export type CableResult = {
  title: string;
  lines: CableLine[];
  totalLength: number;
};

function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;

  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

function calculateLength(coords: string) {
  const points = coords
    .trim()
    .split(/\s+/)
    .map((p) => {
      const [lon, lat] = p.split(",").map(Number);

      return {
        lat,
        lon,
      };
    });

  let total = 0;

  for (let i = 1; i < points.length; i++) {
    total += getDistance(
      points[i - 1].lat,
      points[i - 1].lon,
      points[i].lat,
      points[i].lon
    );
  }

  return Math.round(total);
}

export function parseKML(
  xml: string,
  fallbackTitle: string
): CableResult {

  const parser = new DOMParser();

  const doc = parser.parseFromString(
    xml,
    "text/xml"
  );

  const title =
    doc.querySelector("Document > name")
      ?.textContent
      ?.trim() ||
    fallbackTitle;

  const lines: CableLine[] = [];

  const placemarks = Array.from(
    doc.getElementsByTagName("Placemark")
  );

  placemarks.forEach((placemark) => {

    const line =
      placemark.getElementsByTagName(
        "LineString"
      )[0];

    if (!line) return;

    const name =
      placemark.querySelector(":scope > name")
        ?.textContent
        ?.trim() ||
      "Unknown";

    const coordinates =
      line.getElementsByTagName(
        "coordinates"
      )[0]
        ?.textContent || "";

    const length =
      calculateLength(coordinates);

    //--------------------------------------------------
    // GROUP & CATEGORY
    //--------------------------------------------------

    let parent = placemark.parentElement;

    const folders: string[] = [];

    while (parent) {

      if (parent.tagName === "Folder") {

        const folderName =
          parent.querySelector(":scope > name")
            ?.textContent
            ?.trim();

        if (folderName) {
          // urutan dari bawah
          folders.push(folderName);
        }
      }

      parent = parent.parentElement;
    }

    const category =
      folders[0] ?? "-";

    const group =
      folders[1] ?? "-";

    lines.push({
      group,
      category,
      name,
      length,
    });

  });

  return {
    title,
    lines,
    totalLength: lines.reduce(
      (sum, item) => sum + item.length,
      0
    ),
  };
}