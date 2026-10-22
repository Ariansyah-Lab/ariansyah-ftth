"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import JSZip from "jszip";
import "leaflet/dist/leaflet.css";
import {
  Download,
  MapPinned,
  RotateCcw,
  UploadCloud,
} from "lucide-react";

type Kind = "hp" | "fat" | "pole" | "boundary" | "line";

type Feature = {
  name: string;
  kind: Kind;
  coordinates: [number, number][];
  folders: string[];
  fdt: string;
  isFdt: boolean;
  line: string;
};

type LocationData = {
  province: string;
  regency: string;
  district: string;
  village: string;
  postcode: string;
  road: string;
};

type Values = {
  region: string;
  olt: string;
  clusterName: string;
  clusterId: string;
  oltCode: string;
};

type FdtOption = {
  name: string;
  label: string;
  line?: string;
  lat?: number;
  lon?: number;
};

type StatusType = "info" | "success" | "error";

function getNodes(root: Document | Element, name: string) {
  const namespaced = Array.from(
    root.getElementsByTagNameNS("*", name),
  );

  return namespaced.length
    ? namespaced
    : Array.from(root.getElementsByTagName(name));
}

function getText(root: Document | Element, name: string) {
  return getNodes(root, name)[0]?.textContent?.trim() || "";
}

function getFolders(placemark: Element) {
  const result: string[] = [];
  let parent = placemark.parentElement;

  while (parent) {
    if (parent.localName.toLowerCase() === "folder") {
      const name = getText(parent, "name");

      if (name) {
        result.unshift(name);
      }
    }

    parent = parent.parentElement;
  }

  return result;
}

function getCoordinates(
  placemark: Element,
): [number, number][] {
  const node = getNodes(placemark, "coordinates")[0];

  if (!node?.textContent) {
    return [];
  }

  return node.textContent
    .trim()
    .split(/\s+/)
    .map((item) => {
      const [lng, lat] = item.split(",").map(Number);
      return [lat, lng] as [number, number];
    })
    .filter(
      ([lat, lng]) =>
        Number.isFinite(lat) && Number.isFinite(lng),
    );
}

