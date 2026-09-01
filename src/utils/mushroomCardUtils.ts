/**
 * Mushroom-to-card mapping utilities
 */

import {
  getDisplayName,
  getMushroomDisplayScientificFromFields,
} from "./mushroomDisplayUtils";
import { getMushroomImageUrlFromMatch } from "../config/mushroomImageUrls.config";

/** Mushroom-like object with optional name arrays and scientific/canonical names. */
export interface MushroomLike {
  archetypeId?: string;
  _id?: string;
  commonNames?: string[];
  genusCommonNames?: string[];
  /** Derived primary label when normalized from API */
  commonName?: string | null;
  scientificName?: string | null;
  canonicalName?: string | null;
  imageUrls?: unknown[];
  isWishlisted?: boolean;
  soundUrls?: string[];
}

/** Catalogue list card item */
export interface CatalogueCardItem {
  id: string;
  name: string;
  scientificName: string | undefined;
  image: { uri: string } | undefined;
  /** Normalized list of image URIs for carousel when length > 1 */
  imageUrls?: string[];
  category?: string;
  /** From API / store — used with favorites[] for star UI */
  isWishlisted?: boolean;
  soundUrls?: string[];
}

/** Home / simple card item (name + subtitle) */
export interface HomeCardItem {
  id: string;
  name: string;
  subtitle: string;
  image: { uri: string } | undefined;
}

/**
 * Pick a single URI from an unknown value (string or object with uri/url/imageUrl/path/src).
 */
function pickUriFromUnknown(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const candidates = [
      obj.uri,
      obj.url,
      obj.imageUrl,
      obj.path,
      obj.src,
    ].filter((v) => typeof v === "string") as string[];
    const first = candidates[0];
    return typeof first === "string" ? first.trim() || undefined : undefined;
  }
  return undefined;
}

/**
 * Normalize image inputs to an array of valid URI strings.
 * Handles: undefined, null, empty array, string[], { uri }[], mixed API shapes.
 * Filters out empty/invalid entries. Safe for use in card carousels.
 */
export function normalizeImageUrls(
  input: unknown[] | string[] | undefined | null
): string[] {
  if (input == null || !Array.isArray(input)) return [];
  const uris: string[] = [];
  for (const item of input) {
    const uri = pickUriFromUnknown(item);
    if (uri && uris.indexOf(uri) === -1) uris.push(uri);
  }
  return uris;
}

/**
 * Detail/carousel: full http(s)/file URLs pass through; bare filenames (e.g. from
 * specimen APIs) become Firebase Storage URLs under scraped/mindat_images/{key}/,
 * matching POST .../specimen/fetchAll when it returns full URLs for the same files.
 */
export function resolveMushroomImageUrlsForDisplay(
  canonicalName: string | undefined,
  imageUrls: unknown[] | undefined | null,
  /** Used when canonicalName is missing (e.g. only scientificName on record). */
  fallbackMineralName?: string | undefined
): string[] {
  const nameForPath = canonicalName?.trim() || fallbackMineralName?.trim();
  const normalized = normalizeImageUrls(imageUrls);
  return normalized.map((uri) => {
    const u = uri.trim();
    if (
      u.startsWith("http://") ||
      u.startsWith("https://") ||
      u.startsWith("file://")
    ) {
      return u;
    }
    return getMushroomImageUrlFromMatch(nameForPath, u) ?? u;
  });
}

/**
 * Normalize first image from imageUrls to { uri: string } for Image source.
 */
export function getFirstImageUri(
  imageUrls: unknown[] | undefined
): { uri: string } | undefined {
  const uris = normalizeImageUrls(imageUrls);
  if (uris.length === 0) return undefined;
  return { uri: uris[0] };
}

/**
 * Get stable card id from mushroom record (archetypeId or _id).
 */
export function getBirdCardId(mushroom: {
  archetypeId?: string;
  _id?: string;
  custom_id?: string;
  id?: string;
}): string {
  return (
    mushroom.archetypeId ||
    mushroom.custom_id ||
    mushroom._id ||
    mushroom.id ||
    ""
  );
}

/**
 * Map mushroom/archetype to catalogue list card item (display name rules, image URI).
 */
export function mapMushroomToCatalogueCard(
  mushroom: MushroomLike,
  category?: string
): CatalogueCardItem {
  const id = getBirdCardId(mushroom);
  const displayName = getDisplayName(mushroom);
  const displayScientific = getMushroomDisplayScientificFromFields(mushroom);
  const imageUrls = resolveMushroomImageUrlsForDisplay(
    mushroom.canonicalName ?? undefined,
    mushroom.imageUrls,
    mushroom.scientificName ?? undefined
  );
  const image = imageUrls.length > 0 ? { uri: imageUrls[0] } : undefined;
  return {
    id,
    name: displayName,
    scientificName: displayScientific,
    image,
    isWishlisted: mushroom.isWishlisted === true,
    ...(imageUrls.length > 0 && { imageUrls }),
    ...(category !== undefined && { category }),
    ...(Array.isArray(mushroom.soundUrls) &&
      mushroom.soundUrls.length > 0 && { soundUrls: mushroom.soundUrls }),
  };
}

/**
 * Map mushroom/archetype to home card item (name + subtitle, display name rules).
 */
export function mapMushroomToHomeCard(mushroom: MushroomLike): HomeCardItem {
  const id = getBirdCardId(mushroom);
  const name = getDisplayName(mushroom);
  const subtitle = getMushroomDisplayScientificFromFields(mushroom) ?? "";
  const image = getFirstImageUri(mushroom.imageUrls);
  return { id, name, subtitle, image };
}
