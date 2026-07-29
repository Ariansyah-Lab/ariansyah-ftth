export type StyleName =
  | "FDT"
  | "FAT"
  | "NEW_POLE"
  | "POLE_EMR"
  | "POLE_PARTNER"
  | "HOMEPASS_COVER"
  | "HOMEPASS_NOT_COVER"
  | "ADSS"
  | "SLING_WIRE"
  | "SLACK_CABLE";

export type FolderRule = {
  style: StyleName;
};

export const STANDARD: Record<string, FolderRule> = {
  // =========================
  // FDT
  // =========================
  FDT: {
    style: "FDT",
  },

  // =========================
  // FAT
  // =========================
  FAT: {
    style: "FAT",
  },

  // =========================
  // HOMEPASS
  // =========================
  "HP COVER": {
    style: "HOMEPASS_COVER",
  },

  "HP UNCOVER": {
    style: "HOMEPASS_NOT_COVER",
  },

  // =========================
  // NEW POLE
  // =========================
  "NEW POLE 7-2.5": {
    style: "NEW_POLE",
  },

  "NEW POLE 7-3": {
    style: "NEW_POLE",
  },

  "NEW POLE 7-4": {
    style: "NEW_POLE",
  },

  "NEW POLE 9-4": {
    style: "NEW_POLE",
  },

  // =========================
  // EXISTING POLE EMR
  // =========================
  "EXISTING POLE EMR 7-2.5": {
    style: "POLE_EMR",
  },

  "EXISTING POLE EMR 7-3": {
    style: "POLE_EMR",
  },

  "EXISTING POLE EMR 7-4": {
    style: "POLE_EMR",
  },

  "EXISTING POLE EMR 9-4": {
    style: "POLE_EMR",
  },

  // =========================
  // EXISTING POLE PARTNER
  // =========================
  "EXISTING POLE PARTNER 7-4": {
    style: "POLE_PARTNER",
  },

  "EXISTING POLE PARTNER 9-4": {
    style: "POLE_PARTNER",
  },

  // =========================
  // CABLE
  // =========================
  "DISTRIBUTION CABLE": {
    style: "ADSS",
  },

  // =========================
  // SLACK
  // =========================
  "SLACK HANGER": {
    style: "SLACK_CABLE",
  },

  // =========================
  // SLING
  // =========================
  "SLING WIRE": {
    style: "SLING_WIRE",
  },
};