function normalizeFolderName(value: string) {
  return value
    .trim()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function getFdtFolderInfo(folders: string[]) {
  const normalizedFolders = folders.map(normalizeFolderName);
  const lastFolder = normalizedFolders.at(-1) || "";

  // Aturan parser HPDB lama: placemark harus berada langsung
  // di dalam folder terakhir yang bernama FDT.
  if (lastFolder !== "FDT") {
    return {
      isFdt: false,
      label: "",
      line: "",
    };
  }

  // Folder parent di atas FDT, contohnya LINE A FDT 1.
  const parentFolder = folders
    .slice(0, -1)
    .reverse()
    .find((folder) =>
      /\bF\s*D\s*T\s*\d+\b/i.test(
        normalizeFolderName(folder),
      ),
    );

  const line = parentFolder || folders.at(-2) || "";
  const match = normalizeFolderName(line).match(
    /\bF\s*D\s*T\s*(\d+)\b/i,
  );

  return {
    isFdt: true,
    label: match ? `FDT ${match[1]}` : "FDT 1",
    line,
  };
}
function detectKind(
  folders: string[],
  name: string,
  coordinates: [number, number][],
): Kind {
  const source = [...folders, name]
    .join(" ")
    .toUpperCase();

  if (source.includes("BOUNDARY FAT")) {
    return "boundary";
  }

  if (source.includes("HP COVER")) {
    return "hp";
  }

  if (source.includes("FAT")) {
    return "fat";
  }

  if (
    source.includes("POLE") ||
    source.includes("TIANG")
  ) {
    return "pole";
  }

  return coordinates.length > 1 ? "line" : "pole";
}

async function readKmz(file: File): Promise<Feature[]> {
  const zip = await JSZip.loadAsync(file);

  const kmlFile = Object.values(zip.files).find((item) =>
    item.name.toLowerCase().endsWith(".kml"),
  );

  if (!kmlFile) {
    throw new Error("File KMZ tidak berisi file KML.");
  }

  const xml = await kmlFile.async("text");
  const document = new DOMParser().parseFromString(
    xml,
    "application/xml",
  );

  const result: Feature[] = [];

  for (const placemark of getNodes(document, "Placemark")) {
    const name = getText(placemark, "name") || "Tanpa nama";
    const folders = getFolders(placemark);
    const coordinates = getCoordinates(placemark);

    if (!coordinates.length) {
      continue;
    }

    const fdtInfo = getFdtFolderInfo(folders);

    result.push({
      name,
      folders,
      coordinates,
      fdt: fdtInfo.label,
      isFdt: fdtInfo.isFdt,
      line: fdtInfo.line,
      kind: detectKind(folders, name, coordinates),
    });
  }

  return result;
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold text-[#3f4043]">
        {label}
      </span>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border-0 bg-[#dedfe1] px-2.5 py-1.5 text-[10px] text-[#3f4043] shadow-[inset_3px_3px_6px_#c4c5c8,inset_-3px_-3px_6px_#f5f5f6] outline-none placeholder:text-[#a8a9ac] focus:ring-1 focus:ring-[#d4b16b]"
      />
    </label>
  );
}

function KmzMap({ features }: { features: Feature[] }) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    void import("leaflet").then((leaflet) => {
      if (
        !active ||
        !mapElement.current ||
        mapRef.current
      ) {
        return;
      }

      const map = leaflet
        .map(mapElement.current)
        .setView([-2.5, 118], 5);

      leaflet
        .tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 20,
            attribution:
              "&copy; OpenStreetMap contributors",
          },
         )
        .addTo(map);

      mapRef.current = map;
      leafletRef.current = leaflet;
      layerRef.current = leaflet.layerGroup().addTo(map);

      setReady(true);

      setTimeout(() => map.invalidateSize(), 200);
    });

    return () => {
      active = false;
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (
      !ready ||
      !mapRef.current ||
      !leafletRef.current ||
      !layerRef.current
    ) {
      return;
    }

    const map = mapRef.current;
    const leaflet = leafletRef.current;
    const layer = layerRef.current;

    layer.clearLayers();

    if (!features.length) {
      map.setView([-2.5, 118], 5);
      return;
    }

    const allPoints: [number, number][] = [];

    for (const feature of features) {
      allPoints.push(...feature.coordinates);

      if (feature.kind === "boundary") {
        if (feature.coordinates.length >= 3) {
          leaflet
            .polygon(feature.coordinates, {
              color: "#c99535",
              weight: 2,
              fillColor: "#e4bf73",
              fillOpacity: 0.2,
            })
            .bindTooltip(`BOUNDARY: ${feature.name}`)
            .addTo(layer);
        }

        continue;
      }

      if (
        feature.kind === "line" ||
        feature.kind === "fat"
      ) {
        const color =
          feature.kind === "fat"
            ? "#c99535"
            : "#8b5cf6";

        leaflet
          .polyline(feature.coordinates, {
            color,
            weight: feature.kind === "fat" ? 4 : 3,
            opacity: 0.9,
          })
          .bindTooltip(
            `${feature.kind.toUpperCase()}: ${feature.name}`,
          )
          .addTo(layer);

        continue;
      }

      const [lat, lng] = feature.coordinates[0];

      const color =
        feature.kind === "hp"
          ? "#4b83c4"
          : "#68696d";

      leaflet
        .circleMarker([lat, lng], {
          radius: feature.kind === "hp" ? 5 : 6,
          color,
          fillColor: color,
          fillOpacity: 0.9,
          weight: 2,
        })
        .bindTooltip(
          `${feature.kind.toUpperCase()}: ${feature.name}`,
        )
        .addTo(layer);
    }

    if (allPoints.length) {
      map.fitBounds(leaflet.latLngBounds(allPoints), {
        padding: [25, 25],
        maxZoom: 17,
      });
    }

    setTimeout(() => map.invalidateSize(), 200);
  }, [features, ready]);

  return (
    <div
      ref={mapElement}
      className="h-full min-h-[550px] w-full"
    />
  );
}

