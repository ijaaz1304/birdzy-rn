import type { Collection } from "../../services/api/features/core.api.types";
import { archetypeService } from "../../services/archetype/archetype.service";
import { resolveBirdDiscoveryLocation } from "../../utils/birdDiscoveryLocation.helpers";
import {
  getArchetypeImageUrls,
  normalizeArchetypeListItem,
  resolveSpecimenArchetypeId,
} from "../../utils/mushroomApiMappers";
import { resolveMushroomImageUrlsForDisplay } from "../../utils/mushroomCardUtils";
import { getPrimaryCommonName } from "../../utils/mushroomDisplayUtils";

/** Virtual collection card on Collection screen — opens Catalogue Near You tab. */
export const NEAR_YOU_COLLECTION_NAME = "Near You";

export async function fetchNearYouCollectionPreview(): Promise<{
  count: number;
  images: string[];
}> {
  try {
    const discovery = await resolveBirdDiscoveryLocation();
    if (!discovery) return { count: 0, images: [] };

    const { data, pagination } = await archetypeService.stepByStep(
      {
        location: {
          lat: discovery.coords[0],
          lng: discovery.coords[1],
        },
        seenDate: new Date().toISOString().slice(0, 10),
        region: discovery.source !== "gps" ? discovery.regionId : undefined,
      },
      { pageNo: 1, pageSize: 4 }
    );

    const images: string[] = [];
    for (const item of data) {
      const normalized = normalizeArchetypeListItem(
        item as unknown as Record<string, unknown>
      );
      const nameHint =
        normalized.canonicalName?.trim() ||
        normalized.scientificName?.trim() ||
        getPrimaryCommonName(normalized);
      const urls = resolveMushroomImageUrlsForDisplay(
        nameHint,
        normalized.imageUrls,
        nameHint
      );
      const url = urls.find((u) => u.trim().length > 0);
      if (url) images.push(url);
      if (images.length >= 4) break;
    }

    return { count: pagination.totalCount, images };
  } catch {
    return { count: 0, images: [] };
  }
}

/** Preview URLs for a collection card (max 4). */
export function getCollectionPreviewImages(
  col: Pick<Collection, "representativeImages" | "representImage" | "imageUrl">
): string[] {
  const fromList = col.representativeImages?.filter(Boolean) ?? [];
  if (fromList.length > 0) return fromList.slice(0, 4);
  if (col.representImage?.trim()) return [col.representImage.trim()];
  if (col.imageUrl?.trim()) return [col.imageUrl.trim()];
  return [];
}

/** Raw image list from specimen list/detail payloads (imageUrls, images, snake_case). */
export function getSpecimenRawImageUrls(
  specimen: Record<string, unknown>
): string[] {
  const fromDirect = getArchetypeImageUrls(specimen);
  if (fromDirect.length > 0) return fromDirect;

  const snake = specimen.image_urls;
  if (Array.isArray(snake)) {
    const fromSnake = snake.filter(
      (u): u is string => typeof u === "string" && u.trim().length > 0
    );
    if (fromSnake.length > 0) return fromSnake;
  }

  const archetypeRef = specimen._archetype ?? specimen.archetype;
  if (
    archetypeRef &&
    typeof archetypeRef === "object" &&
    !Array.isArray(archetypeRef)
  ) {
    return getArchetypeImageUrls(archetypeRef as Record<string, unknown>);
  }

  return [];
}

/** Up to `limit` resolved preview URLs — one image per specimen row. */
export function toSpecimenPreviewImages(
  specimens: Array<{
    canonicalName?: string | null;
    scientificName?: string | null;
    commonNames?: string[] | null;
    genusCommonNames?: string[] | null;
    commonName?: string | null;
    imageUrls?: unknown[];
    images?: unknown[];
    image_urls?: unknown[];
    [key: string]: unknown;
  }>,
  limit = 4
): string[] {
  const urls: string[] = [];
  for (const specimen of specimens) {
    const resolved = getSpecimenDisplayImageUrls({
      ...specimen,
      canonicalName:
        specimen.canonicalName ??
        specimen.scientificName ??
        getPrimaryCommonName(specimen),
    });
    const url = resolved.find((u) => u.trim().length > 0);
    if (url) urls.push(url);
    if (urls.length >= limit) break;
  }
  return urls;
}

