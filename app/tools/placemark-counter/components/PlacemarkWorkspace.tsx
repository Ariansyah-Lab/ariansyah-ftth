"use client";

import JSZip from "jszip";
import { FileSpreadsheet, RefreshCcw, Search, UploadCloud } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";

type PlacemarkRow = {
  site: string;
  category: string;
  subCategory: string;
  item: string;
  qty: number;
  folderPath: string[];
};

type Filters = {
  site: string;
  category: string;
  subCategory: string;
  item: string;
  qty: string;
};

type Status = {
  type: "idle" | "loading" | "success" | "error";
  text: string;
};

const EMPTY_FILTERS: Filters = {
  site: "",
  category: "",
  subCategory: "",
  item: "",
  qty: "",
};

function getElementName(element: Element) {
  const nameElement = Array.from(element.children).find(
    (child) => child.localName?.toLowerCase() === "name",
  );

  return nameElement?.textContent?.trim() || "(tanpa nama)";
}

function getDirectFolders(element: Element) {
  return Array.from(element.children).filter(
    (child) => child.localName?.toLowerCase() === "folder",
  );
}

function getDirectGeometryCount(folder: Element) {
  return Array.from(folder.children).filter((child) => {
    const name = child.localName?.toLowerCase();
    return name === "placemark" || name === "linestring";
  }).length;
}

function getRootFolders(xmlDocument: XMLDocument) {
  const folders = Array.from(xmlDocument.getElementsByTagName("*"))
    .filter((element) => element.localName?.toLowerCase() === "folder")
    .filter((folder) => {
      let parent = folder.parentElement;

      while (parent) {
        if (parent.localName?.toLowerCase() === "folder") {
          return false;
        }
        parent = parent.parentElement;
      }

      return true;
    });

  return folders;
}

function getFolderColumns(folderPath: string[]) {
  const lastFolders = folderPath.slice(-4);

  return {
    site: lastFolders.at(-4) || "",
    category: lastFolders.at(-3) || "",
    subCategory: lastFolders.at(-2) || "",
    item: lastFolders.at(-1) || "",
  };
}

function parseKML(xmlText: string): PlacemarkRow[] {
  const parser = new DOMParser();
  const xmlDocument = parser.parseFromString(xmlText, "text/xml");

  if (xmlDocument.querySelector("parsererror")) {
    throw new Error("Format XML/KML tidak valid.");
  }

  const rows: PlacemarkRow[] = [];

  function walkFolder(folder: Element, ancestors: string[]) {
    const folderName = getElementName(folder);
    const folderPath = [...ancestors, folderName];
    const qty = getDirectGeometryCount(folder);

    if (qty > 0) {
      const columns = getFolderColumns(folderPath);

      rows.push({
        ...columns,
        qty,
        folderPath,
      });
    }

    for (const childFolder of getDirectFolders(folder)) {
      walkFolder(childFolder, folderPath);
    }
  }

  for (const rootFolder of getRootFolders(xmlDocument)) {
    walkFolder(rootFolder, []);
  }

  return rows;
}

async function readKMLorKMZ(file: File) {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".kml")) {
    return file.text();
  }

  if (fileName.endsWith(".kmz")) {
    const zip = await JSZip.loadAsync(file);
    const kmlName = Object.keys(zip.files).find(
      (name) =>
        name.toLowerCase().endsWith(".kml") && !zip.files[name].dir,
    );

    if (!kmlName) {
      throw new Error("Tidak ditemukan file KML di dalam KMZ.");
    }

    const kmlFile = zip.files[kmlName];

    if (!kmlFile) {
      throw new Error("File KML tidak dapat dibaca dari KMZ.");
    }

    return kmlFile.async("text");
  }

  throw new Error("Format file tidak didukung. Gunakan KML atau KMZ.");
}

