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

function getDirectChildFolders(
  folder: Element,
): Element[] {
  return Array.from(folder.children).filter(
    (child) =>
      child.tagName.toLowerCase() === "folder",
  );
}

function getDirectChildPlacemarks(
  folder: Element,
): Element[] {
  return Array.from(folder.children).filter(
    (child) =>
      child.tagName.toLowerCase() === "placemark",
  );
}

function getLineAncestor(
  folder: Element,
): Element | null {
  let current: Element | null =
    folder.parentElement;

  while (current) {
    if (
      current.tagName.toLowerCase() ===
      "folder"
    ) {
      const folderName =
        getFolderName(current).toUpperCase();

      if (/^LINE(?:\s|$)/.test(folderName)) {
        return current;
      }
    }

    current = current.parentElement;
  }

  return null;
}

function getAllFoldersInside(
  folder: Element,
): Element[] {
  const folders: Element[] = [];

  for (const childFolder of getDirectChildFolders(
    folder,
  )) {
    folders.push(childFolder);
    folders.push(
      ...getAllFoldersInside(childFolder),
    );
  }

  return folders;
}

function getFoldersByName(
  rootFolder: Element,
  targetName: string,
): Element[] {
  const normalizedTarget =
    targetName.trim().toUpperCase();

  return getAllFoldersInside(rootFolder).filter(
    (folder) =>
      getFolderName(folder).toUpperCase() ===
      normalizedTarget,
  );
}

function getTopLevelFolders(
  xml: XMLDocument,
): Element[] {
  return Array.from(
    xml.getElementsByTagName("Folder"),
  ).filter((folder) => {
    let parent = folder.parentElement;

    while (parent) {
      if (
        parent.tagName.toLowerCase() ===
        "folder"
      ) {
        return false;
      }

      parent = parent.parentElement;
    }

    return true;
  });
}

function getMainFdtPlacemarks(
  xml: XMLDocument,
): Element[] {
  const topLevelFdtFolders =
    getTopLevelFolders(xml).filter(
      (folder) =>
        getFolderName(folder).toUpperCase() ===
        "FDT",
    );

  return topLevelFdtFolders.flatMap(
    (fdtFolder) =>
      getDirectChildPlacemarks(fdtFolder),
  );
}

function renamePlacemark(
  placemark: Element,
  newName: string,
) {
  const xml = placemark.ownerDocument;

  if (!xml) return;

  let nameNode =
    placemark.getElementsByTagName("name")[0];

  if (!nameNode) {
    nameNode = xml.createElement("name");

    placemark.insertBefore(
      nameNode,
      placemark.firstChild,
    );
  }

  nameNode.textContent = newName;
}

function removeDuplicatedIds(
  placemark: Element,
) {
  placemark.removeAttribute("id");

  const descendants = Array.from(
    placemark.getElementsByTagName("*"),
  );

  descendants.forEach((element) => {
    element.removeAttribute("id");
  });
}

function getFatPlacemarks(
  lineFolder: Element,
): Element[] {
  const fatFolders = getFoldersByName(
    lineFolder,
    "FAT",
  ).filter(
    (fatFolder) =>
      getLineAncestor(fatFolder) ===
      lineFolder,
  );

  return fatFolders.flatMap(
    (fatFolder) =>
      getDirectChildPlacemarks(fatFolder),
  );
}

function syncSlackHangerWithSources(
  xml: XMLDocument,
) {
  const allFolders = Array.from(
    xml.getElementsByTagName("Folder"),
  );

  const slackHangerFolders =
    allFolders.filter(
      (folder) =>
        getFolderName(folder).toUpperCase() ===
        "SLACK HANGER",
    );

  const mainFdtPlacemarks =
    getMainFdtPlacemarks(xml);

  slackHangerFolders.forEach(
    (slackHangerFolder) => {
      const lineFolder =
        getLineAncestor(slackHangerFolder);

      if (!lineFolder) return;

      const lineName =
        getFolderName(lineFolder).toUpperCase();

      /*
       * Semua LINE mengambil Placemark
       * dari FAT yang berada di LINE masing-masing.
       */
      const fatPlacemarks =
        getFatPlacemarks(lineFolder);

      let sourcePlacemarks = [
        ...fatPlacemarks,
      ];

      /*
       * Khusus LINE A, tambahkan Placemark
       * dari folder FDT utama yang berada di
       * luar folder LINE.
       */
      if (lineName === "LINE A") {
        sourcePlacemarks = [
          ...fatPlacemarks,
          ...mainFdtPlacemarks,
        ];
      }

      const slackPlacemarks =
        getDirectChildPlacemarks(
          slackHangerFolder,
        );

      /*
       * Rename Placemark yang sudah ada
       * di dalam SLACK HANGER.
       */
      slackPlacemarks.forEach((placemark) => {
        renamePlacemark(
          placemark,
          "SLACK CABLE",
        );
      });

      /*
       * Jika tidak ada sumber FAT/FDT,
       * jangan melakukan penyalinan.
       */
      if (sourcePlacemarks.length === 0) {
        return;
      }

      /*
       * Tambahkan Placemark hanya jika
       * jumlah SLACK HANGER masih kurang.
       */
      const missingCount =
        sourcePlacemarks.length -
        slackPlacemarks.length;

      if (missingCount <= 0) {
        return;
      }

      const placemarksToCopy =
        sourcePlacemarks.slice(0, missingCount);

      placemarksToCopy.forEach(
        (sourcePlacemark) => {
          const copiedPlacemark =
            sourcePlacemark.cloneNode(
              true,
            ) as Element;

          removeDuplicatedIds(
            copiedPlacemark,
          );

          renamePlacemark(
            copiedPlacemark,
            "SLACK CABLE",
          );

          slackHangerFolder.appendChild(
            copiedPlacemark,
          );
        },
      );
    },
  );
}

export function repairEMRIcon(
  kml: string,
): string {
  const parser = new DOMParser();

  const xml = parser.parseFromString(
    kml,
    "application/xml",
  );

  /*
   * LINE A:
   * FAT LINE A + FDT utama
   *
   * LINE lainnya:
   * FAT di LINE masing-masing
   */
  syncSlackHangerWithSources(xml);

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

  return new XMLSerializer().serializeToString(
    xml,
  );
}