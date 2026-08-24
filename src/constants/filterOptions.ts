/**
 * Bird catalogue filter options (static fallbacks).
 * Live values come from GET /core/archetypes/filteritems; these are used when API data is absent.
 */

import {
  BIRD_TYPE_LABELS,
  CONSERVATION_STATUS_LABELS,
} from "./mushroomOptions";

const entriesToOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ label, value }));

export const BIRD_TYPE_FILTER_OPTIONS = entriesToOptions(BIRD_TYPE_LABELS);

export const CONSERVATION_STATUS_FILTER_OPTIONS = entriesToOptions(
  CONSERVATION_STATUS_LABELS
);

export const FLIGHT_PATTERN_FILTER_OPTIONS = [
  { label: "Direct", value: "direct" },
  { label: "Undulating", value: "undulating" },
  { label: "Soaring", value: "soaring" },
  { label: "Hovering", value: "hovering" },
  { label: "Flapping", value: "flapping" },
] as const;

export const FLIGHT_ALTITUDE_FILTER_OPTIONS = [
  { label: "Ground", value: "ground" },
  { label: "Low", value: "low" },
  { label: "Canopy", value: "canopy" },
  { label: "High", value: "high" },
] as const;

export const DIET_FILTER_OPTIONS = [
  { label: "Insects", value: "insects" },
  { label: "Seeds", value: "seeds" },
  { label: "Nectar", value: "nectar" },
  { label: "Fish", value: "fish" },
  { label: "Small mammals", value: "small_mammals" },
  { label: "Fruit", value: "fruit" },
  { label: "Carrion", value: "carrion" },
  { label: "Omnivore", value: "omnivore" },
] as const;

export const HABITAT_FILTER_OPTIONS = [
  { label: "Forest", value: "forest" },
  { label: "Wetland", value: "wetland" },
  { label: "Grassland", value: "grassland" },
  { label: "Desert", value: "desert" },
  { label: "Urban", value: "urban" },
  { label: "Coastal", value: "coastal" },
  { label: "Mountain", value: "mountain" },
  { label: "Open water", value: "open_water" },
  { label: "Shrubland", value: "shrubland" },
] as const;

export const SIZE_FILTER_OPTIONS = [
  { label: "Sparrow-sized", value: "sparrow" },
  { label: "Robin-sized", value: "robin" },
  { label: "Crow-sized", value: "crow" },
  { label: "Goose-sized", value: "goose" },
  { label: "Eagle-sized", value: "eagle" },
] as const;

export const SCIENTIFIC_CLASSIFICATION_LEVELS = [
  "Kingdom",
  "Phylum",
  "Class",
  "Order",
  "Family",
  "Genus",
  "Species",
] as const;

export const LOCATION_INPUT_OPTIONS = [
  { label: "GPS tag", value: "gps" },
  { label: "Manual input", value: "manual" },
] as const;

/** @deprecated Plant/mushroom filters — do not use in Bird app UI */
export const HEIGHT_FILTER_OPTIONS = SIZE_FILTER_OPTIONS;
/** @deprecated */
export const CARE_LEVEL_FILTER_OPTIONS = [] as const;
/** @deprecated */
export const BASIC_TRAITS_FILTER_OPTIONS = [] as const;
/** @deprecated */
export const USEFULNESS_FILTER_OPTIONS = [] as const;
/** @deprecated */
export const TOXICITY_FILTER_OPTIONS = [] as const;
/** @deprecated */
export const TEMPERATURE_TOLERANCE_FILTER_OPTIONS = [] as const;
/** @deprecated */
export const SOIL_TYPE_FILTER_OPTIONS = [] as const;
/** @deprecated */
export const HUMIDITY_RANGE_FILTER_OPTIONS = [] as const;

/** Static bird filter map for tooling / offline fallbacks */
export const getAllFilterOptions = () => ({
  birdType: BIRD_TYPE_FILTER_OPTIONS,
  habitat: HABITAT_FILTER_OPTIONS,
  conservationStatus: CONSERVATION_STATUS_FILTER_OPTIONS,
  flightPattern: FLIGHT_PATTERN_FILTER_OPTIONS,
  flightAltitude: FLIGHT_ALTITUDE_FILTER_OPTIONS,
  diet: DIET_FILTER_OPTIONS,
  size: SIZE_FILTER_OPTIONS,
  customLocation: LOCATION_INPUT_OPTIONS,
});
