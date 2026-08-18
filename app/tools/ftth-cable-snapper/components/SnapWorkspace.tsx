"use client";

import { useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import "leaflet/dist/leaflet.css";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileArchive,
  Info,
  RotateCcw,
  Rocket,
  SlidersHorizontal,
  UploadCloud,
} from "lucide-react";

type StatusType = "info" | "success" | "error";

type Status = {
  type: StatusType;
  text: string;
};

type Coordinate = {
  lat: number;
  lng: number;
  alt: number;
  _added?: boolean;
};

type Pole = {
  id: string;
  lat: number;
  lng: number;
  alt: number;
};

type LineData = {
  name: string;
  coordinates: Coordinate[];
  placemark?: Element;
};

type ProcessedLine = LineData & {
  original: Coordinate[];
};

type ExtractedData = {
  poles: Pole[];
  lines: LineData[];
};

type ProcessResult = {
  processed: ProcessedLine[];
  totalSnapped: number;
  totalAdded: number;
  totalRemoved: number;
};

function getElementsByLocalName(
  root: Document | Element,
  name: string,
): Element[] {
  const namespaced = Array.from(root.getElementsByTagNameNS("*", name));

  if (namespaced.length > 0) {
    return namespaced;
  }

  return Array.from(root.getElementsByTagName(name));
}

function getElementText(root: Document | Element, name: string) {
  return getElementsByLocalName(root, name)[0]?.textContent?.trim() ?? "";
}

function getFolderName(folder: Element) {
  return getElementText(folder, "name");
}

function hasPoleFolderAncestor(placemark: Element) {
  let parent = placemark.parentElement;

  while (parent) {
    if (
      parent.localName === "Folder" &&
      getFolderName(parent).toUpperCase() === "POLE"
    ) {
      return true;
    }

    parent = parent.parentElement;
  }

  return false;
}

function getPointCoords(placemark: Element): Coordinate | null {
  const point = getElementsByLocalName(placemark, "Point")[0];
  const coordinates = point
    ? getElementsByLocalName(point, "coordinates")[0]
    : undefined;

  if (!coordinates?.textContent) {
    return null;
  }

  const parts = coordinates.textContent.trim().split(",").map(Number);

  if (!Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) {
    return null;
  }

  return {
    lng: parts[0],
    lat: parts[1],
    alt: Number.isFinite(parts[2]) ? parts[2] : 0,
  };
}

function getLineStringCoords(placemark: Element): Coordinate[] | null {
  const lineString = getElementsByLocalName(placemark, "LineString")[0];
  const coordinates = lineString
    ? getElementsByLocalName(lineString, "coordinates")[0]
    : undefined;

  if (!coordinates?.textContent) {
    return null;
  }

  const points = coordinates.textContent
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((point) => {
      const parts = point.split(",").map(Number);

      return {
        lng: parts[0],
        lat: parts[1],
        alt: Number.isFinite(parts[2]) ? parts[2] : 0,
      };
    })
    .filter(
      (point) =>
        Number.isFinite(point.lat) && Number.isFinite(point.lng),
    );

  return points.length > 0 ? points : null;
}

function extractPolesAndLines(doc: Document): ExtractedData {
  const poles: Pole[] = [];
  const lines: LineData[] = [];
  const placemarks = getElementsByLocalName(doc, "Placemark");

  for (const placemark of placemarks) {
    const inPoleFolder = hasPoleFolderAncestor(placemark);
    const point = getPointCoords(placemark);
    const lineString = getLineStringCoords(placemark);
    const name = getElementText(placemark, "name");

    if (inPoleFolder && point) {
      poles.push({
        id: name || `pole-${poles.length + 1}`,
        ...point,
      });
      continue;
    }

    if (!inPoleFolder && lineString) {
      lines.push({
        name: name || "LineString",
        coordinates: lineString,
        placemark,
      });
    }
  }

  return { poles, lines };
}

