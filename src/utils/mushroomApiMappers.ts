/**
 * Legacy catalogue/detail mappers — delegates to `birdApiMappers`.
 * @deprecated Import from `./birdApiMappers` in new code.
 */

import type {
  MushroomListItem,
  MushroomDetail,
  MushroomIdentification,
} from "../types/mushrooms.types";
import type { BirdArchetypeStats } from "../services/api/features/bird.api.types";
import type { FruitingSeason, MushroomMatch } from "../services/api/features/core.api.types";
import type { MushroomSpecimenListItem } from "../services/api/features/core.api.types";
import {
  normalizeBirdListItem,
  normalizeBirdDetail,
  normalizeBirdArchetypeListResponse,
  normalizeBirdArchetypeStats,
  normalizeBirdSpecimenListItem,
  normalizeBirdSpecimen,
  getBirdCatalogueTabFilters,
  formatBirdList,
  getBirdArchetypeId,
  getBirdImageUrls,
  getBirdMatchImageUrls,
  isBirdRecord,
  birdIdentificationToLegacy,
  normalizeBirdIdentifyResponseLegacy,
  getBirdConservationTone,
  type BirdPossibleMatchListItem,
} from "./birdApiMappers";
import type { BirdMatch } from "../services/api/features/bird.api.types";
import { getFirstMushroomImageUrl } from "../config/mushroomImageUrls.config";

export const POSSIBLE_MATCH_THUMBNAIL_WIDTH = 120;
export const POSSIBLE_MATCH_THUMBNAIL_HEIGHT = 120;

export type PossibleMatchListItem = BirdPossibleMatchListItem;

/** @deprecated Use BirdArchetypeStats */
export type MushroomArchetypeStats = BirdArchetypeStats;

export function getArchetypeId(raw: Record<string, unknown>): string {
  return getBirdArchetypeId(raw);
}

export function getArchetypeImageUrls(raw: Record<string, unknown>): string[] {
  return getBirdImageUrls(raw);
}

export function resolveSpecimenArchetypeId(
  specimen: Record<string, unknown> | null | undefined
): string | undefined {
  if (!specimen) return undefined;
  const id =
    specimen._archetype ??
    specimen.archetypeId ??
    specimen.archetype_id ??
    specimen.mushroomId;
  return id != null ? String(id) : undefined;
}

export function birdListItemToMushroomListItem(
  bird: ReturnType<typeof normalizeBirdListItem>
): MushroomListItem {
  return {
    archetypeId: bird.archetypeId,
    commonName: bird.commonName,
    commonNames: bird.commonName ? [bird.commonName] : [],
    scientificName: bird.scientificName,
    canonicalName: bird.canonicalName,
    imageUrls: bird.imageUrls,
    defaultImageUrl: bird.defaultImageUrl,
    summary: bird.summary,
    commonlyFoundIn: [],
    isIdentified: bird.isIdentified,
    isWishlisted: bird.isWishlisted,
    isOwned: bird.isOwned,
    soundUrls: bird.soundUrls,
  } as MushroomListItem;
}

export function normalizeArchetypeListItem(
  raw: Record<string, unknown>
): MushroomListItem {
  return birdListItemToMushroomListItem(normalizeBirdListItem(raw));
}

export function normalizeMushroomDetail(
  raw: Record<string, unknown>
): MushroomDetail {
  const bird = normalizeBirdDetail(raw);
  const habitat = bird.habitat ?? [];
  const fromSimilar =
    bird.similarBirds?.map((item) => ({
      speciesId: item.speciesId,
      scientificName: item.scientificName ?? "",
      commonNames: item.commonName ? [item.commonName] : [],
      keyDifferences: item.keyDifferences,
      imageUrls: item.imageUrls,
      similarityScore: item.similarityScore,
    })) ?? [];
  const fromLookAlikes = Array.isArray(raw.lookAlikes)
    ? (raw.lookAlikes as MushroomDetail["lookAlikes"])
    : [];
  return {
    ...bird,
    _id: bird._id ?? bird.archetypeId,
    commonNames: bird.commonName ? [bird.commonName] : [],
    habitatType: habitat,
    geographicDistribution: habitat,
    birdsLifeId: bird.birdsLifeId,
    distributionHotspots: habitat,
    lookAlikes: fromSimilar.length ? fromSimilar : fromLookAlikes,
  } as unknown as MushroomDetail;
}