export default function HPDBWorkspace() {
  const [kmzFile, setKmzFile] = useState<File | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [processing, setProcessing] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [fdtMapping, setFdtMapping] = useState<
    Record<string, string>
  >({});
  const [fdtOptions, setFdtOptions] = useState<FdtOption[]>([]);

  const [location, setLocation] = useState<LocationData>({
    province: "",
    regency: "",
    district: "",
    village: "",
    postcode: "",
    road: "",
  });

  const [, setStatus] = useState({
    type: "info" as StatusType,
    text: "Upload file KMZ untuk memulai.",
  });

  const [values, setValues] = useState<Values>({
    region: "",
    olt: "",
    clusterName: "",
    clusterId: "",
    oltCode: "",
  });



  function updateValue(field: keyof Values, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function loadLocation(data: Feature[], sourceFile?: File) {
    setLocationLoading(true);

    try {
      let center: { lat: number; lon: number } | null = null;

      // Gunakan endpoint HPDB lama terlebih dahulu. Endpoint ini memakai
      // parser Python parse_kmz dan centroid seluruh koordinat KMZ.
      try {
        const body = new FormData();
        const uploadFile = sourceFile || kmzFile;
        if (uploadFile) {
          body.append("kmz", uploadFile);
        }

        if (uploadFile) {
          const response = await fetch("/api/hpdb/location", {
            method: "POST",
            body,
          });

          if (response.ok) {
            center = (await response.json()) as {
              lat: number;
              lon: number;
            };
          }
        }
      } catch {
        // Fallback lokal dipakai bila endpoint lama belum dipasang.
      }

      // Fallback lokal mengikuti logika lama: semua point dan semua vertex
      // dari KMZ ikut dihitung, bukan hanya HP/FAT/boundary.
      if (
        !center ||
        !Number.isFinite(center.lat) ||
        !Number.isFinite(center.lon)
      ) {
        const points = data
          .flatMap((feature) => feature.coordinates)
          .filter(
            ([lat, lon]) =>
              Number.isFinite(lat) && Number.isFinite(lon),
          );

        if (!points.length) {
          throw new Error("Tidak ada koordinat pada KMZ.");
        }

        center = {
          lat:
            points.reduce((sum, point) => sum + point[0], 0) /
            points.length,
          lon:
            points.reduce((sum, point) => sum + point[1], 0) /
            points.length,
        };
      }

      const reverseUrl =
        "https://nominatim.openstreetmap.org/reverse" +
        `?format=jsonv2&lat=${encodeURIComponent(center.lat)}` +
        `&lon=${encodeURIComponent(center.lon)}` +
        "&zoom=18&addressdetails=1";

      const reverse = await fetch(reverseUrl, {
        headers: {
          Accept: "application/json",
          "Accept-Language": "id-ID,id;q=0.9",
        },
      });

      if (!reverse.ok) {
        throw new Error("OpenStreetMap gagal membaca lokasi.");
      }

      const result = (await reverse.json()) as {
        address?: Record<string, string | undefined>;
      };
      const address = result.address || {};

      // Mapping ini mengikuti HPDB lama yang sudah terbukti berhasil.
      const province =
        address.province ||
        address.state ||
        address.region ||
        "";

      const regency =
        address.city ||
        address.county ||
        address.municipality ||
        address.region ||
        "";

      const district =
        address.city_district ||
        address.town ||
        address.district ||
        "";

      const village =
        address.village ||
        address.suburb ||
        address.neighbourhood ||
        "";

      setLocation({
        province: province.toUpperCase(),
        regency: regency.toUpperCase(),
        district: district.toUpperCase(),
        village: village.toUpperCase(),
        postcode: (address.postcode || "").toUpperCase(),
        road: (
          address.road ||
          address.street ||
          address.pedestrian ||
          ""
        ).toUpperCase(),
      });
    } catch (error) {
      console.error(error);
      setStatus({
        type: "error",
        text: "Lokasi OpenStreetMap tidak berhasil dibaca.",
      });
    } finally {
      setLocationLoading(false);
    }
  }

  async function loadFdtOptions(file: File) {
    const body = new FormData();
    body.append("kmz", file);

    const response = await fetch("/api/hpdb/fdt-options", {
      method: "POST",
      body,
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(
        result?.error || "Folder FDT tidak bisa dibaca.",
      );
    }

    const raw = (await response.json()) as Array<{
      name?: string;
      label?: string;
      line?: string;
      lat?: number;
      lon?: number;
    }>;

    return raw
      .filter((item) => item.name)
      .map((item, index) => ({
        name: item.name as string,
        label: item.label || `FDT ${index + 1}`,
        line: item.line,
        lat: item.lat,
        lon: item.lon,
      }));
  }

  async function selectFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".kmz")) {
      setStatus({
        type: "error",
        text: "File harus berformat .KMZ.",
      });
      return;
    }

    try {
      setStatus({
        type: "info",
        text: "Membaca titik, line, dan folder FDT...",
      });

      const data = await readKmz(file);
      setKmzFile(file);
      setFeatures(data);
      setFdtMapping({});

      // Gunakan parser Python HPDB lama bila endpoint tersedia.
      // Jika endpoint belum ada di Next.js, lanjutkan dengan fallback lokal.
      let detectedFdt: FdtOption[] = [];
      try {
        detectedFdt = await loadFdtOptions(file);
      } catch {
        const localFdt = data.filter(
          (feature) => feature.isFdt && feature.fdt,
        );

        detectedFdt = localFdt.map((feature, index) => ({
          name: feature.name,
          label: `FDT ${index + 1}`,
          line: feature.line || feature.folders.join(" / "),
          lat: feature.coordinates[0]?.[0],
          lon: feature.coordinates[0]?.[1],
        }));

        // Fallback tambahan untuk KMZ yang tidak memakai folder terakhir FDT.
        if (!detectedFdt.length) {
          const byLabel = new Map<string, Feature>();

          for (const feature of data) {
            if (feature.fdt && !byLabel.has(feature.fdt)) {
              byLabel.set(feature.fdt, feature);
            }
          }

          detectedFdt = Array.from(byLabel.values()).map(
            (feature, index) => ({
              name: feature.name,
              label: `FDT ${index + 1}`,
              line: feature.line || feature.folders.join(" / "),
              lat: feature.coordinates[0]?.[0],
              lon: feature.coordinates[0]?.[1],
            }),
          );
        }
      }

      setFdtOptions(detectedFdt);
      const mapping: Record<string, string> = {};

      if (detectedFdt.length === 1 && detectedFdt[0]) {
        mapping["FDT 1"] = detectedFdt[0].name;
      }

      setFdtMapping(mapping);
      // Kirim file yang baru dipilih ke alur lokasi HPDB lama.
      await loadLocation(data, file);

      setStatus({
        type: "success",
        text: `${data.length} objek dan ${detectedFdt.length} FDT berhasil dibaca.`,
      });
    } catch {
      setStatus({
        type: "error",
        text: "File KMZ tidak dapat dibaca.",
      });
    }
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (file) {
      void selectFile(file);
    }

    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    if (file) {
      void selectFile(file);
    }
  }

  function reset() {
    setKmzFile(null);
    setFeatures([]);
    setFdtMapping({});
    setFdtOptions([]);
    setLocation({
      province: "",
      regency: "",
      district: "",
      village: "",
      postcode: "",
      road: "",
    });

    setStatus({
      type: "info",
      text: "Data direset. Upload KMZ untuk memulai.",
    });
  }

  async function processExcel(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!kmzFile) {
      setStatus({
        type: "error",
        text: "Silakan upload file KMZ terlebih dahulu.",
      });
      return;
    }

    if (locationLoading) {
      setStatus({
        type: "error",
        text: "Tunggu pembacaan lokasi OSM selesai.",
      });
      return;
    }

    const missingFdt = fdtOptions.some(
      (_, index) => !fdtMapping[`FDT ${index + 1}`],
    );

    if (missingFdt) {
      setStatus({
        type: "error",
        text: "Tentukan semua FDT terlebih dahulu.",
      });
      return;
    }

    setProcessing(true);

    try {
      const formData = new FormData();

      formData.append("kmz", kmzFile);
      formData.append("region", values.region);
      formData.append("olt", values.olt);
      formData.append("cluster_name", values.clusterName);
      formData.append("cluster_id", values.clusterId);
      formData.append("olt_code", values.oltCode);
      formData.append("location", JSON.stringify(location));
      const legacyFdtMapping = Object.fromEntries(
        Object.entries(fdtMapping).map(([label, name]) => [
          label,
          { name },
        ]),
      );

      formData.append(
        "fdt_mapping",
        JSON.stringify(legacyFdtMapping),
      );

      const response = await fetch("/api/hpdb/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Proses gagal (${response.status}): ${errorText}`,
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "HPDB_output.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      setStatus({
        type: "success",
        text: "HPDB Excel berhasil dibuat dan diunduh.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat memproses.",
      });
    } finally {
      setProcessing(false);
    }
  }

  const count = (kind: Kind) =>
    features.filter((feature) => feature.kind === kind)
      .length;

  return (
    <form
      onSubmit={processExcel}
      className="mt-0 grid grid-cols-1 items-start gap-x-4 gap-y-1 md:grid-cols-[0.82fr_1.38fr_1fr]"
    >
      <div className="md:contents">
        <div className="space-y-4 md:col-start-1 md:row-start-1">
        <label
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          className="block w-full cursor-pointer rounded-[1.25rem] bg-[#dedfe1] p-2.5 shadow-[7px_7px_14px_#bfc0c3,-7px_-7px_14px_#f7f7f8]"
        >
          <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-[1rem] bg-[#dedfe1] p-3 text-center shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dedfe1] text-[#68696d] shadow-[5px_5px_10px_#bfc0c3,-5px_-5px_10px_#f7f7f8]">
              <UploadCloud size={21} strokeWidth={1.7} />
            </div>

            <div>
              <h2 className="text-xs font-semibold text-[#3f4043]">
                Upload KMZ
              </h2>

              <p className="mt-1 text-[9px] leading-3 text-[#77787c]">
                {kmzFile?.name || "Drag & drop atau klik"}
              </p>
            </div>
          </div>

          <input
            type="file"
            accept=".kmz"
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>


        <div className="grid grid-cols-2 gap-2">
          <button
            type="submit"
            disabled={!kmzFile || processing || locationLoading}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-[#dedfe1] text-[10px] font-semibold text-[#3f4043] shadow-[5px_5px_10px_#bfc0c3,-5px_-5px_10px_#f7f7f8] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={14} />
            {processing ? "Proses..." : "Process"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-[#dedfe1] text-[10px] font-semibold text-[#68696d] shadow-[5px_5px_10px_#bfc0c3,-5px_-5px_10px_#f7f7f8]"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
        </div>
        <div className="rounded-[1.25rem] bg-[#dedfe1] p-3 shadow-[6px_6px_12px_#bfc0c3,-6px_-6px_12px_#f7f7f8] md:col-start-2 md:row-start-1">
          <div className="mb-3 flex items-center gap-2 text-[#3f4043]">
            <MapPinned size={16} />
            <h2 className="text-sm font-semibold">
              Project Metadata
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field
              label="Region"
              placeholder="JAWA BARAT"
              value={values.region}
              onChange={(value) => updateValue("region", value)}
            />

            <Field
              label="OLT"
              placeholder="OLT-JKT-01"
              value={values.olt}
              onChange={(value) => updateValue("olt", value)}
            />

            <Field
              label="Cluster ID"
              placeholder="CL-001"
              value={values.clusterId}
              onChange={(value) =>
                updateValue("clusterId", value)
              }
            />
            <Field
              label="OLT Code"
              placeholder="OLT-001"
              value={values.oltCode}
              onChange={(value) =>
                updateValue("oltCode", value)
              }
            />
            <div className="col-span-2">
              <Field
                label="Cluster Name"
                placeholder="Nama cluster"
                value={values.clusterName}
                onChange={(value) =>
                  updateValue("clusterName", value)
                }
              />
            </div>
          </div>
        </div>

        <div className="rounded-[1.25rem] bg-[#dedfe1] p-3 shadow-[6px_6px_12px_#bfc0c3,-6px_-6px_12px_#f7f7f8] md:col-start-3 md:row-start-1">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#3f4043]">
              FDT Detection
            </h2>

            <span className="text-[10px] text-[#77787c]">
              {fdtOptions.length} FDT
            </span>
          </div>

          {fdtOptions.length === 0 ? (
            <p className="text-[10px] leading-4 text-[#77787c]">
              FDT belum terdeteksi dari struktur folder KMZ.
            </p>
          ) : (
            <div className="space-y-2">
              {fdtOptions.map((option, index) => {
                const label = `FDT ${index + 1}`;
                return (
                <label key={`${label}-${index}`} className="block">
                  <span className="mb-1 block text-[10px] font-semibold text-[#3f4043]">
                    {label}
                  </span>

                  <select
                    value={fdtMapping[label] || ""}
                    onChange={(event) =>
                      setFdtMapping((current) => ({
                        ...current,
                        [label]: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border-0 bg-[#dedfe1] px-2 py-1.5 text-[10px] text-[#3f4043] shadow-[inset_3px_3px_6px_#c4c5c8,inset_-3px_-3px_6px_#f5f5f6] outline-none"
                  >
                    <option value="">
                      Pilih placemark FDT
                    </option>

                    {fdtOptions.map((option, optionIndex) => (
                        <option
                          key={`${label}-${option.name}-${optionIndex}`}
                          value={option.name}
                        >
                          {option.name}
                        </option>
                      ))}
                  </select>
                </label>
                );
              })}
            </div>
          )}
        </div>



      </div>
      <div className="flex min-h-[590px] min-w-0 flex-col overflow-hidden rounded-[1.5rem] bg-[#dedfe1] p-3 shadow-[8px_8px_16px_#bfc0c3,-8px_-8px_16px_#f7f7f8] md:col-span-3 md:row-start-4">
        <div className="grid shrink-0 grid-cols-2 overflow-hidden rounded-t-[1.15rem] border-b border-[#30466b] bg-[#192d50] text-white sm:grid-cols-4">
          <div className="border-r border-[#30466b] px-3 py-2 sm:px-4">
            <p className="text-[8px] font-medium uppercase tracking-[0.16em] text-[#aabbd5]">
              Provinsi
            </p>
            <p className="mt-1 truncate text-xs font-semibold uppercase">
              {location.province || "-"}
            </p>
          </div>

          <div className="border-r border-[#30466b] px-3 py-2 sm:px-4">
            <p className="text-[8px] font-medium uppercase tracking-[0.16em] text-[#aabbd5]">
              Kabupaten / Kota
            </p>
            <p className="mt-1 truncate text-xs font-semibold uppercase">
              {location.regency || "-"}
            </p>
          </div>

          <div className="border-r border-[#30466b] px-3 py-2 sm:px-4">
            <p className="text-[8px] font-medium uppercase tracking-[0.16em] text-[#aabbd5]">
              Kecamatan
            </p>
            <p className="mt-1 truncate text-xs font-semibold uppercase">
              {location.district || "-"}
            </p>
          </div>

          <div className="px-3 py-2 sm:px-4">
            <p className="text-[8px] font-medium uppercase tracking-[0.16em] text-[#aabbd5]">
              Desa / Kelurahan
            </p>
            <p className="mt-1 truncate text-xs font-semibold uppercase">
              {location.village || "-"}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <KmzMap features={features} />
        </div>

        <div className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 border-t border-[#bfc0c3]/40 px-4 py-2.5 text-[10px] text-[#77787c]">
          <span>
            HP: <strong className="text-[#3f4043]">{count("hp")}</strong>
          </span>
          <span>
            FAT: <strong className="text-[#3f4043]">{count("fat")}</strong>
          </span>
          <span>
            POLE: <strong className="text-[#3f4043]">{count("pole")}</strong>
          </span>
          <span>
            LINE: <strong className="text-[#3f4043]">{count("line")}</strong>
          </span>
          <span>
            BOUNDARY: <strong className="text-[#3f4043]">{count("boundary")}</strong>
          </span>
          <span className="ml-auto">© OpenStreetMap contributors</span>
        </div>
      </div>
    </form>
  );
}
