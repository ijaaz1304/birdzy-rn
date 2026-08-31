import type { BirdProfileDetails } from "../../../services/api/features/bird.api.types";
import type { MushroomDetail } from "../../../types/mushrooms.types";
import { formatMushroomList } from "../../../utils/mushroomApiMappers";
import { COLLECTION_STRINGS } from "../../../config/strings/collection.strings";

export const BIRD_SIZE_SCALE_COUNT = 7;

const SIZE_CM_THRESHOLDS = [11, 16, 22, 32, 48, 70];

const COLOR_SWATCHES: Record<string, string> = {
  brown: "#8B5A2B",
  chestnut: "#954535",
  russet: "#80461B",
  grey: "#9E9E9E",
  gray: "#9E9E9E",
  black: "#111111",
  white: "#FFFFFF",
  cream: "#F5F0E1",
  buff: "#D2B48C",
  tan: "#C4A484",
  yellow: "#E6C229",
  gold: "#C9A227",
  orange: "#E07A3D",
  red: "#C62828",
  rust: "#B7410E",
  pink: "#E8A0BF",
  purple: "#7B5EA7",
  blue: "#3D6BB3",
  green: "#4C8C4A",
  olive: "#6B7F3A",
};

export type BirdSizeScale = {
  label: string;
  index: number;
};

export type BirdColorChip = {
  label: string;
  hex: string;
};

function firstNonEmpty(
  ...values: Array<string | string[] | undefined | null>
): string | undefined {
  for (const value of values) {
    if (Array.isArray(value)) {
      const joined = formatMushroomList(value);
      if (joined?.trim()) return joined;
      continue;
    }
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export function parseLengthCm(lengthRange?: string): number | undefined {
  if (!lengthRange?.trim()) return undefined;
  const match = lengthRange.match(/(\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : undefined;
}

export function deriveBirdSizeScale(
  lengthRange?: string,
  explicitSize?: string
): BirdSizeScale | undefined {
  const labels = COLLECTION_STRINGS.birdDetails.sizeScale;
  const explicit = explicitSize?.trim();
  if (explicit) {
    const lower = explicit.toLowerCase();
    const index = labels.findIndex((label) => label.toLowerCase() === lower);
    if (index >= 0) return { label: labels[index], index };
    return { label: explicit, index: 1 };
  }

  const cm = parseLengthCm(lengthRange);
  if (cm == null) return undefined;
  let index = SIZE_CM_THRESHOLDS.length;
  for (let i = 0; i < SIZE_CM_THRESHOLDS.length; i++) {
    if (cm < SIZE_CM_THRESHOLDS[i]) {
      index = i;
      break;
    }
  }
  return { label: labels[index], index };
}

export function birdColorChips(colors?: string[]): BirdColorChip[] {
  if (!colors?.length) return [];
  return colors
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((label) => {
      const key = label.toLowerCase();
      const hex =
        COLOR_SWATCHES[key] ??
        COLOR_SWATCHES[key.split(/[\s/-]+/)[0]] ??
        "#9E9E9E";
      return { label, hex };
    });
}

function inferDietType(diet?: string[]): string | undefined {
  if (!diet?.length) return undefined;
  const text = diet.join(" ").toLowerCase();
  const plant = /seed|grain|fruit|nectar|plant|berry|insectivore/.test(text);
  const animal = /insect|worm|fish|meat|prey|bird|animal/.test(text);
  if (/omnivore/.test(text) || (plant && animal)) return "Omnivore";
  if (/herbivore|seed|grain|fruit|nectar/.test(text) && !animal) {
    return "Herbivore";
  }
  if (/insectivore/.test(text)) return "Insectivore";
  if (/carnivore|raptor|prey/.test(text)) return "Carnivore";
  return diet[0];
}

function inferResidentStatus(bird: MushroomDetail): string | undefined {
  const range = bird.rangeDetails;
  if (!range) return undefined;
  const migration = range.migration?.trim();
  const yearRound = range.yearRound?.trim();
  if (yearRound && !migration) {
    return yearRound;
  }
  if (migration && yearRound) {
    return `${yearRound}. ${migration}`;
  }
  return migration || yearRound;
}

export function getBirdDetailBlocks(bird: MushroomDetail) {
  const profile: BirdProfileDetails = bird.profile ?? {};
  const tips = bird.birdWatchingTips;
  const familyName = bird.scientificClassification?.family?.trim();
  const sizeScale = deriveBirdSizeScale(bird.lengthRange, profile.size);
  const colors = birdColorChips(bird.dominantColors);

  return {
    sizeScale,
    colors,
    familyName,
    familyDescription: profile.familyDescription,
    characteristics: {
      shape: firstNonEmpty(
        profile.shape,
        bird.sexDifferences,
        bird.keyIdentificationMarks
      ),
      beak: profile.beak,
      tail: profile.tailShape,
      legs: profile.legCharacteristics,
      length: bird.lengthRange,
      wingspan: bird.wingspanRange,
      weight: bird.weightRange,
    },
    behavior: {
      feeding: firstNonEmpty(profile.feedingBehavior, bird.diet),
      flight: firstNonEmpty(bird.flightPattern),
      vocal: firstNonEmpty(profile.vocalBehavior, tips?.behavioralCues),
      territoriality: profile.territoriality,
      social: profile.socialBehavior,
    },
    habitat: {
      habitat: formatMushroomList(bird.habitatType),
      preferredLocations: tips?.preferredLocations,
      bestTime: tips?.bestTime,
      conservation: bird.conservationStatus,
      distribution: formatMushroomList(
        bird.geographicDistribution?.length
          ? bird.geographicDistribution
          : bird.commonlyFoundIn
      ),
    },
    feeding: {
      dietType: firstNonEmpty(profile.dietType, inferDietType(bird.diet)),
      feedingStyle: profile.feedingStyle,
      diet: formatMushroomList(bird.diet),
    },
    breeding: {
      season: firstNonEmpty(
        profile.breedingSeason,
        bird.rangeDetails?.breeding
      ),
      nestType: profile.nestType,
      material: profile.nestingMaterial,
      parentalCare: profile.parentalCare,
    },
    migration: {
      resident: firstNonEmpty(
        profile.residentStatus,
        inferResidentStatus(bird)
      ),
      path: firstNonEmpty(
        profile.migrationPath,
        bird.rangeDetails?.migration
      ),
      seasonal: firstNonEmpty(
        profile.seasonalPresence,
        bird.rangeDetails?.yearRound,
        bird.customLocation
      ),
    },
  };
}

export function hasAnyValue(
  record: Record<string, string | undefined>
): boolean {
  return Object.values(record).some((value) => Boolean(value?.trim()));
}

export function birdSoundLabel(url: string, index: number): string {
  const strings = COLLECTION_STRINGS.birdDetails.sounds;
  const lower = url.toLowerCase();
  if (lower.includes("song")) {
    return `${strings.songsPrefix} ${index + 1}`;
  }
  if (lower.includes("call")) {
    return `${strings.callsPrefix} ${index + 1}`;
  }
  return `${strings.callPrefix} ${index + 1}`;
}
