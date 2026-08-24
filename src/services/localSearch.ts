/**
 * Local hybrid search over mushroom names (new_mushroom_search.json).
 * Prefix index narrows the dataset; light fuzzy match runs on the bucket only.
 * Dropdown suggestions from this only; API search runs when the user selects one.
 */

import {
  getAllCommonNames,
  getPrimaryCommonName,
  normalizeCommonNameList,
} from "../utils/mushroomDisplayUtils";

export type SearchDataItem = {
  canonicalName: string;
  scientificName: string;
  commonNames: string[];
  genusCommonNames: string[];
  /** Derived primary label — first commonNames entry, else genusCommonNames. */
  commonName: string | null;
};

type RawSearchDataItem = {
  scientificName?: string;
  verbatimScientificName?: string;
  commonNames?: unknown;
  genusCommonNames?: unknown;
};

const searchDataRaw = require("../../new_mushroom_search.json");
const rawItems: RawSearchDataItem[] = Array.isArray(searchDataRaw)
  ? searchDataRaw
  : Array.isArray((searchDataRaw as { default?: RawSearchDataItem[] })?.default)
  ? (searchDataRaw as { default: RawSearchDataItem[] }).default
  : [];

function normalizeSearchItem(raw: RawSearchDataItem): SearchDataItem | null {
  const scientificName =
    (typeof raw.scientificName === "string" && raw.scientificName.trim()) ||
    (typeof raw.verbatimScientificName === "string" &&
      raw.verbatimScientificName.trim()) ||
    "";
  if (!scientificName) return null;

  const commonNames = normalizeCommonNameList(raw.commonNames);
  const genusCommonNames = normalizeCommonNameList(raw.genusCommonNames);
  const primaryCommonName =
    getPrimaryCommonName({ commonNames, genusCommonNames }) ?? null;

  return {
    canonicalName: scientificName,
    scientificName,
    commonNames,
    genusCommonNames,
    commonName: primaryCommonName,
  };
}

const searchData: SearchDataItem[] = [];
for (let i = 0; i < rawItems.length; i++) {
  const item = normalizeSearchItem(rawItems[i]);
  if (item) searchData.push(item);
}

const PREFIX_LOG = "[MushroomSearch]";
const prefixMap = new Map<string, SearchDataItem[]>();

function getPrefixKeys(name: string): string[] {
  const keys = new Set<string>();
  const lower = name.toLowerCase().trim();
  if (lower.length >= 1) keys.add(lower.slice(0, 1));
  if (lower.length >= 2) keys.add(lower.slice(0, 2));

  for (const word of lower.split(/\s+/)) {
    if (word.length >= 1) keys.add(word.slice(0, 1));
    if (word.length >= 2) keys.add(word.slice(0, 2));
  }

  return [...keys];
}

function addToPrefixMap(item: SearchDataItem): void {
  const keys = new Set(getPrefixKeys(item.scientificName));
  for (const name of getAllCommonNames(item)) {
    for (const key of getPrefixKeys(name)) {
      keys.add(key);
    }
  }

  keys.forEach((key) => {
    const bucket = prefixMap.get(key);
    if (bucket) bucket.push(item);
    else prefixMap.set(key, [item]);
  });
}

for (let i = 0; i < searchData.length; i++) {
  addToPrefixMap(searchData[i]);
}

if (__DEV__) {
  let maxBucket = 0;
  prefixMap.forEach((bucket) => {
    if (bucket.length > maxBucket) maxBucket = bucket.length;
  });
  console.log(
    `${PREFIX_LOG} index ready keys=${prefixMap.size} items=${searchData.length} maxBucket=${maxBucket}`
  );
}

/** Primary suggestion label — prefer species common name, then genus common name. */
export function getSearchSuggestionLabel(item: SearchDataItem): string {
  const common = item.commonName?.trim();
  if (common) return common;
  return item.scientificName;
}

/** Secondary line when common and scientific differ (incl. genus-only common names). */
export function getSearchSuggestionSubtitle(
  item: SearchDataItem
): string | undefined {
  const common = item.commonName?.trim();
  if (!common) return undefined;
  if (common.toLowerCase() === item.scientificName.toLowerCase())
    return undefined;
  return item.scientificName;
}

/** Query to commit when user picks a suggestion (common name first for broader match). */
export function getSearchSuggestionQuery(item: SearchDataItem): string {
  return item.commonName?.trim() || item.scientificName;
}

function matchScore(item: SearchDataItem, q: string): number {
  const scientific = item.scientificName.toLowerCase();
  const commonNames = getAllCommonNames(item).map((name) => name.toLowerCase());

  for (const common of commonNames) {
    if (common.startsWith(q)) return 0;
  }
  if (scientific.startsWith(q)) return 1;

  for (const common of commonNames) {
    if (common.includes(q)) return 2;
  }
  if (scientific.includes(q)) return 3;

  for (const word of scientific.split(/\s+/)) {
    if (word.startsWith(q)) return 4;
    if (word.includes(q)) return 5;
  }

  return -1;
}

/**
 * Hybrid search: prefix bucket lookup then startsWith/includes in bucket only.
 */
export function searchMushroomsHybrid(
  query: string,
  limit = 15
): SearchDataItem[] {
  const trimmed = (query || "").trim();
  if (!trimmed || !searchData.length) return [];

  const t0 = __DEV__ ? performance.now() : 0;
  const q = trimmed.toLowerCase();
  const prefixKey = q.length >= 2 ? q.slice(0, 2) : q.slice(0, 1);
  const bucket = prefixMap.get(prefixKey);
  if (!bucket || bucket.length === 0) {
    if (__DEV__) {
      console.log(
        `${PREFIX_LOG} prefixKey="${prefixKey}" bucket=empty (no key or 0 items)`
      );
    }
    return [];
  }

  const scoredMatches: { item: SearchDataItem; score: number }[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < bucket.length; i++) {
    const item = bucket[i];
    if (seen.has(item.canonicalName)) continue;

    const score = matchScore(item, q);
    if (score < 0) continue;

    seen.add(item.canonicalName);
    scoredMatches.push({ item, score });
  }

  scoredMatches.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return getSearchSuggestionLabel(a.item).localeCompare(
      getSearchSuggestionLabel(b.item)
    );
  });

  const out = scoredMatches.slice(0, limit).map((entry) => entry.item);

  if (__DEV__) {
    const elapsed = performance.now() - t0;
    console.log(
      `${PREFIX_LOG} prefixKey="${prefixKey}" bucketSize=${bucket.length} ` +
        `results=${out.length} ${elapsed.toFixed(2)}ms`
    );
  }

  return out;
}

/** @deprecated Use searchMushroomsHybrid */
export const searchMineralsHybrid = searchMushroomsHybrid;
