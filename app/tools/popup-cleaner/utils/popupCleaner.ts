export type PopupSummary = {
  description: number;
  snippet: number;
  extendedData: number;
  balloonStyle: number;
  displayName: number;
  balloonVisibility: number;
  emptyTags: number;
};

export type PopupCleanerResult = {
  cleanedKml: string;
  removed: PopupSummary;
};

export function cleanPopup(
  kml: string
): PopupCleanerResult {

  const parser =
    new DOMParser();

  const xml =
    parser.parseFromString(
      kml,
      "text/xml"
    );

  const removed: PopupSummary = {
    description: 0,
    snippet: 0,
    extendedData: 0,
    balloonStyle: 0,
    displayName: 0,
    balloonVisibility: 0,
    emptyTags: 0,
  };

  function removeTag(
    tag: string,
    key: keyof PopupSummary
  ) {

    const nodes =
      Array.from(
        xml.getElementsByTagName(tag)
      );

    removed[key] +=
      nodes.length;

    nodes.forEach((node) =>
      node.remove()
    );

  }

  removeTag(
    "description",
    "description"
  );

  removeTag(
    "Snippet",
    "snippet"
  );

  removeTag(
    "ExtendedData",
    "extendedData"
  );

  removeTag(
    "BalloonStyle",
    "balloonStyle"
  );

  removeTag(
    "displayName",
    "displayName"
  );

  removeTag(
    "gx:balloonVisibility",
    "balloonVisibility"
  );

  // =====================
  // Remove Empty Tags
  // =====================

  let changed = true;

  while (changed) {

    changed = false;

    Array.from(
      xml.getElementsByTagName("*")
    ).forEach((node) => {

      if (
        node.children.length === 0 &&
        node.attributes.length === 0 &&
        node.textContent?.trim() === "" &&
        node.parentNode
      ) {

        removed.emptyTags++;

        node.remove();

        changed = true;

      }

    });

  }

  return {

    cleanedKml:
      new XMLSerializer()
        .serializeToString(xml),

    removed,

  };

}