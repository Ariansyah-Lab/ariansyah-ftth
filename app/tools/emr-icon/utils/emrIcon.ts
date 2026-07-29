import { STANDARD } from "./standard";
import { STYLES } from "./styles";

import {
  applyPointStyle,
  applyLineStyle,
} from "./styleHelpers";

export function repairEMRIcon(kml: string): string {
  const parser = new DOMParser();

  const xml = parser.parseFromString(
    kml,
    "application/xml"
  );

  const folders = Array.from(
    xml.getElementsByTagName("Folder")
  );

  folders.forEach((folder) => {
    const nameNode =
      folder.getElementsByTagName("name")[0];

    if (!nameNode) return;

    const folderName =
      nameNode.textContent?.trim() ?? "";

    const standard = STANDARD[folderName];

    if (!standard) return;

    const style = STYLES[standard.style];

    if (!style) return;

    const placemarks = Array.from(
      folder.getElementsByTagName("Placemark")
    );

    placemarks.forEach((placemark) => {
      if (style.type === "point") {
        applyPointStyle(
          placemark,
          style,
          folderName
        );
      } else {
        applyLineStyle(
          placemark,
          style
        );
      }
    });
  });

  return new XMLSerializer().serializeToString(xml);
}