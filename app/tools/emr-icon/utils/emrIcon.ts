import { STANDARD } from "./standard";
import { STYLES } from "./styles";

import {
  applyPointStyle,
  applyLineStyle,
  applyPolygonStyle,
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

function getAllPlacemarksInside(
  folder: Element,
): Element[] {
  return Array.from(
    folder.getElementsByTagName("Placemark"),
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
      getAllPlacemarksInside(fdtFolder),
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

function setPlacemarkDescription(
  placemark: Element,
  descriptionText: string,
) {
  const xml = placemark.ownerDocument;

  if (!xml) return;

  let descriptionNode =
    placemark.getElementsByTagName(
      "description",
    )[0];

  if (!descriptionNode) {
    descriptionNode = xml.createElement(
      "description",
    );

    const nameNode =
      placemark.getElementsByTagName(
        "name",
      )[0];

    if (nameNode?.nextSibling) {
      placemark.insertBefore(
        descriptionNode,
        nameNode.nextSibling,
      );
    } else {
      placemark.appendChild(
        descriptionNode,
      );
    }
  }

  descriptionNode.textContent =
    descriptionText;
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

      const fatPlacemarks =
        getFatPlacemarks(lineFolder);

      let sourcePlacemarks = [
        ...fatPlacemarks,
      ];

      /*
       * LINE A mengambil Placemark
       * dari FAT LINE A + FDT utama.
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

      slackPlacemarks.forEach((placemark) => {
        renamePlacemark(
          placemark,
          "SLACK CABLE",
        );
      });

      if (sourcePlacemarks.length === 0) {
        return;
      }

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

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function calculateDistanceInMeters(
  longitude1: number,
  latitude1: number,
  longitude2: number,
  latitude2: number,
): number {
  const earthRadius = 6_371_000;

  const latitudeDifference = toRadians(
    latitude2 - latitude1,
  );

  const longitudeDifference = toRadians(
    longitude2 - longitude1,
  );

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a),
    );

  return earthRadius * c;
}

function getCoordinates(
  placemark: Element,
): Array<{
  longitude: number;
  latitude: number;
}> {
  const coordinateNode =
    placemark.getElementsByTagName(
      "coordinates",
    )[0];

  if (!coordinateNode?.textContent) {
    return [];
  }

  return coordinateNode.textContent
    .trim()
    .split(/\s+/)
    .map((coordinate) => {
      const [
        longitude,
        latitude,
      ] = coordinate.split(",").map(Number);

      return {
        longitude,
        latitude,
      };
    })
    .filter(
      (coordinate) =>
        Number.isFinite(coordinate.longitude) &&
        Number.isFinite(coordinate.latitude),
    );
}

function getLineStringLengthInMeters(
  placemark: Element,
): number {
  const coordinates =
    getCoordinates(placemark);

  let totalLength = 0;

  for (
    let index = 1;
    index < coordinates.length;
    index++
  ) {
    totalLength +=
      calculateDistanceInMeters(
        coordinates[index - 1].longitude,
        coordinates[index - 1].latitude,
        coordinates[index].longitude,
        coordinates[index].latitude,
      );
  }

  return totalLength;
}

function renameSlingWirePlacemarks(
  folder: Element,
) {
  const placemarks =
    getAllPlacemarksInside(folder);

  placemarks.forEach((placemark) => {
    const length = Math.round(
      getLineStringLengthInMeters(
        placemark,
      ),
    );

    renamePlacemark(
      placemark,
      `SlingWire — ${length} meters`,
    );
  });
}

function getPointCoordinate(
  placemark: Element,
): {
  longitude: number;
  latitude: number;
} | null {
  const coordinates =
    getCoordinates(placemark);

  return coordinates[0] ?? null;
}

function getPolygonRings(
  placemark: Element,
): Array<
  Array<{
    longitude: number;
    latitude: number;
  }>
> {
  const coordinateNodes = Array.from(
    placemark.getElementsByTagName(
      "coordinates",
    ),
  );

  return coordinateNodes
    .map((coordinateNode) => {
      if (!coordinateNode.textContent) {
        return [];
      }

      return coordinateNode.textContent
        .trim()
        .split(/\s+/)
        .map((coordinate) => {
          const [
            longitude,
            latitude,
          ] = coordinate
            .split(",")
            .map(Number);

          return {
            longitude,
            latitude,
          };
        })
        .filter(
          (coordinate) =>
            Number.isFinite(
              coordinate.longitude,
            ) &&
            Number.isFinite(
              coordinate.latitude,
            ),
        );
    })
    .filter((ring) => ring.length >= 3);
}

function isPointInsidePolygon(
  point: {
    longitude: number;
    latitude: number;
  },
  polygon: Array<{
    longitude: number;
    latitude: number;
  }>,
): boolean {
  let inside = false;

  for (
    let index = 0, previousIndex =
      polygon.length - 1;
    index < polygon.length;
    previousIndex = index++
  ) {
    const current = polygon[index];
    const previous = polygon[previousIndex];

    const intersects =
      current.latitude > point.latitude !==
        previous.latitude > point.latitude &&
      point.longitude <
        ((previous.longitude -
          current.longitude) *
          (point.latitude -
            current.latitude)) /
          (previous.latitude -
            current.latitude) +
          current.longitude;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function isPointInsideBoundary(
  point: {
    longitude: number;
    latitude: number;
  },
  boundaryPlacemark: Element,
): boolean {
  const rings = getPolygonRings(
    boundaryPlacemark,
  );

  return rings.some((ring) =>
    isPointInsidePolygon(point, ring),
  );
}

function getHpCoverPlacemarks(
  xml: XMLDocument,
): Element[] {
  const folders = Array.from(
    xml.getElementsByTagName("Folder"),
  ).filter(
    (folder) =>
      getFolderName(folder).toUpperCase() ===
      "HP COVER",
  );

  return folders.flatMap((folder) =>
    getAllPlacemarksInside(folder),
  );
}

function updateBoundaryHpDescriptions(
  xml: XMLDocument,
) {
  const hpCoverPlacemarks =
    getHpCoverPlacemarks(xml);

  const boundaryFolders =
    Array.from(
      xml.getElementsByTagName("Folder"),
    ).filter(
      (folder) =>
        getFolderName(folder).toUpperCase() ===
        "BOUNDARY FAT",
    );

  boundaryFolders.forEach((boundaryFolder) => {
    const boundaryPlacemarks =
      getAllPlacemarksInside(
        boundaryFolder,
      );

    boundaryPlacemarks.forEach(
      (boundaryPlacemark) => {
        const hpCount =
          hpCoverPlacemarks.filter(
            (hpPlacemark) => {
              const hpPoint =
                getPointCoordinate(
                  hpPlacemark,
                );

              if (!hpPoint) {
                return false;
              }

              return isPointInsideBoundary(
                hpPoint,
                boundaryPlacemark,
              );
            },
          ).length;

        setPlacemarkDescription(
          boundaryPlacemark,
          `${hpCount} HP`,
        );
      },
    );
  });
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
   * Sinkronisasi SLACK HANGER:
   * - LINE A = FAT LINE A + FDT utama
   * - LINE lainnya = FAT pada LINE masing-masing
   */
  syncSlackHangerWithSources(xml);

  /*
   * Menghitung HP COVER yang berada
   * di dalam setiap polygon BOUNDARY FAT.
   */
  updateBoundaryHpDescriptions(xml);

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

    if (
      folderName.toUpperCase() ===
      "SLING WIRE"
    ) {
      renameSlingWirePlacemarks(folder);
    }

    const placemarks = Array.from(
      folder.getElementsByTagName(
        "Placemark",
      ),
    );

    placemarks.forEach((placemark) => {
      if (style.type === "point") {
        applyPointStyle(
          placemark,
          style,
          folderName,
        );
      } else if (style.type === "line") {
        applyLineStyle(
          placemark,
          style,
        );
      } else if (style.type === "polygon") {
        applyPolygonStyle(
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