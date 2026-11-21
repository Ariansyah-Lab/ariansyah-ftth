import { STANDARD } from "./standard";
import { STYLES } from "./styles";

import {
  applyPointStyle,
  applyLineStyle,
} from "./styleHelpers";

function getFolderName(folder: Element): string {
  return (
    folder
      .getElementsByTagName("name")[0]
      ?.textContent
      ?.trim() ?? ""
  );
}

function getDirectChildFolders(folder: Element): Element[] {
  return Array.from(folder.children).filter(
    (child) => child.tagName.toLowerCase() === "folder",
  );
}

function getDirectChildPlacemarks(folder: Element): Element[] {
  return Array.from(folder.children).filter(
    (child) => child.tagName.toLowerCase() === "placemark",
  );
}

function getLineAncestor(folder: Element): Element | null {
  let current: Element | null = folder.parentElement;

  while (current) {
    if (current.tagName.toLowerCase() === "folder") {
      const folderName = getFolderName(current).toUpperCase();

      if (/^LINE(?:\s|$)/.test(folderName)) {
        return current;
      }
    }

    current = current.parentElement;
  }

  return null;
}

function getAllFoldersInside(folder: Element): Element[] {
  const folders: Element[] = [];

  for (const childFolder of getDirectChildFolders(folder)) {
    folders.push(childFolder);
    folders.push(...getAllFoldersInside(childFolder));
  }

  return folders;
}

function getFoldersByName(
  rootFolder: Element,
  targetName: string,
): Element[] {
  const normalizedTarget = targetName.trim().toUpperCase();

  return getAllFoldersInside(rootFolder).filter(
    (folder) =>
      getFolderName(folder).toUpperCase() === normalizedTarget,
  );
}

function renamePlacemark(
  placemark: Element,
  newName: string,
) {
  const xml = placemark.ownerDocument;

  if (!xml) return;

  let nameNode = placemark.getElementsByTagName("name")[0];

  if (!nameNode) {
    nameNode = xml.createElement("name");
    placemark.insertBefore(
      nameNode,
      placemark.firstChild,
    );
  }

  nameNode.textContent = newName;
}

function removeDuplicatedIds(placemark: Element) {
  placemark.removeAttribute("id");

  const descendants = Array.from(
    placemark.getElementsByTagName("*"),
  );

  descendants.forEach((element) => {
    element.removeAttribute("id");
  });
}

function syncSlackHangerWithFat(
  xml: XMLDocument,
) {
  const allFolders = Array.from(
    xml.getElementsByTagName("Folder"),
  );

  const slackHangerFolders = allFolders.filter(
    (folder) =>
      getFolderName(folder).toUpperCase() ===
      "SLACK HANGER",
  );

  slackHangerFolders.forEach((slackHangerFolder) => {
    const lineFolder = getLineAncestor(slackHangerFolder);

    // Jika Slack Hanger tidak berada di dalam LINE,
    // jangan mengambil FAT dari lokasi lain.
    if (!lineFolder) return;

    const fatFolders = getFoldersByName(
      lineFolder,
      "FAT",
    ).filter(
      (fatFolder) =>
        getLineAncestor(fatFolder) === lineFolder,
    );

    const fatPlacemarks = fatFolders.flatMap(
      (fatFolder) =>
        getDirectChildPlacemarks(fatFolder),
    );

    const slackPlacemarks =
      getDirectChildPlacemarks(slackHangerFolder);

    /*
     * Semua Placemark yang sudah ada di dalam
     * SLACK HANGER diubah namanya.
     */
    slackPlacemarks.forEach((placemark) => {
      renamePlacemark(
        placemark,
        "SLACK CABLE",
      );
    });

    /*
     * Jika tidak ada FAT di LINE yang sama,
     * jangan melakukan penyalinan.
     */
    if (fatPlacemarks.length === 0) return;

    /*
     * Hanya menyalin Placemark yang kurang.
     * Jika Slack Hanger sudah memiliki jumlah
     * yang sama atau lebih banyak, tidak ada
     * Placemark yang dihapus.
     */
    const missingCount =
      fatPlacemarks.length - slackPlacemarks.length;

    if (missingCount <= 0) return;

    const placemarksToCopy =
      fatPlacemarks.slice(0, missingCount);

    placemarksToCopy.forEach((fatPlacemark) => {
      const copiedPlacemark =
        fatPlacemark.cloneNode(true) as Element;

      removeDuplicatedIds(copiedPlacemark);

      renamePlacemark(
        copiedPlacemark,
        "SLACK CABLE",
      );

      slackHangerFolder.appendChild(
        copiedPlacemark,
      );
    });
  });
}

export function repairEMRIcon(kml: string): string {
  const parser = new DOMParser();

  const xml = parser.parseFromString(
    kml,
    "application/xml",
  );

  /*
   * Sinkronisasi SLACK HANGER dengan FAT
   * berdasarkan LINE yang sama.
   */
  syncSlackHangerWithFat(xml);

  const folders = Array.from(
    xml.getElementsByTagName("Folder"),
  );

  folders.forEach((folder) => {
    const folderName = getFolderName(folder);

    if (!folderName) return;

    const standard = STANDARD[folderName];

    if (!standard) return;

    const style = STYLES[standard.style];

    if (!style) return;

    const placemarks = Array.from(
      folder.getElementsByTagName("Placemark"),
    );

    placemarks.forEach((placemark) => {
      if (style.type === "point") {
        applyPointStyle(
          placemark,
          style,
          folderName,
        );
      } else {
        applyLineStyle(
          placemark,
          style,
        );
      }
    });
  });

  return new XMLSerializer().serializeToString(xml);
}