function setLineStringCoords(
  placemark: Element,
  coordinates: Coordinate[],
) {
  const lineString = getElementsByLocalName(placemark, "LineString")[0];
  const coordinateElement = lineString
    ? getElementsByLocalName(lineString, "coordinates")[0]
    : undefined;

  if (!coordinateElement) {
    return;
  }

  coordinateElement.textContent = ` ${coordinates
    .map((coordinate) =>
      `${coordinate.lng},${coordinate.lat},${coordinate.alt || 0}`,
    )
    .join(" ")} `;
}

function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const earthRadius = 6_371_000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLng / 2) ** 2;

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function projectPointToSegment(
  pointLat: number,
  pointLng: number,
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
) {
  const averageLatitude = ((startLat + endLat + pointLat) / 3) * (Math.PI / 180);
  const scaleX = Math.cos(averageLatitude);
  const point = { x: pointLng * scaleX, y: pointLat };
  const start = { x: startLng * scaleX, y: startLat };
  const end = { x: endLng * scaleX, y: endLat };
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  let ratio = 0;

  if (lengthSquared > 0) {
    ratio =
      ((point.x - start.x) * dx + (point.y - start.y) * dy) /
      lengthSquared;
    ratio = Math.max(0, Math.min(1, ratio));
  }

  const projectedLat = startLat + (endLat - startLat) * ratio;
  const projectedLng = startLng + (endLng - startLng) * ratio;

  return {
    lat: projectedLat,
    lng: projectedLng,
    dist: haversine(pointLat, pointLng, projectedLat, projectedLng),
    ratio,
  };
}

function processSnapping(
  lines: LineData[],
  poles: Pole[],
  threshold: number,
): ProcessResult {
  let totalSnapped = 0;
  let totalAdded = 0;
  let totalRemoved = 0;
  const processed: ProcessedLine[] = [];

  for (const line of lines) {
    const originalCoordinates = line.coordinates;
    const snappedCoordinates: Array<Coordinate | null> = [];

    for (const originalCoordinate of originalCoordinates) {
      let nearest: Pole | null = null;
      let minimumDistance = Infinity;

      for (const pole of poles) {
        const distance = haversine(
          originalCoordinate.lat,
          originalCoordinate.lng,
          pole.lat,
          pole.lng,
        );

        if (distance < minimumDistance) {
          minimumDistance = distance;
          nearest = pole;
        }
      }

      if (nearest && minimumDistance < threshold) {
        snappedCoordinates.push({
          lat: nearest.lat,
          lng: nearest.lng,
          alt: nearest.alt || 0,
          _added: false,
        });
        totalSnapped += 1;
      } else {
        snappedCoordinates.push(null);
        totalRemoved += 1;
      }
    }

    const insertedBySegment = originalCoordinates
      .slice(0, -1)
      .map((start, index) => {
        const end = originalCoordinates[index + 1];
        const candidates: Array<{ pole: Pole; ratio: number }> = [];

        for (const pole of poles) {
          const projection = projectPointToSegment(
            pole.lat,
            pole.lng,
            start.lat,
            start.lng,
            end.lat,
            end.lng,
          );

          if (
            projection.dist < threshold &&
            projection.ratio > 0 &&
            projection.ratio < 1
          ) {
            candidates.push({ pole, ratio: projection.ratio });
          }
        }

        return candidates.sort((a, b) => a.ratio - b.ratio);
      });

    const coordinates: Coordinate[] = [];

    for (let index = 0; index < originalCoordinates.length; index += 1) {
      const snapped = snappedCoordinates[index];

      if (snapped) {
        const previous = coordinates[coordinates.length - 1];
        const isDuplicate =
          previous && haversine(previous.lat, previous.lng, snapped.lat, snapped.lng) <= 0.5;

        if (!isDuplicate) {
          coordinates.push(snapped);
        }
      }

      for (const candidate of insertedBySegment[index] ?? []) {
        const isDuplicate = coordinates.some(
          (coordinate) =>
            haversine(
              coordinate.lat,
              coordinate.lng,
              candidate.pole.lat,
              candidate.pole.lng,
            ) <= 0.5,
        );

        if (!isDuplicate) {
          coordinates.push({
            lat: candidate.pole.lat,
            lng: candidate.pole.lng,
            alt: candidate.pole.alt || 0,
            _added: true,
          });
          totalAdded += 1;
        }
      }
    }

    processed.push({
      name: line.name,
      coordinates,
      placemark: line.placemark,
      original: originalCoordinates.map((coordinate) => ({ ...coordinate })),
    });
  }

  return { processed, totalSnapped, totalAdded, totalRemoved };
}

