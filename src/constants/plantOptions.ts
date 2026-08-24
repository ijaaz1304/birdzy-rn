/**
 * Plant-related dropdown options
 * Centralized location for all plant dropdown options used in edit forms
 */

export const PLANT_HEIGHT_OPTIONS = [
  { label: "Small (0-30 cm)", value: "small" },
  { label: "Medium (30-100 cm)", value: "medium" },
  { label: "Large (100-200 cm)", value: "large" },
  { label: "Extra Large (200+ cm)", value: "extra-large" },
] as const;

export const CARE_LEVEL_OPTIONS = [
  { label: "Easy", value: "easy" },
  { label: "Moderate", value: "moderate" },
  { label: "Difficult", value: "difficult" },
] as const;

export const PET_TOXICITY_OPTIONS = [
  { label: "Non-toxic", value: "non-toxic" },
  { label: "Mildly toxic", value: "mildly-toxic" },
  { label: "Toxic", value: "toxic" },
  { label: "Highly toxic", value: "highly-toxic" },
] as const;

export const FLOWERING_HABIT_OPTIONS = [
  { label: "Seasonal", value: "seasonal" },
  { label: "Year-round", value: "year-round" },
  { label: "Rarely flowers", value: "rarely" },
  { label: "Never flowers", value: "never" },
] as const;

export const MEDICINAL_PROPERTY_OPTIONS = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
  { label: "Unknown", value: "unknown" },
] as const;

export const EDIBILITY_OPTIONS = [
  { label: "Edible", value: "edible" },
  { label: "Not edible", value: "not-edible" },
  { label: "Unknown", value: "unknown" },
] as const;

export const AIR_PURIFYING_OPTIONS = [
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
  { label: "None", value: "none" },
] as const;

export const FRUIT_BEARING_OPTIONS = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
] as const;

export const POISON_LEVEL_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
] as const;

export const TREND_STATUS_OPTIONS = [
  { label: "Trending", value: "trending" },
  { label: "Popular", value: "popular" },
  { label: "Classic", value: "classic" },
  { label: "Rare", value: "rare" },
] as const;

export const SOIL_TYPE_OPTIONS = [
  { label: "Loam", value: "loam" },
  { label: "Sand", value: "sand" },
  { label: "Clay", value: "clay" },
  { label: "Silt", value: "silt" },
  { label: "Peat", value: "peat" },
  { label: "Chalk", value: "chalk" },
] as const;

export const DRAINAGE_OPTIONS = [
  { label: "Well drained", value: "well-drained" },
  { label: "Moderately drained", value: "moderately-drained" },
  { label: "Poorly drained", value: "poorly-drained" },
] as const;

export const LIGHT_LEVEL_OPTIONS = [
  { label: "Low light", value: "low" },
  { label: "Medium light", value: "medium" },
  { label: "Bright indirect", value: "bright-indirect" },
  { label: "Direct sunlight", value: "direct" },
] as const;

export const WATERING_FREQUENCY_OPTIONS = [
  { label: "Daily", value: "daily" },
  { label: "Every 2-3 days", value: "every-2-3-days" },
  { label: "Weekly", value: "weekly" },
  { label: "Every 2 weeks", value: "every-2-weeks" },
  { label: "Monthly", value: "monthly" },
  { label: "As needed", value: "as-needed" },
] as const;

export const FERTILISING_FREQUENCY_OPTIONS = [
  { label: "Weekly", value: "weekly" },
  { label: "Every 2 weeks", value: "every-2-weeks" },
  { label: "Monthly", value: "monthly" },
  { label: "Every 2-3 months", value: "every-2-3-months" },
  { label: "Seasonally", value: "seasonally" },
] as const;

export const REPOTTING_INTERVAL_OPTIONS = [
  { label: "Every 6 months", value: "every-6-months" },
  { label: "Annually", value: "annually" },
  { label: "Every 1-2 years", value: "every-1-2-years" },
  { label: "Every 2-3 years", value: "every-2-3-years" },
  { label: "Rarely", value: "rarely" },
] as const;

export const TAXONOMY_OPTIONS = {
  kingdom: [{ label: "Plantae", value: "Plantae" }],
  phylum: [
    { label: "Tracheophyta", value: "Tracheophyta" },
    { label: "Bryophyta", value: "Bryophyta" },
  ],
  class: [
    { label: "Magnoliopsida", value: "Magnoliopsida" },
    { label: "Liliopsida", value: "Liliopsida" },
  ],
  order: [
    { label: "Alismatales", value: "Alismatales" },
    { label: "Asparagales", value: "Asparagales" },
    { label: "Poales", value: "Poales" },
  ],
  family: [
    { label: "Araceae", value: "Araceae" },
    { label: "Asparagaceae", value: "Asparagaceae" },
    { label: "Arecaceae", value: "Arecaceae" },
  ],
  genus: [
    { label: "Monstera", value: "Monstera" },
    { label: "Sansevieria", value: "Sansevieria" },
    { label: "Epipremnum", value: "Epipremnum" },
  ],
};