/** Resolve collection-list preview URLs (full URLs pass through; bare filenames when possible). */
export function resolveCollectionPreviewUrls(
  urls: string[] | undefined,
  nameHint?: string
): string[] {
  if (!urls?.length) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of urls) {
    for (const resolved of resolveMushroomImageUrlsForDisplay(
      nameHint,
      [raw],
      nameHint
    )) {
      const u = resolved.trim();
      if (!u || seen.has(u)) continue;
      seen.add(u);
      out.push(u);
    }
  }
  return out;
}

/**
 * Build up to 4 card thumbnails: specimen fetch first, then resolved collection preview URLs.
 * Avoids showing a single API preview URL while count implies more specimens.
 */
export function pickCollectionCardPreviewImages(
  specimenImages: string[],
  fallbackUrls: string[] = [],
  limit = 4
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (url?: string) => {
    const u = url?.trim();
    if (!u || seen.has(u) || out.length >= limit) return;
    seen.add(u);
    out.push(u);
  };
  for (const u of specimenImages) push(u);
  for (const u of fallbackUrls) push(u);
  return out;
}

/**
 * Identified / Wishlist card preview. Specimen fetchAll is the source of truth;
 * collection-list extras can lag after add/remove and must not keep showing a
 * mushroom that is no longer in the collection.
 */
export function resolveSystemCollectionCardPreview(args: {
  specimenTotalCount?: number;
  specimenRowCount?: number;
  specimenImages: string[];
}): { count: number; images: string[] } {
  const rowCount = args.specimenRowCount ?? args.specimenImages.length;
  if (rowCount === 0) {
    return { count: 0, images: [] };
  }
  const count = Math.max(rowCount, args.specimenTotalCount ?? rowCount);
  return {
    count,
    images: pickCollectionCardPreviewImages(args.specimenImages, []),
  };
}

/** Resolved display URLs for cards and carousels (http/file pass-through; filenames → storage URL). */
export function getSpecimenDisplayImageUrls(specimen: {
  imageUrls?: unknown[];
  images?: unknown[];
  image_urls?: unknown[];
  canonicalName?: string | null;
  scientificName?: string | null;
  commonName?: string | null;
}): string[] {
  const raw = getSpecimenRawImageUrls(specimen as Record<string, unknown>);
  const nameForPath =
    specimen.canonicalName?.trim() ||
    specimen.scientificName?.trim() ||
    getPrimaryCommonName(specimen) ||
    undefined;
  return resolveMushroomImageUrlsForDisplay(nameForPath, raw, nameForPath);
}

/** Built-in collection names returned by GET /core/collections/fetchAll */
export const SYSTEM_COLLECTION_NAMES = [
  "Identified",
  "Wishlist",
  "Owned",
] as const;

export function isSystemCollectionName(name: string): boolean {
  return (SYSTEM_COLLECTION_NAMES as readonly string[]).includes(name);
}

/** MongoDB ObjectId-style collection id from the API */
export function looksLikeMongoCollectionId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

/** Normalize to Mongo ObjectId strings only — never display names like "Identified". */
export function normalizeCollectionIds(
  ...sources: Array<string | string[] | undefined | null>
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const src of sources) {
    const list = Array.isArray(src) ? src : src != null ? [src] : [];
    for (const raw of list) {
      const id = String(raw ?? "").trim();
      if (!id || !looksLikeMongoCollectionId(id) || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

/** Resolve MushroomArchetype id from specimen list/detail payloads. */
export function resolveArchetypeIdFromSpecimen(
  specimen: Record<string, unknown>
): string | undefined {
  return resolveSpecimenArchetypeId(specimen);
}
