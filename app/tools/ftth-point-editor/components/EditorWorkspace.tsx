"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import JSZip from "jszip";
import "leaflet/dist/leaflet.css";

type Placemark = {
  name: string;
  lat: number;
  lon: number;
  coord: string;
  folder: string;
  kmlPath: string;
};

type KmlContents = Record<string, string>;
type OtherFiles = Record<string, Blob>;

const KML_NAMESPACE = "http://www.opengis.net/kml/2.2";

function escapeHtml(value: string ) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function extractPlacemarks(kmlText: string, kmlPath: string) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(kmlText, "text/xml");
  const parserError = xml.getElementsByTagName("parsererror")[0];

  if (parserError) {
    throw new Error(`Format KML tidak valid pada ${kmlPath}.`);
  }

  const placemarkElements = Array.from(
    xml.getElementsByTagNameNS(KML_NAMESPACE, "Placemark"),
  );

  const placemarks: Placemark[] = [];

  for (const placemark of placemarkElements) {
    const point = placemark.getElementsByTagNameNS(KML_NAMESPACE, "Point")[0];
    const coordinates = point?.getElementsByTagNameNS(
      KML_NAMESPACE,
      "coordinates",
    )[0];

    if (!point || !coordinates) continue;

    const coord = coordinates.textContent?.trim() || "";
    const parts = coord.split(",").map((part) => part.trim());
    const lon = Number.parseFloat(parts[0]);
    const lat = Number.parseFloat(parts[1]);

    if (!coord || Number.isNaN(lat) || Number.isNaN(lon)) continue;

    const nameElement = placemark.getElementsByTagNameNS(
      KML_NAMESPACE,
      "name",
    )[0];

    let folder = "";
    let parent: Node | null = placemark.parentNode;

    while (parent) {
      if (parent.nodeType === Node.ELEMENT_NODE) {
        const element = parent as Element;

        if (element.localName === "Folder") {
          const folderName = element.getElementsByTagNameNS(
            KML_NAMESPACE,
            "name",
          )[0];

          folder = folderName?.textContent?.trim() || "";
          break;
        }
      }

      parent = parent.parentNode;
    }

    placemarks.push({
      name: nameElement?.textContent?.trim() || "",
      lat,
      lon,
      coord,
      folder,
      kmlPath,
    });
  }

  return placemarks;
}

