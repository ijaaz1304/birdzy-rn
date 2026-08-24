/**
 * Guide Types
 * Types for mushroom care guides
 */

export type GuideType =
  | "watering"
  | "light"
  | "soil"
  | "fertilizer"
  | "repotting"
  | "general";

export interface TextSection {
  type: "text";
  title?: string;
  body: string;
}

export interface ImageSection {
  type: "image";
  image: string;
  caption?: string;
}

export interface ImageCardSection {
  type: "image-card";
  title: string;
  description: string;
  image: string;
}

export interface TableSection {
  type: "table";
  title: string;
  rows: Array<{ left: string; right: string; note?: string }>;
}

export interface ListSection {
  type: "list";
  title: string;
  items: string[];
}

export interface TipSection {
  type: "tip";
  text: string;
}

export interface MeterSection {
  type: "meter";
  meterType: "light" | "humidity" | "temperature";
  title: string;
  description: string;
  buttonText: string;
  action: string;
}

export type GuideSection =
  | TextSection
  | ImageSection
  | ImageCardSection
  | TableSection
  | ListSection
  | TipSection
  | MeterSection;

export interface BirdGuide {
  id: string;
  guideType: GuideType;
  mushroomName: string;
  hero: {
    image: string;
    title: string;
    subtitle: string;
    description: string;
  };
  sections: GuideSection[];
}

// Legacy export for backward compatibility
export type PlantGuide = BirdGuide;