function getBaseName(fileName: string) {
  return fileName.replace(/\.(kml|kmz)$/i, "");
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  return `${(size / 1024).toFixed(1)} KB`;
}

type SnapMapProps = {
  poles: Pole[];
  lines: LineData[];
  processedLines: ProcessedLine[];
};

function SnapMap({ poles, lines, processedLines }: SnapMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const layerGroupRef = useRef<import("leaflet").LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let active = true;

    void import("leaflet").then((leaflet) => {
      if (!active || !mapContainerRef.current || mapRef.current) {
        return;
      }

      const map = leaflet
        .map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: true,
        })
        .setView([0, 0], 2);

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 20,
          attribution: "&copy; OpenStreetMap contributors",
        })
        .addTo(map);

      mapRef.current = map;
      leafletRef.current = leaflet;
      layerGroupRef.current = leaflet.layerGroup().addTo(map);
      setMapReady(true);

      window.setTimeout(() => map.invalidateSize(), 100);
    });

    return () => {
      active = false;
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;

    if (!mapReady || !leaflet || !map || !layerGroup) {
      return;
    }

    layerGroup.clearLayers();

    const allCoordinates = [
      ...poles,
      ...lines.flatMap((line) => line.coordinates),
      ...processedLines.flatMap((line) => line.coordinates),
    ];

    if (allCoordinates.length === 0) {
      map.setView([0, 0], 2);
      return;
    }

    for (const line of lines) {
      if (line.coordinates.length < 2) {
        continue;
      }

      leaflet
        .polyline(
          line.coordinates.map((coordinate) => [
            coordinate.lat,
            coordinate.lng,
          ] as [number, number]),
          {
            color: "#9a9b9f",
            weight: 3,
            opacity: 0.9,
            dashArray: "7 6",
          },
        )
        .bindTooltip(`Original: ${line.name}`)
        .addTo(layerGroup);
    }

    for (const line of processedLines) {
      if (line.coordinates.length < 2) {
        continue;
      }

      leaflet
        .polyline(
          line.coordinates.map((coordinate) => [
            coordinate.lat,
            coordinate.lng,
          ] as [number, number]),
          {
            color: "#4b83c4",
            weight: 4,
            opacity: 0.95,
          },
        )
        .bindTooltip(`Hasil: ${line.name}`)
        .addTo(layerGroup);
    }

    for (const pole of poles) {
      leaflet
        .circleMarker([pole.lat, pole.lng], {
          radius: 6,
          color: "#3f4043",
          weight: 1.5,
          fillColor: "#68696d",
          fillOpacity: 1,
        })
        .bindTooltip(pole.id)
        .addTo(layerGroup);
    }

    for (const line of processedLines) {
      for (const coordinate of line.coordinates) {
        if (!coordinate._added) {
          continue;
        }

        leaflet
          .circleMarker([coordinate.lat, coordinate.lng], {
            radius: 5,
            color: "#68696d",
            weight: 1.5,
            fillColor: "#d95c5c",
            fillOpacity: 1,
          })
          .bindTooltip("Vertex baru")
          .addTo(layerGroup);
      }
    }

    const bounds = leaflet.latLngBounds(
      allCoordinates.map(
        (coordinate) => [coordinate.lat, coordinate.lng] as [number, number],
      ),
    );

    map.fitBounds(bounds.pad(0.15), {
      maxZoom: 18,
      animate: false,
    });
  }, [mapReady, lines, poles, processedLines]);

  return (
    <div className="relative h-[520px] w-full overflow-hidden rounded-[1.5rem] bg-[#dedfe1] lg:h-auto lg:flex-1">
      <div ref={mapContainerRef} className="h-full w-full" />
      {poles.length === 0 && lines.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-[#dedfe1]/90 px-4 py-2 text-xs text-[#77787c] shadow-[5px_5px_10px_#bfc0c3,-5px_-5px_10px_#f7f7f8]">
            Upload KML/KMZ untuk menampilkan map
          </div>
        </div>
      )}
    </div>
  );
}

