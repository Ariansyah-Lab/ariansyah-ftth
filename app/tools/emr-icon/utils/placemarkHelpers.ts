export function getPlacemarkText(placemark: Element): string {
  const values: string[] = [];

  const tags = [
    "name",
    "description",
    "SimpleData",
    "Data",
    "value",
    "coordinates",
  ];

  tags.forEach((tag) => {
    const nodes = placemark.getElementsByTagName(tag);

    for (const node of Array.from(nodes)) {
      if (node.textContent?.trim()) {
        values.push(node.textContent.trim());
      }
    }
  });

  return values.join(" ").toUpperCase();
}