function csvValue(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function exportRows(rows: PlacemarkRow[]) {
  if (rows.length === 0) {
    alert("Tidak ada data untuk diekspor.");
    return;
  }

  const header = ["Site", "Kategori", "Sub Kategori", "Item", "Qty"];
  const lines = [header.map(csvValue).join(",")];

  for (const row of rows) {
    lines.push(
      [row.site, row.category, row.subCategory, row.item, row.qty]
        .map(csvValue)
        .join(","),
    );
  }

  const blob = new Blob(["\uFEFF" + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `placemark_counter_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function uniqueValues(rows: PlacemarkRow[], key: keyof PlacemarkRow) {
  return Array.from(
    new Set(
      rows
        .map((row) => row[key])
        .filter((value): value is string | number => Boolean(value)),
    ),
  ).sort((a, b) => String(a).localeCompare(String(b), "id"));
}

export default function PlacemarkWorkspace() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [rows, setRows] = useState<PlacemarkRow[]>([]);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [search, setSearch] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<Status>({
    type: "idle",
    text: "Upload file KML atau KMZ untuk melihat struktur folder.",
  });

  async function handleFile(file: File | undefined) {
    if (!file) return;

    setStatus({ type: "loading", text: `Membaca ${file.name}...` });
    setFileName(file.name);

    try {
      const xmlText = await readKMLorKMZ(file);
      const parsedRows = parseKML(xmlText);

      if (parsedRows.length === 0) {
        throw new Error(
          "Tidak ditemukan folder yang memiliki Placemark atau LineString.",
        );
      }

      setRows(parsedRows);
      setFilters(EMPTY_FILTERS);
      setSearch("");
      setStatus({
        type: "success",
        text: `${file.name} berhasil diproses. ${parsedRows.length} folder berisi data ditemukan.`,
      });
    } catch (error) {
      setRows([]);
      setFilters(EMPTY_FILTERS);
      setSearch("");
      setStatus({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat membaca file.",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    void handleFile(event.target.files?.[0]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
    void handleFile(event.dataTransfer.files?.[0]);
  }

  function handleUploadKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  }

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setSearch("");
  }

  const filterOptions = useMemo(
    () => ({
      site: uniqueValues(rows, "site"),
      category: uniqueValues(rows, "category"),
      subCategory: uniqueValues(rows, "subCategory"),
      item: uniqueValues(rows, "item"),
      qty: uniqueValues(rows, "qty"),
    }),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesFilters =
        (!filters.site || row.site === filters.site) &&
        (!filters.category || row.category === filters.category) &&
        (!filters.subCategory || row.subCategory === filters.subCategory) &&
        (!filters.item || row.item === filters.item) &&
        (!filters.qty || String(row.qty) === filters.qty);

      if (!matchesFilters) return false;
      if (!normalizedSearch) return true;

      return [
        row.site,
        row.category,
        row.subCategory,
        row.item,
        String(row.qty),
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [filters, rows, search]);

  const totalQty = useMemo(
    () => filteredRows.reduce((total, row) => total + row.qty, 0),
    [filteredRows],
  );

  const statusClasses =
    status.type === "error"
      ? "text-[#b45151]"
      : status.type === "success"
        ? "text-[#4c7d5b]"
        : status.type === "loading"
          ? "text-[#68696d]"
          : "text-[#77787c]";

  return (
    <section className="min-w-0 space-y-5">
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={handleUploadKeyDown}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDrop}
        className={`rounded-[2rem] bg-[#dedfe1] p-4 text-center shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8] transition sm:p-5 ${
          isDragActive ? "scale-[1.01]" : ""
        }`}
      >
        <div className="flex min-h-44 flex-col items-center justify-center gap-4 rounded-[1.5rem] bg-[#dedfe1] px-5 py-8 shadow-[inset_6px_6px_12px_#bfc0c3,inset_-6px_-6px_12px_#f7f7f8]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dedfe1] text-[#68696d] shadow-[5px_5px_10px_#bfc0c3,-5px_-5px_10px_#f7f7f8]">
            <UploadCloud size={29} strokeWidth={1.7} />
          </div>

          <div>
            <h2 className="text-base font-semibold tracking-[-0.03em] text-[#3f4043] sm:text-lg">
              Upload KML / KMZ
            </h2>
            <p className="mt-1.5 text-xs text-[#77787c] sm:text-sm">
              Drag &amp; drop atau klik untuk upload
            </p>
            {fileName && (
              <p className="mt-2 text-xs text-[#68696d]">{fileName}</p>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".kml,.kmz"
          hidden
          onChange={handleInputChange}
        />
      </div>

      <div className="flex flex-col gap-4 rounded-[2rem] bg-[#dedfe1] p-4 shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#3f4043]">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#dedfe1] text-[#68696d] shadow-[inset_3px_3px_6px_#bfc0c3,inset_-3px_-3px_6px_#f7f7f8]">
              <Search size={16} strokeWidth={1.8} />
            </span>
            Filter data
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#dedfe1] px-3 py-2 text-xs font-semibold text-[#68696d] shadow-[4px_4px_8px_#bfc0c3,-4px_-4px_8px_#f7f7f8] transition hover:-translate-y-0.5 hover:text-[#303135]"
            >
              <RefreshCcw size={13} strokeWidth={1.8} />
              Reset Filter
            </button>

            <button
              type="button"
              onClick={() => exportRows(filteredRows)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#dedfe1] px-3 py-2 text-xs font-semibold text-[#68696d] shadow-[4px_4px_8px_#bfc0c3,-4px_-4px_8px_#f7f7f8] transition hover:-translate-y-0.5 hover:text-[#303135]"
            >
              <FileSpreadsheet size={13} strokeWidth={1.8} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="relative">
          <Search
            size={16}
            strokeWidth={1.8}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a4a5a8]"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search..."
            className="h-11 w-full rounded-2xl bg-[#dedfe1] pl-11 pr-4 text-sm text-[#3f4043] shadow-[inset_5px_5px_10px_#bfc0c3,inset_-5px_-5px_10px_#f7f7f8] outline-none placeholder:text-[#a4a5a8] focus:text-[#303135]"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(
            [
              ["site", "Site"],
              ["category", "Kategori"],
              ["subCategory", "Sub Kategori"],
              ["item", "Item"],
              ["qty", "Qty"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="space-y-1.5">
              <span className="block pl-1 text-[11px] font-semibold text-[#77787c]">
                {label}
              </span>
              <select
                value={filters[key]}
                onChange={(event) => updateFilter(key, event.target.value)}
                className="h-10 w-full rounded-xl bg-[#dedfe1] px-3 text-xs text-[#68696d] shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8] outline-none"
              >
                <option value="">Semua</option>
                {filterOptions[key].map((value) => (
                  <option key={String(value)} value={String(value)}>
                    {String(value)}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.5rem] bg-[#dedfe1] px-5 py-4 shadow-[inset_5px_5px_10px_#bfc0c3,inset_-5px_-5px_10px_#f7f7f8]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#77787c]">
            Total
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-[#303135]">
            {totalQty.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="rounded-[1.5rem] bg-[#dedfe1] px-5 py-4 shadow-[inset_5px_5px_10px_#bfc0c3,inset_-5px_-5px_10px_#f7f7f8]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#77787c]">
            Folder tampil
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-[#303135]">
            {filteredRows.length.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <div className="min-w-0 overflow-hidden rounded-[2rem] bg-[#dedfe1] p-4 shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8] sm:p-5">
        <div className="overflow-x-auto rounded-[1.5rem] bg-[#dedfe1] shadow-[inset_6px_6px_12px_#bfc0c3,inset_-6px_-6px_12px_#f7f7f8]">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-xs text-[#68696d]">
                <th className="px-4 pb-3 pt-4 font-semibold">Site</th>
                <th className="px-4 pb-3 pt-4 font-semibold">Kategori</th>
                <th className="px-4 pb-3 pt-4 font-semibold">Sub Kategori</th>
                <th className="px-4 pb-3 pt-4 font-semibold">Item</th>
                <th className="px-4 pb-3 pt-4 text-right font-semibold">Qty</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row, index) => (
                  <tr
                    key={`${row.folderPath.join("/")}-${index}`}
                    className="border-t border-[#c9cacc]/70 text-[#3f4043] transition hover:bg-[#d8d9db]/60"
                  >
                    <td className="px-4 py-3 font-medium">{row.site || "—"}</td>
                    <td className="px-4 py-3">{row.category || "—"}</td>
                    <td className="px-4 py-3">{row.subCategory || "—"}</td>
                    <td className="px-4 py-3">{row.item || "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {row.qty.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-16 text-center text-sm text-[#a4a5a8]"
                  >
                    Belum ada data yang cocok untuk ditampilkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={`mt-4 flex flex-wrap justify-between gap-2 text-xs ${statusClasses}`}>
          <span>{status.text}</span>
          <span>{filteredRows.length.toLocaleString("id-ID")} folder</span>
        </div>
      </div>
    </section>
  );
}
