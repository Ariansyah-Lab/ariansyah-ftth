export type VariantStyle = {
  keywords: string[];
  color: string;
};

export type StyleDefinition = {
  type: "point" | "line";

  iconHref?: string;
  scale?: number;

  lineWidth?: number;

  variants?: VariantStyle[];
};

export const STYLES: Record<string, StyleDefinition> = {
  // ======================================================
  // FDT
  // ======================================================
  FDT: {
    type: "point",

    iconHref:
      "http://maps.google.com/mapfiles/kml/shapes/cross-hairs.png",

    scale: 0.8,

    variants: [
      { keywords: ["48C"], color: "#AA00FF" },
      { keywords: ["72C"], color: "#550000" },
      { keywords: ["96C"], color: "#FF0000" },
      { keywords: ["144C"], color: "#FFFF00" },
      { keywords: ["288C"], color: "#FFAA00" },
      {
        keywords: ["SHARING", "3RD PARTY", "EXT"],
        color: "#FFFFFF",
      },
    ],
  },
// ======================================================
// FAT
// ======================================================
FAT: {
  type: "point",

  iconHref:
    "http://maps.google.com/mapfiles/kml/shapes/triangle.png",

  scale: 0.8,

  variants: [
    {
      keywords: [""],
      color: "#FFFF00",
    },
  ],
},
// ======================================================
// NEW POLE
// ======================================================
NEW_POLE: {
  type: "point",

  iconHref:
    "http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png",

  scale: 0.8,

  variants: [
    {
      keywords: ["7-2.5"],
      color: "#AA00FF",
    },
    {
      keywords: ["7-3"],
      color: "#00FFFF",
    },
    {
      keywords: ["7-4"],
      color: "#00FF00",
    },
    {
      keywords: ["9-4"],
      color: "#FF0000",
    },
  ],
},


// ======================================================
// POLE EMR
// ======================================================
POLE_EMR: {
  type: "point",

  iconHref:
    "http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png",

  scale: 0.8,

  variants: [
    {
      keywords: [""],
      color: "#FFFFFF",
    },
  ],
},


// ======================================================
// POLE PARTNER
// ======================================================
POLE_PARTNER: {
  type: "point",

  iconHref:
    "http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png",

  scale: 0.8,

  variants: [
    {
      keywords: [""],
      color: "#FFFFFF",
    },
  ],
},
  // ======================================================
  // HOMEPASS COVER
  // ======================================================
  HOMEPASS_COVER: {
    type: "point",

    iconHref:
      "http://maps.google.com/mapfiles/kml/shapes/homegardenbusiness.png",

    scale: 0.8,

    variants: [{ keywords: [""], color: "#00FF00" }],
  },

  // ======================================================
  // HOMEPASS NOT COVER
  // ======================================================
  HOMEPASS_NOT_COVER: {
    type: "point",

    iconHref:
      "http://maps.google.com/mapfiles/kml/shapes/homegardenbusiness.png",

    scale: 0.8,

    variants: [{ keywords: [""], color: "#FF0000" }],
  },

  // ======================================================
  // DISTRIBUTION CABLE
  // ======================================================
  ADSS: {
    type: "line",

    lineWidth: 3,

    variants: [
      { keywords: ["12C"], color: "#00AAFF" },
      { keywords: ["24C"], color: "#00FF00" },
      { keywords: ["36C"], color: "#FF00FF" },
      { keywords: ["48C"], color: "#AA00FF" },
      { keywords: ["72C"], color: "#550000" },
      { keywords: ["96C"], color: "#FF0000" },
      { keywords: ["144C"], color: "#FFFF00" },
      { keywords: ["288C"], color: "#FFAA00" },
      {
        keywords: ["EXISTING", "3RD PARTY"],
        color: "#FFFFFF",
      },
    ],
  },

  // ======================================================
  // SLING WIRE
  // ======================================================
  SLING_WIRE: {
    type: "line",

    lineWidth: 3,

    variants: [
      {
        keywords: [""],
        color: "#00FFFF",
      },
    ],
  },

  // ======================================================
  // SLACK CABLE
  // ======================================================
  SLACK_CABLE: {
    type: "point",

    iconHref:
      "http://maps.google.com/mapfiles/kml/shapes/target.png",

    scale: 0.8,

    variants: [
      {
        keywords: ["EXISTING"],
        color: "#FFFFFF",
      },
      {
        keywords: [""],
        color: "#FF0000",
      },
    ],
  },
};