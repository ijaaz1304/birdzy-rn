/**
 * Bird display name utilities.
 * Bird API uses a single `commonName` string (not commonNames[]).
 */

import {
  getMushroomDisplayName,
  getMushroomDisplayScientific,
  isUsableMushroomName,
} from "./mushroomDisplayUtils";

export { isUsableMushroomName as isUsableBirdName };

export type BirdNameFields = {
  commonName?: string | null;
  scientificName?: string | null;
  canonicalName?: string | null;
  name?: string | null;
};

/** Primary display label: common → scientific → canonical. */
export function getBirdDisplayName(fields: BirdNameFields): string {
  return getMushroomDisplayName(
    fields.commonName,
    fields.scientificName,
    fields.canonicalName ?? fields.scientificName
  );
}

/** Subtitle when common and scientific names differ. */
export function getBirdDisplayScientific(
  commonName?: string | null,
  scientificName?: string | null
): string | undefined {
  return getMushroomDisplayScientific(commonName, scientificName);
}

export function resolveBirdNameFieldsFromRaw(raw: Record<string, unknown>): {
  commonName: string;
  scientificName: string;
  canonicalName?: string;
} {
  const commonName =
    typeof raw.commonName === "string" && isUsableMushroomName(raw.commonName)
      ? raw.commonName.trim()
      : "";
  const scientificName =
    typeof raw.scientificName === "string" &&
    isUsableMushroomName(raw.scientificName)
      ? raw.scientificName.trim()
      : "";
  const canonicalName =
    typeof raw.canonicalName === "string" &&
    isUsableMushroomName(raw.canonicalName)
      ? raw.canonicalName.trim()
      : scientificName || commonName || undefined;
  return { commonName, scientificName, canonicalName };
}
