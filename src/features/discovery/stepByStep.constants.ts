import { COLLECTION_STRINGS } from "../../config/strings/collection.strings";
import type { WizardQuestion } from "./stepByStep.types";

export const WIZARD_QUESTION_COUNT = 5;

export const WIZARD_COLOR_OPTIONS = [
  { id: "Black", hex: "#111111" },
  { id: "Gray", hex: "#D1D1D1" },
  { id: "White", hex: "#FFFFFF" },
  { id: "Brown", hex: "#8D440F" },
  { id: "Red", hex: "#E93131" },
  { id: "Yellow", hex: "#FAE70F" },
  { id: "Green", hex: "#049604" },
  { id: "Blue", hex: "#24BCE3" },
  { id: "Orange", hex: "#F89D35" },
] as const;

export const WIZARD_HABITAT_OPTIONS = [
  "Garden / backyard",
  "Forest / woodland",
  "Wetland / marsh",
  "Grassland / field",
  "Urban / city",
  "Lake / river",
  "Coast / shore",
] as const;

export const WIZARD_SIZE_LABELS = COLLECTION_STRINGS.birdDetails.sizeScale;

export const WIZARD_SIZE_RANGES = [
  "< 11 cm",
  "11–16 cm",
  "16–22 cm",
  "22–32 cm",
  "32–48 cm",
  "48–70 cm",
  "> 70 cm",
] as const;

/** Maps the 7-point Figma scale onto the step-by-step API `birdSize` values. */
export const WIZARD_SIZE_API_VALUES = [
  "small",
  "small",
  "medium",
  "medium",
  "large",
  "large",
  "xlarge",
] as const;

export const WIZARD_WEEKDAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export const WIZARD_ANSWER_QUESTIONS: Record<WizardQuestion, string> = {
  location: "Where did you see it?",
  date: "When did you see it?",
  size: "Size",
  colors: "Main color",
  habitat: "Habitat",
};