export default function EditorWorkspace() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersLayerRef = useRef<LayerGroup | null>(null);
  const fitBoundsNextRef = useRef(true);

  const [allPlacemarks, setAllPlacemarks] = useState<Placemark[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [currentItems, setCurrentItems] = useState<Placemark[]>([]);
  const [currentNames, setCurrentNames] = useState<string[]>([]);
  const [assignedOrder, setAssignedOrder] = useState<number[]>([]);
  const [sourceKmlContents, setSourceKmlContents] = useState<KmlContents>({});
  const [otherFiles, setOtherFiles] = useState<OtherFiles>({});
  const [originalFileName, setOriginalFileName] = useState("");
  const [status, setStatus] = useState("");
  const [isClickMode, setIsClickMode] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [nextNumber, setNextNumber] = useState(1);
  const [mapReady, setMapReady] = useState(false);

  const [prefix, setPrefix] = useState("FDT-");
  const [startNumber, setStartNumber] = useState("1");
  const [suffix, setSuffix] = useState("A");
  const [padding, setPadding] = useState("");

  const folderNames = useMemo(() => {
    return Array.from(
      new Set(allPlacemarks.map((placemark) => placemark.folder).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [allPlacemarks]);

  const paddingLength =
    Number.parseInt(padding, 10) || String(currentItems.length || 1).length;

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      const leaflet = await import("leaflet");

      if (cancelled || !mapContainerRef.current || mapRef.current) return;

      leafletRef.current = leaflet;

      const map = leaflet
        .map(mapContainerRef.current, { zoomControl: true })
        .setView([-7.426, 109.234], 16);

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        } )
        .addTo(map);

      const markersLayer = leaflet.layerGroup().addTo(map);

      mapRef.current = map;
      markersLayerRef.current = markersLayer;
      setMapReady(true);
    }

    void initializeMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;

    if (!mapReady || !leaflet || !map || !markersLayer) return;

    markersLayer.clearLayers();

    if (!currentItems.length) return;

    const bounds: [number, number][] = [];

    currentItems.forEach((item, index) => {
      const assignedIndex = assignedOrder.indexOf(index);
      const isAssigned = assignedIndex !== -1;
      const markerNumber = isAssigned ? assignedIndex + 1 : index + 1;
      const markerColor = isAssigned ? "#4fa66d" : "#9a9b9f";
      const displayName = currentNames[index] || item.name;
      const markerGlow = isAssigned
        ? "0 0 0 4px rgba(79,166,109,0.24),4px 4px 10px #bfc0c3,-3px -3px 7px #f7f7f8"
        : "3px 3px 7px #bfc0c3,-2px -2px 5px #f7f7f8";

      const icon = leaflet.divIcon({
        className: "ftth-point-marker",
        html: `<div style="background:${markerColor};color:#ffffff;border-radius:999px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;border:2px solid #f7f7f8;box-shadow:${markerGlow};">${markerNumber}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = leaflet
        .marker([item.lat, item.lon], { icon })
        .bindTooltip(
          `<strong>${escapeHtml(displayName)}</strong>  
${escapeHtml(item.folder)}  
${item.lat.toFixed(5)}, ${item.lon.toFixed(5)}`,
          { direction: "top" },
        );

      marker.on("click", () => {
        if (!isClickMode) return;

        const currentAssignedIndex = assignedOrder.indexOf(index);

        if (currentAssignedIndex !== -1) {
          const nextAssignedOrder = assignedOrder.filter(
            (assignedIndex) => assignedIndex !== index,
          );

          setAssignedOrder(nextAssignedOrder);
          setCurrentNames((previousNames) =>
            previousNames.map((name, nameIndex) =>
              nameIndex === index ? currentItems[index].name : name,
            ),
          );
          setNextNumber((previousNumber) =>
            Math.max(Number.parseInt(startNumber, 10) || 1, previousNumber - 1),
          );

          if (!nextAssignedOrder.length) {
            setIsProcessed(false);
            setStatus("Mode Klik: 0 titik diurutkan.");
          } else {
            setStatus(
              `Mode Klik: ${nextAssignedOrder.length} dari ${currentItems.length} titik sudah diberi nomor.`,
            );
          }

          return;
        }

        const newName = `${prefix}${String(nextNumber).padStart(paddingLength, "0")}${suffix}`;
        const nextAssignedOrder = [...assignedOrder, index];

        setAssignedOrder(nextAssignedOrder);
        setCurrentNames((previousNames) =>
          previousNames.map((name, nameIndex) =>
            nameIndex === index ? newName : name,
          ),
        );
        setNextNumber(nextNumber + 1);
        setStatus(
          `Mode Klik: ${nextAssignedOrder.length} dari ${currentItems.length} titik sudah diberi nomor.`,
        );
      });

      markersLayer.addLayer(marker);
      bounds.push([item.lat, item.lon]);
    });

    if (fitBoundsNextRef.current && bounds.length) {
      map.fitBounds(bounds, { padding: [30, 30] });
      fitBoundsNextRef.current = false;
    }
  }, [
    assignedOrder,
    currentItems,
    currentNames,
    isClickMode,
    mapReady,
    nextNumber,
    paddingLength,
    prefix,
    startNumber,
    suffix,
  ]);

  async function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    if (!file) return;

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    await handleUpload({
      target: { files: dataTransfer.files },
    } as ChangeEvent<HTMLInputElement>);
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setStatus("Membaca file...");

      const baseName = file.name.replace(/\.[^.]+$/, "");
      const kmlContents: KmlContents = {};
      const extractedOtherFiles: OtherFiles = {};
      let placemarks: Placemark[] = [];

      if (file.name.toLowerCase().endsWith(".kmz")) {
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const entries = Object.entries(zip.files).filter(
          ([, entry]) => !entry.dir,
        );

        await Promise.all(
          entries.map(async ([path, entry]) => {
            if (path.toLowerCase().endsWith(".kml")) {
              const kmlText = await entry.async("text");
              kmlContents[path] = kmlText;
              extractedOtherFiles[path] = new Blob([kmlText], {
                type: "application/vnd.google-earth.kml+xml",
              });
              placemarks = [
                ...placemarks,
                ...extractPlacemarks(kmlText, path),
              ];
            } else {
              extractedOtherFiles[path] = await entry.async("blob");
            }
          }),
        );

        if (!Object.keys(kmlContents).length) {
          throw new Error("Tidak ditemukan file KML di dalam KMZ.");
        }
      } else if (file.name.toLowerCase().endsWith(".kml")) {
        const kmlText = new TextDecoder("utf-8").decode(
          await file.arrayBuffer(),
        );

        kmlContents["doc.kml"] = kmlText;
        placemarks = extractPlacemarks(kmlText, "doc.kml");
      } else {
        throw new Error("Upload file KML atau KMZ.");
      }

      if (!placemarks.length) {
        throw new Error("Tidak ada Placemark dengan titik.");
      }

      const folders = Array.from(
        new Set(placemarks.map((placemark) => placemark.folder).filter(Boolean)),
      );

      setOriginalFileName(baseName);
      setSourceKmlContents(kmlContents);
      setOtherFiles(extractedOtherFiles);
      setAllPlacemarks(placemarks);
      setSelectedFolders(folders);
      setCurrentItems(placemarks);
      setCurrentNames(placemarks.map((placemark) => placemark.name));
      setAssignedOrder([]);
      setIsClickMode(false);
      setIsProcessed(false);
      setNextNumber(Number.parseInt(startNumber, 10) || 1);
      setStatus(`✅ ${placemarks.length} titik ditemukan.`);
      fitBoundsNextRef.current = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal membaca file.";
      setStatus(`Error: ${message}`);
      alert(message);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleFolderChange(folder: string, checked: boolean) {
    const nextSelectedFolders = new Set(selectedFolders);

    if (checked) {
      nextSelectedFolders.add(folder);
    } else {
      nextSelectedFolders.delete(folder);
    }

    const nextItems = allPlacemarks.filter((placemark) =>
      nextSelectedFolders.has(placemark.folder),
    );

    setSelectedFolders(Array.from(nextSelectedFolders));
    setCurrentItems(nextItems);
    setCurrentNames(nextItems.map((item) => item.name));
    setAssignedOrder([]);
    setIsClickMode(false);
    setIsProcessed(false);
    setNextNumber(Number.parseInt(startNumber, 10) || 1);
    setStatus(`${nextItems.length} titik dipilih.`);
    fitBoundsNextRef.current = true;
  }

  function getRenameValues() {
    const start = Number.parseInt(startNumber, 10) || 1;
    const nextPadding =
      Number.parseInt(padding, 10) || String(currentItems.length || 1).length;

    return {
      start,
      nextPadding,
      nextPrefix: prefix,
      nextSuffix: suffix,
    };
  }

  function handleSort(order: "asc" | "desc") {
    if (!currentItems.length) {
      alert("Pilih folder terlebih dahulu.");
      return;
    }

    if (
      assignedOrder.length > 0 &&
      assignedOrder.length !== currentItems.length
    ) {
      const shouldContinue = window.confirm(
        "Ini akan mereset semua urutan manual. Lanjutkan?",
      );

      if (!shouldContinue) return;
    }

    const { start, nextPadding, nextPrefix, nextSuffix } = getRenameValues();
    const sortedItems = [...currentItems].sort((a, b) => {
      const result = a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return order === "asc" ? result : -result;
    });

    const renamedItems = sortedItems.map((_, index) => {
      return `${nextPrefix}${String(start + index).padStart(nextPadding, "0")}${nextSuffix}`;
    });

    setCurrentItems(sortedItems);
    setCurrentNames(renamedItems);
    setAssignedOrder(sortedItems.map((_, index) => index));
    setNextNumber(start + sortedItems.length);
    setIsClickMode(false);
    setIsProcessed(true);
    setStatus(
      `✅ ${sortedItems.length} titik diurutkan dan di-rename. Siap download.`,
    );
    fitBoundsNextRef.current = true;
  }

  function handleManualMode() {
    if (!currentItems.length) {
      alert("Pilih folder terlebih dahulu.");
      return;
    }

    if (isClickMode) {
      setIsClickMode(false);

      if (assignedOrder.length > 0) {
        setIsProcessed(true);
        setStatus(`✅ ${assignedOrder.length} titik diurutkan. Siap download.`);
      } else {
        setIsProcessed(false);
        setStatus("Mode Klik dihentikan.");
      }

      return;
    }

    if (assignedOrder.length > 0) {
      const shouldContinue = window.confirm(
        "Anda sudah mengurutkan beberapa titik. Lanjutkan?",
      );

      if (!shouldContinue) return;
    }

    if (!assignedOrder.length) {
      setNextNumber(Number.parseInt(startNumber, 10) || 1);
    }

    setIsClickMode(true);
    setIsProcessed(false);
    setStatus(
      `Mode Klik: ${assignedOrder.length} dari ${currentItems.length} titik sudah diberi nomor.`,
    );
  }

  async function handleDownload() {
    if (!isProcessed && assignedOrder.length === 0) {
      alert("Belum ada titik yang diurutkan.");
      return;
    }

    try {
      const { start, nextPadding, nextPrefix, nextSuffix } = getRenameValues();
      const zip = new JSZip();
      const assignedSet = new Set(assignedOrder);

      for (const [path, kmlText] of Object.entries(sourceKmlContents)) {
        const parser = new DOMParser();
        const xml = parser.parseFromString(kmlText, "text/xml");
        const folders = Array.from(
          xml.getElementsByTagNameNS(KML_NAMESPACE, "Folder"),
        );

        for (const folder of folders) {
          const folderNameElement = folder.getElementsByTagNameNS(
            KML_NAMESPACE,
            "name",
          )[0];
          const folderName = folderNameElement?.textContent?.trim() || "";

          if (!selectedFolders.includes(folderName)) continue;

          const placemarkElements = Array.from(folder.children).filter(
            (child) => child.localName === "Placemark",
          );

          const matches: Array<{ element: Element; item: Placemark }> = [];

          for (const element of placemarkElements) {
            const point = element.getElementsByTagNameNS(
              KML_NAMESPACE,
              "Point",
            )[0];
            const coordinates = point?.getElementsByTagNameNS(
              KML_NAMESPACE,
              "coordinates",
            )[0];
            const coord = coordinates?.textContent?.trim() || "";
            const item = currentItems.find(
              (currentItem) =>
                currentItem.coord === coord &&
                currentItem.folder === folderName &&
                currentItem.kmlPath === path,
            );

            if (item) {
              matches.push({ element, item });
            }
          }

          if (!matches.length) continue;

          const assignedMatches = assignedOrder
            .map((itemIndex) => {
              const item = currentItems[itemIndex];
              return matches.find((match) => match.item === item);
            })
            .filter(
              (match): match is { element: Element; item: Placemark } =>
                Boolean(match),
            );

          const unassignedMatches = matches
            .filter((match) => {
              const itemIndex = currentItems.indexOf(match.item);
              return !assignedSet.has(itemIndex);
            })
            .sort((a, b) => {
              return currentItems.indexOf(a.item) - currentItems.indexOf(b.item);
            });

          matches.forEach(({ element }) => {
            element.parentNode?.removeChild(element);
          });

          const orderedMatches = [...assignedMatches, ...unassignedMatches];

          orderedMatches.forEach(({ element, item }) => {
            const clone = element.cloneNode(true) as Element;
            const itemIndex = currentItems.indexOf(item);
            const assignedIndex = assignedOrder.indexOf(itemIndex);
            const isAssigned = assignedIndex !== -1;

            const newName = isAssigned
              ? `${nextPrefix}${String(start + assignedIndex).padStart(nextPadding, "0")}${nextSuffix}`
              : item.name;

            const nameElement = clone.getElementsByTagNameNS(
              KML_NAMESPACE,
              "name",
            )[0];

            if (nameElement) {
              nameElement.textContent = newName;
            } else {
              const newNameElement = xml.createElementNS(
                KML_NAMESPACE,
                "name",
              );
              newNameElement.textContent = newName;
              clone.insertBefore(newNameElement, clone.firstChild);
            }

            if (clone.hasAttribute("id")) {
              clone.setAttribute("id", newName);
            }

            folder.appendChild(clone);
          });
        }

        const serializer = new XMLSerializer();
        zip.file(path, serializer.serializeToString(xml));
      }

      for (const [path, blob] of Object.entries(otherFiles)) {
        if (path.toLowerCase().endsWith(".kml")) continue;
        zip.file(path, blob);
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `${originalFileName || "sorted"}_sorted.kmz`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setStatus("✅ KMZ berhasil dibuat dan di-download.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal membuat KMZ.";
      setStatus(`Error: ${message}`);
      alert(message);
    }
  }

  function handleExportCsv() {
    if (!currentItems.length) {
      alert("Belum ada data tabel untuk di-export.");
      return;
    }

    function escapeCsv(value: string | number) {
      return `"${String(value).replaceAll('"', '""')}"`;
    }

    const rows = [
      ["No", "Nama Lama", "Nama Baru", "Latitude", "Longitude", "Folder"],
      ...currentItems.map((item, index) => {
        const assignedIndex = assignedOrder.indexOf(index);
        const isAssigned = assignedIndex !== -1;

        return [
          isAssigned ? assignedIndex + 1 : index + 1,
          item.name || "",
          currentNames[index] || item.name || "",
          item.lat,
          item.lon,
          item.folder || "",
        ];
      }),
    ];

    const csv = "\uFEFF" + rows
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${originalFileName || "ftth_points"}_edited.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setStatus("✅ CSV berhasil dibuat dan di-download.");
  }

  function handleReset() {

    setAllPlacemarks([]);
    setSelectedFolders([]);
    setCurrentItems([]);
    setCurrentNames([]);
    setAssignedOrder([]);
    setSourceKmlContents({});
    setOtherFiles({});
    setOriginalFileName("");
    setStatus("");
    setIsClickMode(false);
    setIsProcessed(false);
    setNextNumber(1);
    fitBoundsNextRef.current = true;
    markersLayerRef.current?.clearLayers();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <div className="space-y-6">
        <div className="rounded-[2rem] bg-[#dedfe1] p-5 shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8] sm:p-6">
          <h2 className="mb-4 text-lg font-semibold tracking-[-0.04em] text-[#3f4043]">
            Upload KML / KMZ
          </h2>

          <label
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] bg-[#dedfe1] px-5 py-6 text-center shadow-[inset_6px_6px_12px_#bfc0c3,inset_-6px_-6px_12px_#f7f7f8] transition-all duration-200 hover:shadow-[inset_8px_8px_16px_#bfc0c3,inset_-8px_-8px_16px_#f7f7f8]"
          >
            <span className="text-3xl text-[#68696d]">↥</span>
            <span className="mt-3 text-sm font-medium text-[#4f5054]">
              Klik untuk memilih file
            </span>
            <span className="mt-1 text-xs text-[#a4a5a8]">
              Mendukung .kml dan .kmz
            </span>

            <input
              ref={fileInputRef}
              type="file"
              accept=".kml,.kmz"
              hidden
              onChange={handleUpload}
            />
          </label>
        </div>

        {allPlacemarks.length > 0 && (
          <div className="rounded-[2rem] bg-[#dedfe1] p-5 shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8] sm:p-6">
            <h2 className="mb-4 text-lg font-semibold tracking-[-0.04em] text-[#3f4043]">
              1. Select Folders
            </h2>

            <div className="flex flex-wrap gap-3">
              {folderNames.map((folder) => (
                <label
                  key={folder}
                  className="flex cursor-pointer items-center gap-2 rounded-full bg-[#dedfe1] px-3 py-2 text-xs font-medium text-[#68696d] shadow-[4px_4px_8px_#bfc0c3,-4px_-4px_8px_#f7f7f8] transition-all hover:text-[#303135]"
                >
                  <input
                    type="checkbox"
                    checked={selectedFolders.includes(folder)}
                    onChange={(event) =>
                      handleFolderChange(folder, event.target.checked)
                    }
                    className="h-4 w-4 accent-[#68696d]"
                  />
                  <span className="max-w-[180px] truncate">{folder}</span>
                </label>
              ))}
            </div>

          </div>
        )}

        {allPlacemarks.length > 0 && (
          <div className="rounded-[2rem] bg-[#dedfe1] p-5 shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8] sm:p-6">
            <h2 className="mb-4 text-lg font-semibold tracking-[-0.04em] text-[#3f4043]">
              2. Rename Rules
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-[#68696d]">
                Prefix
                <input
                  type="text"
                  value={prefix}
                  onChange={(event) => setPrefix(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl bg-[#dedfe1] px-3 text-sm text-[#3f4043] shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8] outline-none"
                />
              </label>

              <label className="text-xs font-medium text-[#68696d]">
                Start
                <input
                  type="number"
                  value={startNumber}
                  onChange={(event) => setStartNumber(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl bg-[#dedfe1] px-3 text-sm text-[#3f4043] shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8] outline-none"
                />
              </label>

              <label className="text-xs font-medium text-[#68696d]">
                Suffix
                <input
                  type="text"
                  value={suffix}
                  onChange={(event) => setSuffix(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl bg-[#dedfe1] px-3 text-sm text-[#3f4043] shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8] outline-none"
                />
              </label>

              <label className="text-xs font-medium text-[#68696d]">
                Padding
                <input
                  type="number"
                  min="1"
                  placeholder="auto"
                  value={padding}
                  onChange={(event) => setPadding(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl bg-[#dedfe1] px-3 text-sm text-[#3f4043] shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8] outline-none placeholder:text-[#a4a5a8]"
                />
              </label>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSort("asc")}
                className="h-11 cursor-pointer rounded-2xl bg-[#dedfe1] text-sm font-semibold text-[#4f5054] shadow-[6px_6px_12px_#bfc0c3,-6px_-6px_12px_#f7f7f8] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8]"
              >
                A → Z
              </button>

              <button
                type="button"
                onClick={() => handleSort("desc")}
                className="h-11 cursor-pointer rounded-2xl bg-[#dedfe1] text-sm font-semibold text-[#4f5054] shadow-[6px_6px_12px_#bfc0c3,-6px_-6px_12px_#f7f7f8] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8]"
              >
                Z → A
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleManualMode}
                className="h-12 cursor-pointer rounded-2xl bg-[#dedfe1] px-3 text-sm font-semibold text-[#68696d] shadow-[6px_6px_12px_#bfc0c3,-6px_-6px_12px_#f7f7f8] transition-all hover:-translate-y-0.5 hover:text-[#303135] active:translate-y-0 active:shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8]"
              >
                {isClickMode ? "Stop Klik" : "Urut Manual"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="h-12 cursor-pointer rounded-2xl bg-[#dedfe1] px-3 text-sm font-semibold text-[#77787c] shadow-[6px_6px_12px_#bfc0c3,-6px_-6px_12px_#f7f7f8] transition-all hover:-translate-y-0.5 hover:text-[#303135] active:translate-y-0 active:shadow-[inset_5px_5px_10px_#bfc0c3,inset_-5px_-5px_10px_#f7f7f8]"
              >
                Reset
              </button>
            </div>

            {status && (
              <div className="mt-5 rounded-full bg-[#dedfe1] px-4 py-2 text-center text-xs font-medium text-[#68696d] shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8]">
                {status}
              </div>
            )}

            {isClickMode && (
              <div className="mt-3 rounded-full bg-[#dedfe1] px-4 py-2 text-center text-xs font-semibold text-[#68696d] shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8]">
                Mode Klik Aktif — klik marker untuk assign atau unassign
              </div>
            )}

            <p className="mt-3 text-center text-xs text-[#a4a5a8]">
              Marker yang dipilih akan berubah menjadi hijau.
            </p>
          </div>
        )}

        {allPlacemarks.length > 0 && (
          <div className="rounded-[2rem] bg-[#dedfe1] p-5 shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8] sm:p-6">
            <h2 className="mb-4 text-lg font-semibold tracking-[-0.04em] text-[#3f4043]">
              3. Export Results
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!isProcessed && assignedOrder.length === 0}
                className="h-12 cursor-pointer rounded-2xl bg-[#dedfe1] px-3 text-sm font-semibold text-[#4f5054] shadow-[6px_6px_12px_#bfc0c3,-6px_-6px_12px_#f7f7f8] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Download KMZ
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={!currentItems.length}
                className="h-12 cursor-pointer rounded-2xl bg-[#dedfe1] px-3 text-sm font-semibold text-[#4f5054] shadow-[6px_6px_12px_#bfc0c3,-6px_-6px_12px_#f7f7f8] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Export CSV
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex min-h-full min-w-0 flex-col gap-6">
        <div
          ref={mapContainerRef}
          className="h-[420px] shrink-0 overflow-hidden rounded-[2rem] bg-[#dedfe1] shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8] sm:h-[520px]"
        />

        {currentItems.length > 0 && (
          <div className="min-h-0 min-w-0 flex-1 overflow-x-auto rounded-[2rem] bg-[#dedfe1] p-3 shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8] sm:p-4 lg:h-[508px] lg:flex-none">
            <div className="h-full min-h-0 min-w-[780px] overflow-auto rounded-[1.5rem] bg-[#dedfe1] shadow-[inset_5px_5px_10px_#bfc0c3,inset_-5px_-5px_10px_#f7f7f8]">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-[#dedfe1] text-[#68696d]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">#</th>
                    <th className="px-4 py-3 text-left font-semibold">Nama Lama</th>
                    <th className="px-4 py-3 text-left font-semibold">Nama Baru</th>
                    <th className="px-4 py-3 text-left font-semibold">Lat</th>
                    <th className="px-4 py-3 text-left font-semibold">Lon</th>
                    <th className="px-4 py-3 text-left font-semibold">Folder</th>
                  </tr>
                </thead>

                <tbody className="text-[#4f5054]">
                  {currentItems.map((item, index) => {
                    const assignedIndex = assignedOrder.indexOf(index);
                    const isAssigned = assignedIndex !== -1;

                    return (
                      <tr
                        key={`${item.kmlPath}-${item.coord}-${index}`}
                        className={`border-t border-[#c8c9cc] transition-colors hover:bg-[#d8d9db] ${isAssigned ? "bg-[#d5d6d8]" : ""}`}
                      >
                        <td className="px-4 py-3 font-medium">
                          {isAssigned ? assignedIndex + 1 : "-"}
                        </td>
                        <td className="px-4 py-3">{item.name || "(tanpa nama)"}</td>
                        <td className="px-4 py-3 font-medium">
                          {currentNames[index] || item.name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {item.lat.toFixed(5)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {item.lon.toFixed(5)}
                        </td>
                        <td className="max-w-[220px] truncate px-4 py-3">
                          {item.folder || "(root)"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