export function normalizeSpecimenListItem(
  raw: Record<string, unknown>
): MushroomSpecimenListItem {
  const item = normalizeBirdSpecimenListItem(raw);
  return item as unknown as MushroomSpecimenListItem;
}

export function normalizeSpecimenDetail(raw: Record<string, unknown>) {
  return normalizeBirdSpecimen(raw);
}

export function normalizeArchetypeListResponse<
  T extends { data?: unknown[]; pagination?: unknown },
>(response: T) {
  const normalized = normalizeBirdArchetypeListResponse(response);
  return {
    ...normalized,
    data: normalized.data.map(birdListItemToMushroomListItem),
  };
}

export function normalizeArchetypeStats(data: unknown): MushroomArchetypeStats {
  return normalizeBirdArchetypeStats(data);
}

export function getCatalogueTabFilters(tab: string): Record<string, string[]> {
  return getBirdCatalogueTabFilters(tab);
}

export function formatMushroomList(
  value?: string[] | string | Record<string, unknown> | null
): string | undefined {
  if (!value) return undefined;
  if (typeof value === "object" && !Array.isArray(value)) {
    const entries = Object.entries(value).filter(([, v]) => v != null && v !== 0);
    return entries.length
      ? entries.map(([k, v]) => `${k}: ${v}`).join(", ")
      : undefined;
  }
  return formatBirdList(value as string[] | string | null);
}

export function formatFruitingSeasonDisplay(
  season?: FruitingSeason | string | null
): string | undefined {
  if (!season) return undefined;
  if (typeof season === "string") return season;
  const monthly = season.monthly_distribution;
  if (monthly && typeof monthly === "object") {
    return Object.entries(monthly)
      .filter(([, v]) => Number(v) > 0)
      .map(([month]) => month)
      .join(", ");
  }
  return undefined;
}

export function formatDistributionHotspotsDisplay(
  hotspots?: string[] | Record<string, unknown> | null
): string | undefined {
  return formatMushroomList(hotspots ?? undefined);
}

export function isMushroomRecord(
  data: Record<string, unknown> | null | undefined
): boolean {
  return isBirdRecord(data);
}

export function getMatchImageUrls(match: MushroomMatch): string[] {
  return getBirdMatchImageUrls(match as unknown as BirdMatch);
}

export function mapIdentificationToPossibleMatch(
  item: MushroomIdentification
): PossibleMatchListItem {
  const imageUrls = item.match
    ? getBirdMatchImageUrls(item.match as unknown as BirdMatch)
    : [];
  return {
    id: item.mushroomId,
    _id: (item.match as { _id?: string } | undefined)?._id ?? item.mushroomId,
    name: item.name,
    commonName: item.name,
    scientificName: item.scientificName,
    accuracy: item.confidence,
    similarityScore: item.similarityScore ?? item.confidence / 100,
    image: imageUrls[0] ?? getFirstMushroomImageUrl(item.mushroomId),
    images: imageUrls.length ? imageUrls : undefined,
    match: item.match as unknown as BirdMatch | undefined,
  };
}

export function getPossibleMatchThumbnailUri(
  item: PossibleMatchListItem | MushroomIdentification
): string | undefined {
  if ("image" in item && item.image) return item.image;
  if ("images" in item && item.images?.[0]) return item.images[0];
  const match = (item as PossibleMatchListItem).match;
  if (match) return getBirdMatchImageUrls(match)[0];
  return undefined;
}

export function getMushroomSafetyTone(
  edibility?: string | null,
  toxicitySeverity?: string | null,
  _psychoactive?: string | null
): "safe" | "caution" | "danger" | "neutral" {
  return getBirdConservationTone(edibility ?? toxicitySeverity);
}

export {
  birdIdentificationToLegacy,
  normalizeBirdIdentifyResponseLegacy as normalizeIdentifyResponse,
};
