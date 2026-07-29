import { StyleDefinition, VariantStyle } from "./styles";
import { getPlacemarkText } from "./placemarkHelpers";

export function findVariant(
  text: string,
  variants?: VariantStyle[]
): VariantStyle | undefined {
  if (!variants) return undefined;

  return variants.find((variant) =>
    variant.keywords.some((keyword) =>
      text.includes(keyword.toUpperCase())
    )
  );
}

export function applyPointStyle(
  placemark: Element,
  style: StyleDefinition,
  folderName?: string
) {
  const xml = placemark.ownerDocument;

  if (!xml) return;

  const text = getPlacemarkText(placemark).toUpperCase();

  // Untuk icon POLE gunakan nama folder
  const source =
    style.iconHref?.includes("placemark_circle.png") && folderName
      ? folderName.toUpperCase()
      : text;

  const variant = findVariant(source, style.variants);

  placemark.querySelector("Style")?.remove();
  placemark.querySelector("styleUrl")?.remove();

  const styleNode = xml.createElement("Style");

  const iconStyle = xml.createElement("IconStyle");

  if (variant) {
    const color = xml.createElement("color");
    color.textContent = kmlColor(variant.color);
    iconStyle.appendChild(color);
  }

  if (style.scale !== undefined) {
    const scale = xml.createElement("scale");
    scale.textContent = style.scale.toString();
    iconStyle.appendChild(scale);
  }

  if (style.iconHref) {
    const icon = xml.createElement("Icon");

    const href = xml.createElement("href");
    href.textContent = style.iconHref;

    icon.appendChild(href);
    iconStyle.appendChild(icon);
  }

  styleNode.appendChild(iconStyle);

  placemark.insertBefore(styleNode, placemark.firstChild);
}

export function applyLineStyle(
  placemark: Element,
  style: StyleDefinition
) {
  const xml = placemark.ownerDocument;

  if (!xml) return;

  const text = getPlacemarkText(placemark).toUpperCase();

  const variant = findVariant(text, style.variants);

  placemark.querySelector("Style")?.remove();
  placemark.querySelector("styleUrl")?.remove();

  const styleNode = xml.createElement("Style");

  const lineStyle = xml.createElement("LineStyle");

  if (variant) {
    const color = xml.createElement("color");
    color.textContent = kmlColor(variant.color);
    lineStyle.appendChild(color);
  }

  if (style.lineWidth !== undefined) {
    const width = xml.createElement("width");
    width.textContent = style.lineWidth.toString();
    lineStyle.appendChild(width);
  }

  styleNode.appendChild(lineStyle);

  placemark.insertBefore(styleNode, placemark.firstChild);
}

export function kmlColor(hex: string): string {
  const color = hex.replace("#", "");

  if (color.length !== 6) return "ffffffff";

  const r = color.substring(0, 2);
  const g = color.substring(2, 4);
  const b = color.substring(4, 6);

  return `ff${b}${g}${r}`;
}