import {
  StyleDefinition,
  VariantStyle,
} from "./styles";

import { getPlacemarkText } from "./placemarkHelpers";

export function findVariant(
  text: string,
  variants?: VariantStyle[],
): VariantStyle | undefined {
  if (!variants) return undefined;

  return variants.find((variant) =>
    variant.keywords.some((keyword) =>
      text.includes(keyword.toUpperCase()),
    ),
  );
}

export function applyPointStyle(
  placemark: Element,
  style: StyleDefinition,
  folderName?: string,
) {
  const xml = placemark.ownerDocument;

  if (!xml) return;

  const text = getPlacemarkText(placemark).toUpperCase();

  // Untuk icon POLE gunakan nama folder
  const source =
    style.iconHref?.includes(
      "placemark_circle.png",
    ) && folderName
      ? folderName.toUpperCase()
      : text;

  const variant = findVariant(
    source,
    style.variants,
  );

  placemark.querySelector("Style")?.remove();
  placemark.querySelector("styleUrl")?.remove();

  const styleNode = xml.createElement("Style");

  // ======================================================
  // ICON STYLE
  // ======================================================
  const iconStyle = xml.createElement("IconStyle");

  if (variant) {
    const iconColor = xml.createElement("color");
    iconColor.textContent = kmlColor(
      variant.color,
    );
    iconStyle.appendChild(iconColor);
  }

  if (style.scale !== undefined) {
    const iconScale = xml.createElement("scale");
    iconScale.textContent =
      style.scale.toString();
    iconStyle.appendChild(iconScale);
  }

  if (style.iconHref) {
    const icon = xml.createElement("Icon");

    const href = xml.createElement("href");
    href.textContent = style.iconHref;

    icon.appendChild(href);
    iconStyle.appendChild(icon);
  }

  styleNode.appendChild(iconStyle);

  // ======================================================
  // LABEL STYLE
  // Warna dan ukuran label mengikuti icon
  // ======================================================
  const labelStyle = xml.createElement("LabelStyle");

  if (variant) {
    const labelColor = xml.createElement("color");
    labelColor.textContent = kmlColor(
      variant.color,
    );
    labelStyle.appendChild(labelColor);
  }

  if (style.scale !== undefined) {
    const labelScale = xml.createElement("scale");
    labelScale.textContent =
      style.scale.toString();
    labelStyle.appendChild(labelScale);
  }

  styleNode.appendChild(labelStyle);

  placemark.insertBefore(
    styleNode,
    placemark.firstChild,
  );
}

export function applyLineStyle(
  placemark: Element,
  style: StyleDefinition,
) {
  const xml = placemark.ownerDocument;

  if (!xml) return;

  const text = getPlacemarkText(placemark).toUpperCase();

  const variant = findVariant(
    text,
    style.variants,
  );

  placemark.querySelector("Style")?.remove();
  placemark.querySelector("styleUrl")?.remove();

  const styleNode = xml.createElement("Style");

  const lineStyle = xml.createElement("LineStyle");

  if (variant) {
    const color = xml.createElement("color");
    color.textContent = kmlColor(
      variant.color,
    );
    lineStyle.appendChild(color);
  }

  if (style.lineWidth !== undefined) {
    const width = xml.createElement("width");
    width.textContent =
      style.lineWidth.toString();
    lineStyle.appendChild(width);
  }

  styleNode.appendChild(lineStyle);

  placemark.insertBefore(
    styleNode,
    placemark.firstChild,
  );
}

export function applyPolygonStyle(
  placemark: Element,
  style: StyleDefinition,
) {
  const xml = placemark.ownerDocument;

  if (!xml) return;

  placemark.querySelector("Style")?.remove();
  placemark.querySelector("styleUrl")?.remove();

  const styleNode = xml.createElement("Style");

  // ======================================================
  // LINE STYLE / OUTLINE
  // ======================================================
  const lineStyle = xml.createElement("LineStyle");

  const outlineColor =
    style.outlineColor ?? "#009999";

  const outlineOpacity =
    style.outlineOpacity ?? 0.4;

  const lineColor = xml.createElement("color");
  lineColor.textContent = kmlColor(
    outlineColor,
    outlineOpacity,
  );
  lineStyle.appendChild(lineColor);

  const lineWidth = xml.createElement("width");
  lineWidth.textContent = (
    style.lineWidth ?? 3
  ).toString();
  lineStyle.appendChild(lineWidth);

  styleNode.appendChild(lineStyle);

  // ======================================================
  // POLYGON STYLE / FILL
  // ======================================================
  const polyStyle = xml.createElement("PolyStyle");

  const fillColor =
    style.fillColor ?? "#009999";

  const fillOpacity =
    style.fillOpacity ?? 0.4;

  const polygonColor = xml.createElement(
    "color",
  );
  polygonColor.textContent = kmlColor(
    fillColor,
    fillOpacity,
  );
  polyStyle.appendChild(polygonColor);

  const fill = xml.createElement("fill");
  fill.textContent = "1";
  polyStyle.appendChild(fill);

  const outline = xml.createElement(
    "outline",
  );
  outline.textContent = "1";
  polyStyle.appendChild(outline);

  styleNode.appendChild(polyStyle);

  placemark.insertBefore(
    styleNode,
    placemark.firstChild,
  );
}

export function kmlColor(
  hex: string,
  opacity = 1,
): string {
  const color = hex.replace("#", "");

  if (color.length !== 6) {
    return "ffffffff";
  }

  const r = color.substring(0, 2);
  const g = color.substring(2, 4);
  const b = color.substring(4, 6);

  const safeOpacity = Math.max(
    0,
    Math.min(1, opacity),
  );

  const alpha = Math.round(
    safeOpacity * 255,
  )
    .toString(16)
    .padStart(2, "0");

  // Format warna KML: AABBGGRR
  return `${alpha}${b}${g}${r}`;
}