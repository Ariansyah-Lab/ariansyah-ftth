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

  slackHangerFolders.forEach(
    (slackHangerFolder) => {
      const lineFolder =
        getLineAncestor(slackHangerFolder);

      // Slack Hanger harus berada di dalam LINE.
      if (!lineFolder) return;

      /*
       * Sumber Placemark adalah gabungan
       * folder FAT dan FDT pada LINE yang sama.
       */
      const sourceFolderNames = [
        "FAT",
        "FDT",
      ];

      const sourcePlacemarks =
        sourceFolderNames.flatMap(
          (sourceFolderName) => {
            const sourceFolders =
              getFoldersByName(
                lineFolder,
                sourceFolderName,
              ).filter(
                (sourceFolder) =>
                  getLineAncestor(
                    sourceFolder,
                  ) === lineFolder,
              );

            return sourceFolders.flatMap(
              (sourceFolder) =>
                getDirectChildPlacemarks(
                  sourceFolder,
                ),
            );
          },
        );

      const slackPlacemarks =
        getDirectChildPlacemarks(
          slackHangerFolder,
        );

      /*
       * Semua Placemark yang sudah ada
       * diubah namanya menjadi SLACK CABLE.
       */
      slackPlacemarks.forEach((placemark) => {
        renamePlacemark(
          placemark,
          "SLACK CABLE",
        );
      });

      /*
       * Jika FAT dan FDT sama-sama tidak
       * memiliki Placemark, jangan menyalin apa pun.
       */
      if (sourcePlacemarks.length === 0) {
        return;
      }

      /*
       * Hanya menyalin jumlah yang masih kurang.
       * Jumlah target mengikuti FAT + FDT.
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
   * Jumlah Slack Hanger mengikuti
   * gabungan FAT + FDT di LINE yang sama.
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