export default function SnapWorkspace() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [rawKml, setRawKml] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [fileType, setFileType] = useState("");
  const [kmlPath, setKmlPath] = useState("");
  const [sourceZip, setSourceZip] = useState<JSZip | null>(null);
  const [originalDoc, setOriginalDoc] = useState<Document | null>(null);
  const [modifiedDoc, setModifiedDoc] = useState<Document | null>(null);
  const [poles, setPoles] = useState<Pole[]>([]);
  const [lines, setLines] = useState<LineData[]>([]);
  const [processedLines, setProcessedLines] = useState<ProcessedLine[]>([]);
  const [snappedCount, setSnappedCount] = useState(0);
  const [addedCount, setAddedCount] = useState(0);
  const [removedCount, setRemovedCount] = useState(0);
  const [threshold, setThreshold] = useState(15);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<Status>({
    type: "info",
    text: "Upload file KML/KMZ. Pastikan folder POLE tersedia.",
  });

  function showStatus(type: StatusType, text: string) {
    setStatus({ type, text });
  }

  async function loadFile(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension !== "kml" && extension !== "kmz") {
      showStatus("error", "Upload file dengan format KML atau KMZ.");
      return;
    }

    try {
      let xml = "";
      let loadedZip: JSZip | null = null;
      let loadedKmlPath = "";

      if (extension === "kmz") {
        loadedZip = await JSZip.loadAsync(file);
        const kmlFiles = loadedZip.filter((path) =>
          path.toLowerCase().endsWith(".kml"),
        );

        if (kmlFiles.length === 0) {
          showStatus("error", "Tidak ada file KML di dalam KMZ.");
          return;
        }

        loadedKmlPath = kmlFiles[0].name;
        const kmlFile = loadedZip.file(loadedKmlPath);

        if (!kmlFile) {
          showStatus("error", "File KML di dalam KMZ tidak dapat dibaca.");
          return;
        }

        xml = await kmlFile.async("string");
      } else {
        xml = await file.text();
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, "application/xml");
      const parserError = doc.querySelector("parsererror");

      if (parserError) {
        showStatus("error", "File tidak berisi XML/KML yang valid.");
        return;
      }

      const extracted = extractPolesAndLines(doc);

      setRawKml(xml);
      setFileName(file.name);
      setFileSize(formatFileSize(file.size));
      setFileType(extension.toUpperCase());
      setKmlPath(loadedKmlPath);
      setSourceZip(loadedZip);
      setOriginalDoc(doc);
      setModifiedDoc(null);
      setPoles(extracted.poles);
      setLines(extracted.lines);
      setProcessedLines(
        extracted.lines.map((line) => ({
          ...line,
          coordinates: line.coordinates.map((coordinate) => ({ ...coordinate })),
          original: line.coordinates.map((coordinate) => ({ ...coordinate })),
        })),
      );
      setSnappedCount(0);
      setAddedCount(0);
      setRemovedCount(0);
      showStatus(
        "success",
        `File ${file.name} berhasil dimuat. ${extracted.poles.length} pole dan ${extracted.lines.length} LineString ditemukan.`,
      );
    } catch (error) {
      console.error(error);
      showStatus("error", "Gagal membaca file KML/KMZ.");
    }
  }

  function handleProcess() {
    if (!rawKml || !originalDoc) {
      showStatus("error", "Tidak ada file KML/KMZ yang dimuat.");
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawKml, "application/xml");
      const extracted = extractPolesAndLines(doc);

      if (extracted.poles.length === 0) {
        showStatus("error", "Folder POLE tidak ditemukan atau tidak berisi Point.");
        return;
      }

      if (extracted.lines.length === 0) {
        showStatus("error", "Tidak ada LineString di luar folder POLE.");
        return;
      }

      showStatus(
        "info",
        `Memproses ${extracted.lines.length} LineString dengan ${extracted.poles.length} pole...`,
      );

      const result = processSnapping(
        extracted.lines,
        extracted.poles,
        threshold,
      );

      const validProcessedLines = result.processed.filter(
        (line) => line.coordinates.length >= 2,
      );

      for (const line of result.processed) {
        if (!line.placemark) {
          continue;
        }

        if (line.coordinates.length >= 2) {
          setLineStringCoords(line.placemark, line.coordinates);
        } else {
          line.placemark.parentNode?.removeChild(line.placemark);
        }
      }

      setOriginalDoc(doc);
      setModifiedDoc(doc);
      setPoles(extracted.poles);
      setLines(extracted.lines);
      setProcessedLines(validProcessedLines);
      setSnappedCount(result.totalSnapped);
      setAddedCount(result.totalAdded);
      setRemovedCount(result.totalRemoved);
      showStatus(
        "success",
        `Selesai. ${result.totalSnapped} vertex tersnap, ${result.totalAdded} vertex baru ditambahkan, dan ${result.totalRemoved} vertex dihapus.`,
      );
    } catch (error) {
      console.error(error);
      showStatus("error", "Terjadi kesalahan saat memproses snapping.");
    }
  }

  async function handleDownload() {
    if (!modifiedDoc) {
      showStatus("error", "Proses data terlebih dahulu sebelum download.");
      return;
    }

    try {
      const serializer = new XMLSerializer();
      let xml = serializer.serializeToString(modifiedDoc);

      if (!xml.startsWith("<?xml")) {
        xml = `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
      }

      xml = xml.replace(/>\s+</g, "><");

      const outputZip = sourceZip ?? new JSZip();
      const outputKmlPath = kmlPath || `${getBaseName(fileName)}.kml`;
      outputZip.file(outputKmlPath, xml);

      const blob = await outputZip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const outputName = `${getBaseName(fileName)}_snap.kmz`;

      anchor.href = url;
      anchor.download = outputName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      showStatus("success", `Download ${outputName} berhasil dibuat.`);
    } catch (error) {
      console.error(error);
      showStatus("error", "Gagal membuat file KMZ.");
    }
  }

  function handleReset() {
    setRawKml("");
    setFileName("");
    setFileSize("");
    setFileType("");
    setKmlPath("");
    setSourceZip(null);
    setOriginalDoc(null);
    setModifiedDoc(null);
    setPoles([]);
    setLines([]);
    setProcessedLines([]);
    setSnappedCount(0);
    setAddedCount(0);
    setRemovedCount(0);
    setThreshold(15);
    setIsDragging(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    showStatus("info", "Data direset. Upload file KML/KMZ untuk memulai.");
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];

    if (file) {
      void loadFile(file);
    }
  }

  const statusStyles = {
    info: "text-[#68696d]",
    success: "text-[#4b7d5c]",
    error: "text-[#8b5c5c]",
  };

  const StatusIcon =
    status.type === "success"
      ? CheckCircle2
      : status.type === "error"
        ? AlertCircle
        : Info;

  return (
    <section className="mt-4 grid gap-6 lg:grid-cols-[330px_minmax(0,1fr)] lg:items-stretch">
      <div className="space-y-5">
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              fileInputRef.current?.click();
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (event.currentTarget === event.target) {
              setIsDragging(false);
            }
          }}
          onDrop={handleDrop}
          className={`rounded-[2rem] bg-[#dedfe1] p-5 shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8] outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-[#68696d]/30 ${isDragging ? "scale-[1.01]" : ""}`}
        >
          <div className="flex min-h-60 flex-col items-center justify-center gap-5 rounded-[1.5rem] bg-[#dedfe1] p-6 text-center shadow-[inset_6px_6px_12px_#bfc0c3,inset_-6px_-6px_12px_#f7f7f8]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#dedfe1] text-[#68696d] shadow-[6px_6px_12px_#bfc0c3,-6px_-6px_12px_#f7f7f8]">
              <UploadCloud size={32} strokeWidth={1.6} />
            </div>

            <div>
              <h2 className="text-lg font-semibold tracking-[-0.04em] text-[#3f4043]">
                Upload KMZ / KML
              </h2>
              <p className="mt-2 text-xs leading-5 text-[#77787c]">
                Drag &amp; drop atau klik untuk upload
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".kml,.kmz"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void loadFile(file);
              }
              event.target.value = "";
            }}
          />
        </div>

        {fileName && (
          <div className="flex items-center gap-3 rounded-2xl bg-[#dedfe1] px-4 py-3 text-xs text-[#68696d] shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8]">
            <FileArchive size={17} strokeWidth={1.7} />
            <span className="min-w-0 flex-1 truncate">{fileName}</span>
            <span className="rounded-full bg-[#dedfe1] px-2.5 py-1 text-[10px] font-semibold shadow-[3px_3px_6px_#bfc0c3,-3px_-3px_6px_#f7f7f8]">
              {fileType}
            </span>
            <span className="hidden text-[#a4a5a8] sm:inline">{fileSize}</span>
          </div>
        )}

        <div className="rounded-[2rem] bg-[#dedfe1] p-5 shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8]">
          <div className="mb-5 flex items-center gap-2 text-[#3f4043]">
            <SlidersHorizontal size={18} strokeWidth={1.7} />
            <h2 className="text-base font-semibold">Snap parameter</h2>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="block text-sm font-medium text-[#3f4043]">
                Snap Radius
              </span>
              <input
                type="range"
                min="0.5"
                max="50"
                step="0.5"
                value={threshold}
                onChange={(event) => setThreshold(Number(event.target.value))}
                className="mt-3 w-full accent-[#68696d]"
              />
              <span className="mt-1 block text-sm font-semibold text-[#68696d]">
                {threshold} m
              </span>
            </label>

          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleProcess}
              disabled={!rawKml}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#dedfe1] px-3 text-sm font-semibold text-[#3f4043] shadow-[6px_6px_12px_#bfc0c3,-6px_-6px_12px_#f7f7f8] transition duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Rocket size={17} strokeWidth={1.8} />
              Process
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={!modifiedDoc}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#dedfe1] px-3 text-sm font-semibold text-[#4b7d5c] shadow-[6px_6px_12px_#bfc0c3,-6px_-6px_12px_#f7f7f8] transition duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={17} strokeWidth={1.8} />
              Download
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#dedfe1] px-4 text-sm font-semibold text-[#68696d] shadow-[6px_6px_12px_#bfc0c3,-6px_-6px_12px_#f7f7f8] transition duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <RotateCcw size={17} strokeWidth={1.8} />
            Reset
          </button>
        </div>

        <div className={`flex items-start gap-2 rounded-2xl bg-[#dedfe1] px-4 py-3 text-xs leading-5 shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8] ${statusStyles[status.type]}`}>
          <StatusIcon size={16} className="mt-0.5 shrink-0" strokeWidth={1.8} />
          <span>{status.text}</span>
        </div>
      </div>

      <div className="flex h-full flex-col rounded-[2rem] bg-[#dedfe1] p-4 shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8] sm:p-5">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] bg-[#dedfe1] shadow-[inset_6px_6px_12px_#bfc0c3,inset_-6px_-6px_12px_#f7f7f8]">
          <SnapMap
            poles={poles}
            lines={lines}
            processedLines={processedLines}
          />

          <div className="flex flex-col gap-4 border-t border-[#bfc0c3]/40 px-4 py-4 text-xs text-[#77787c] sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <span>
                Pole: <strong className="text-[#3f4043]">{poles.length}</strong>
              </span>
              <span>
                LineString: <strong className="text-[#3f4043]">{lines.length}</strong>
              </span>
              <span>
                Snapped: <strong className="text-[#3f4043]">{snappedCount}</strong>
              </span>
              <span>
                Added: <strong className="text-[#3f4043]">{addedCount}</strong>
              </span>
              <span>
                Removed: <strong className="text-[#3f4043]">{removedCount}</strong>
              </span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#68696d]" />
                Pole
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-5 border-t border-dashed border-[#9a9b9f]" />
                Original
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-5 bg-[#4b83c4]" />
                Hasil
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#d95c5c]" />
                Vertex baru
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
