/**
 * Mushroom display name utilities
 */

export type MushroomCommonNameFields = {
  commonNames?: unknown;
  genusCommonNames?: unknown;
  /** @deprecated API removed singular commonName; kept for legacy payloads */
  commonName?: string | null;
  name?: string | null;
};

/** API sometimes returns placeholder common names instead of omitting the field. */
const PLACEHOLDER_NAMES = new Set([
  "unknown",
  "n/a",
  "na",
  "none",
  "null",
  "undefined",
]);

/**
 * True when a name string is usable in the UI (not empty / placeholder).
 */
export function isUsableMushroomName(value?: string | null): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_NAMES.has(trimmed.toLowerCase());
}

/** Normalize API/search common-name arrays to trimmed, usable strings. */
export function normalizeCommonNameList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const names: string[] = [];
  for (const entry of value) {
    if (!isUsableMushroomName(entry)) continue;
    const trimmed = entry.trim();
    if (!names.includes(trimmed)) names.push(trimmed);
  }
  return names;
}

/** All searchable/display common names: species first, then genus-level. */
export function getAllCommonNames(fields: MushroomCommonNameFields): string[] {
  const names = [
    ...normalizeCommonNameList(fields.commonNames),
    ...normalizeCommonNameList(fields.genusCommonNames),
  ];
  if (isUsableMushroomName(fields.commonName)) {
    const legacy = fields.commonName!.trim();
    if (!names.includes(legacy)) names.push(legacy);
  }
  return names;
}

/** Primary label: first species common name, else first genus common name. */
export function getPrimaryCommonName(
  fields: MushroomCommonNameFields
): string | undefined {
  const commonNames = normalizeCommonNameList(fields.commonNames);
  if (commonNames.length > 0) return commonNames[0];
  const genusCommonNames = normalizeCommonNameList(fields.genusCommonNames);
  if (genusCommonNames.length > 0) return genusCommonNames[0];
  if (isUsableMushroomName(fields.commonName)) return fields.commonName!.trim();
  if (isUsableMushroomName(fields.name)) return fields.name!.trim();
  return undefined;
}

/**
 * Primary display name: usable common name → scientific name → canonical name.
 * Skips placeholder values like "Unknown" so scientific names still show.
 */
export function getMushroomDisplayName(
  commonName?: string | null,
  scientificName?: string | null,
  canonicalName?: string | null
): string {
  if (isUsableMushroomName(commonName)) return commonName!.trim();
  if (isUsableMushroomName(scientificName)) return scientificName!.trim();
  if (isUsableMushroomName(canonicalName)) return canonicalName!.trim();
  return "";
}

/**
 * Get display name from a mineral-like object (commonName → scientificName → canonicalName).
 * Use everywhere: Catalogue, Identified, Wishlist, Feed, Details, AI Identifier.
 */
export function getDisplayName(
  mineral: MushroomCommonNameFields & {
    canonicalName?: string | null;
    scientificName?: string | null;
    verbatimScientificName?: string | null;
  }
): string {
  return getMushroomDisplayName(
    getPrimaryCommonName(mineral),
    mineral.scientificName ?? mineral.verbatimScientificName,
    mineral.canonicalName
  );
}

/**
 * Secondary line (scientific name) for cards: only when both common and scientific exist and differ.
 * When common name is missing/placeholder, scientific is used as title, so skip the subtitle.
 */
export function getMushroomDisplayScientific(
  commonName?: string | null,
  scientificName?: string | null
): string | undefined {
  if (
    isUsableMushroomName(commonName) &&
    isUsableMushroomName(scientificName) &&
    commonName!.trim() !== scientificName!.trim()
  ) {
    return scientificName!.trim();
  }
  return undefined;
}

/** Card subtitle helper when the record may only expose common-name arrays. */
export function getMushroomDisplayScientificFromFields(
  fields: MushroomCommonNameFields & {
    scientificName?: string | null;
    verbatimScientificName?: string | null;
  }
): string | undefined {
  return getMushroomDisplayScientific(
    getPrimaryCommonName(fields),
    fields.scientificName ?? fields.verbatimScientificName
  );
}

/** Read common-name arrays from raw API/specimen payloads (camelCase or snake_case). */
export function resolveCommonNameFieldsFromRaw(
  raw: Record<string, unknown>
): {
  commonName: string;
  commonNames: string[];
  genusCommonNames: string[];
} {
  const commonNames = normalizeCommonNameList(
    raw.commonNames ?? raw.common_names
  );
  const genusCommonNames = normalizeCommonNameList(
    raw.genusCommonNames ?? raw.genus_common_names
  );
  const commonName =
    getPrimaryCommonName({
      commonNames,
      genusCommonNames,
      commonName:
        typeof raw.commonName === "string"
          ? raw.commonName
          : typeof raw.common_name === "string"
          ? raw.common_name
          : undefined,
      name: typeof raw.name === "string" ? raw.name : undefined,
    }) ?? "";
  return { commonName, commonNames, genusCommonNames };
}
