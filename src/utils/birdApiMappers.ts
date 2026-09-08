/**
 * Bird API response normalizers.
 * Maps Trackzio Bird core API shapes onto Bird frontend models.
 * @see docs/API_DOMAIN_MAPPING.md
 */

import type {
  BirdMatch,
  BirdArchetypeStats,
  BirdIdentifyResponse,
  BirdSpecimenListItem,
  BirdSpecimen,
  BirdSpecimenCollectionRef,
  BirdProfileDetails,
} from "../services/api/features/bird.api.types";
import type {
  BirdListItem,
  BirdDetail,
  BirdIdentification,
  IdentifyBirdResult,
  BirdListResponse,
} from "../types/birds.types";
import type { MushroomIdentification } from "../types/mushrooms.types";
import {
  getBirdDisplayName,
  resolveBirdNameFieldsFromRaw,
} from "./birdDisplayUtils";

const BIRD_FIELD_MARKERS = [
  "birdsLifeId",
  "birdType",
  "birdWatchingTips",
  "soundUrls",
  "keyIdentificationMarks",
  "flightPattern",
  "conservationStatus",
  "dominantColors",
  "wingspanRange",
] as const;

const EMPTY_BIRD_STATS: BirdArchetypeStats = {
  all: 0,
  raptors: 0,
  songbirds: 0,
  waterBirds: 0,
  threatened: 0,
  soaring: 0,
};

/** True when payload looks like Bird API (not mushroom/mineral). */
export function isBirdRecord(
  data: Record<string, unknown> | null | undefined
): boolean {
  if (!data) return false;
  if (BIRD_FIELD_MARKERS.some((key) => data[key] != null)) return true;
  if (
    typeof data.commonName === "string" &&
    data.commonName.trim() &&
    data.birdsLifeId != null
  ) {
    return true;
  }
  return false;
}

/** Fix duplicated S3 prefix in defaultImageUrl from API samples. */
export function sanitizeBirdImageUrl(url?: string | null): string | undefined {
  if (typeof url !== "string" || !url.trim()) return undefined;
  let cleaned = url.trim();
  const afterScheme = cleaned.indexOf("://");
  if (afterScheme >= 0) {
    const secondHttp = cleaned.indexOf("http", afterScheme + 3);
    if (secondHttp > 0) cleaned = cleaned.slice(secondHttp);
  }
  return cleaned.startsWith("http") ? cleaned : undefined;
}

export function getBirdArchetypeId(raw: Record<string, unknown>): string {
  const id =
    raw.archetypeId ?? raw.archetype_id ?? raw._id ?? raw.id ?? "";
  return String(id);
}

export function getBirdImageUrls(raw: Record<string, unknown>): string[] {
  const urls = raw.imageUrls ?? raw.images;
  if (Array.isArray(urls)) {
    return urls
      .map((u) => (typeof u === "string" ? u.trim() : undefined))
      .filter((u): u is string => Boolean(u));
  }
  const single = asString(raw.defaultImageUrl);
  return single ? [single] : [];
}

export function getBirdSoundUrls(raw: Record<string, unknown>): string[] {
  const urls = raw.soundUrls ?? raw.userCapturedSounds;
  if (!Array.isArray(urls)) return [];
  return urls.filter(
    (u): u is string => typeof u === "string" && u.trim().length > 0
  );
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter(
    (v): v is string => typeof v === "string" && v.trim().length > 0
  );
  return items.length ? items : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    const text = asString(value);
    if (text) return text;
  }
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** Pull optional Figma profile fields from a detail payload when the API sends them. */
export function extractBirdProfile(
  raw: Record<string, unknown>
): BirdProfileDetails | undefined {
  const nestedRaw = raw.birdProfile ?? raw.extendedDetails;
  const nested =
    nestedRaw && typeof nestedRaw === "object" && !Array.isArray(nestedRaw)
      ? (nestedRaw as Record<string, unknown>)
      : {};
  const src = { ...raw, ...nested };
  const profile: BirdProfileDetails = {
    size: firstString(src.size, src.birdSize, src.sizeCategory),
    familyDescription: firstString(src.familyDescription, src.familyNotes),
    shape: firstString(src.shape, src.shapeSilhouette, src.silhouette),
    beak: firstString(src.beak, src.bill),
    tailShape: firstString(src.tailShape, src.tail),
    legCharacteristics: firstString(
      src.legCharacteristics,
      src.legs,
      src.feet
    ),
    feedingBehavior: firstString(src.feedingBehavior),
    vocalBehavior: firstString(src.vocalBehavior),
    territoriality: firstString(src.territoriality),
    socialBehavior: firstString(src.socialBehavior),
    dietType: firstString(src.dietType),
    feedingStyle: firstString(src.feedingStyle),
    breedingSeason: firstString(src.breedingSeason),
    nestType: firstString(src.nestType),
    nestingMaterial: firstString(src.nestingMaterial),
    parentalCare: firstString(src.parentalCare),
    residentStatus: firstString(
      src.residentStatus,
      src.residentOrMigratory
    ),
    migrationPath: firstString(src.migrationPath, src.migrationPathNotes),
    seasonalPresence: firstString(src.seasonalPresence),
  };
  return Object.values(profile).some((value) => Boolean(value))
    ? profile
    : undefined;
}

/** Normalize raw API match/archetype/specimen into BirdMatch. */
export function normalizeBirdMatch(
  raw: Record<string, unknown>
): BirdMatch {
  const names = resolveBirdNameFieldsFromRaw(raw);
  const imageUrls = getBirdImageUrls(raw);
  const defaultImageUrl =
    sanitizeBirdImageUrl(asString(raw.defaultImageUrl)) ?? imageUrls[0];

  return {
    _id: String(raw._id ?? raw.id ?? getBirdArchetypeId(raw)),
    archetypeId: asString(raw.archetypeId) ?? asString(raw.archetype_id),
    birdsLifeId: asString(raw.birdsLifeId) ?? asString(raw.birds_life_id),
    scientificName: names.scientificName || names.commonName || "Unknown",
    commonName: names.commonName || undefined,
    summary: asString(raw.summary) ?? asString(raw.description),
    wikipediaLink: asString(raw.wikipediaLink) ?? asString(raw.wikipediaUrl),
    imageUrls,
    soundUrls: getBirdSoundUrls(raw),
    userCapturedImages: asStringArray(raw.userCapturedImages),
    userCapturedSounds: asStringArray(raw.userCapturedSounds),
    processed_sound_urls: asStringArray(raw.processed_sound_urls),
    scientificClassification: raw.scientificClassification as BirdMatch["scientificClassification"],
    birdType: asStringArray(raw.birdType),
    flightPattern: asStringArray(raw.flightPattern),
    flightSpeed: asString(raw.flightSpeed),
    flightAltitude: asStringArray(raw.flightAltitude),
    birdWatchingTips: raw.birdWatchingTips as BirdMatch["birdWatchingTips"],
    diet: asStringArray(raw.diet),
    habitat: asStringArray(raw.habitat),
    lifeExpectancyInWild: asString(raw.lifeExpectancyInWild),
    conservationStatus: asString(raw.conservationStatus),
    potentialHazards: raw.potentialHazards as BirdMatch["potentialHazards"],
    funFacts: asStringArray(raw.funFacts),
    similarBirds: Array.isArray(raw.similarBirds)
      ? (raw.similarBirds as BirdMatch["similarBirds"])
      : undefined,
    keyIdentificationMarks: asStringArray(raw.keyIdentificationMarks),
    dominantColors: asStringArray(raw.dominantColors),
    sexDifferences: asString(raw.sexDifferences),
    rangeDetails: raw.rangeDetails as BirdMatch["rangeDetails"],
    profile: extractBirdProfile(raw),
    lengthRange: asString(raw.lengthRange),
    wingspanRange: asString(raw.wingspanRange),
    weightRange: asString(raw.weightRange),
    analyticsUrl: asString(raw.analyticsUrl),
    canonicalName: names.canonicalName,
    similarityScore: asNumber(raw.similarityScore) ?? 0,
    alternativeNames: asStringArray(raw.alternativeNames),
    imageCount: asNumber(raw.imageCount),
    s3_key: raw.s3_key as string | null | undefined,
    metrics: raw.metrics as BirdMatch["metrics"],
    debug: raw.debug as BirdMatch["debug"],
    defaultImageUrl,
    isIdentified: Boolean(raw.isIdentified),
    isWishlisted: Boolean(raw.isWishlisted),
    isOwned: raw.isOwned != null ? Boolean(raw.isOwned) : undefined,
    customLocation: asString(raw.customLocation),
    comment: raw.comment as string | null | undefined,
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
  };
}

/** POST /core/archetypes/fetchAll list row → BirdListItem. */
export function normalizeBirdListItem(
  raw: Record<string, unknown>
): BirdListItem {
  const names = resolveBirdNameFieldsFromRaw(raw);
  const imageUrls = getBirdImageUrls(raw);
  const displayName = getBirdDisplayName(names);

  return {
    archetypeId: getBirdArchetypeId(raw),
    birdsLifeId: asString(raw.birdsLifeId),
    commonName: displayName || names.commonName,
    scientificName: names.scientificName,
    canonicalName: names.canonicalName,
    summary: asString(raw.summary),
    description: asString(raw.description),
    imageUrls,
    defaultImageUrl:
      sanitizeBirdImageUrl(asString(raw.defaultImageUrl)) ?? imageUrls[0],
    soundUrls: getBirdSoundUrls(raw),
    isIdentified: Boolean(raw.isIdentified),
    isWishlisted: Boolean(raw.isWishlisted),
    isOwned: raw.isOwned != null ? Boolean(raw.isOwned) : undefined,
    similarityScore: asNumber(raw.similarityScore),
    score: asNumber(raw.score),
    distanceFromUser: asNumber(raw.distanceFromUser),
    conservationStatus: asString(raw.conservationStatus),
    birdType: asStringArray(raw.birdType),
  };
}

/** Full archetype / specimen / match detail. */
export function normalizeBirdDetail(raw: Record<string, unknown>): BirdDetail {
  const list = normalizeBirdListItem(raw);
  const match = normalizeBirdMatch(raw);

  return {
    ...list,
    _id: match._id,
    wikipediaLink: match.wikipediaLink,
    scientificClassification: match.scientificClassification,
    flightPattern: match.flightPattern,
    flightSpeed: match.flightSpeed,
    flightAltitude: match.flightAltitude,
    birdWatchingTips: match.birdWatchingTips,
    diet: match.diet,
    habitat: match.habitat,
    lifeExpectancyInWild: match.lifeExpectancyInWild,
    potentialHazards: match.potentialHazards,
    funFacts: match.funFacts,
    similarBirds: match.similarBirds,
    keyIdentificationMarks: match.keyIdentificationMarks,
    dominantColors: match.dominantColors,
    sexDifferences: match.sexDifferences,
    rangeDetails: match.rangeDetails,
    profile: match.profile,
    lengthRange: match.lengthRange,
    wingspanRange: match.wingspanRange,
    weightRange: match.weightRange,
    analyticsUrl: match.analyticsUrl,
    userCapturedImages: match.userCapturedImages,
    userCapturedSounds: match.userCapturedSounds,
    userNotes: asString(raw.userNotes),
    customLocation: match.customLocation,
    comment: match.comment,
  };
}

function normalizeBirdCollectionRef(
  raw: unknown
): BirdSpecimenCollectionRef | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const id = r._id ?? r.collectionId ?? r.id;
  if (!id) return undefined;
  return {
    _id: String(id),
    name: asString(r.name) ?? "",
    description: asString(r.description),
    modifiedAt: asString(r.modifiedAt) ?? asString(r.modified_at),
  };
}

/** POST /core/specimen/fetchAll list row. */
export function normalizeBirdSpecimenListItem(
  raw: Record<string, unknown>
): BirdSpecimenListItem & { commonName: string } {
  const names = resolveBirdNameFieldsFromRaw(raw);
  const imageUrls = getBirdImageUrls(raw);

  const collectionsRaw = raw.collections;
  const collections = Array.isArray(collectionsRaw)
    ? collectionsRaw
        .map(normalizeBirdCollectionRef)
        .filter((c): c is BirdSpecimenCollectionRef => Boolean(c))
    : undefined;

  const legacyCollection = raw.collection as BirdSpecimenListItem["collection"];

  return {
    specimenId: String(raw.specimenId ?? raw._id ?? raw.id ?? ""),
    _archetype: asString(raw._archetype) ?? asString(raw.archetypeId),
    scientificName: names.scientificName,
    commonName: getBirdDisplayName(names) || names.commonName,
    defaultImageUrl:
      sanitizeBirdImageUrl(asString(raw.defaultImageUrl)) ?? imageUrls[0],
    imageUrls,
    isIdentified: Boolean(raw.isIdentified),
    isWishlisted: Boolean(raw.isWishlisted),
    isOwned: raw.isOwned != null ? Boolean(raw.isOwned) : undefined,
    collections,
    collection: legacyCollection,
  };
}

/** GET /core/specimen/getDetails/:id */
export function normalizeBirdSpecimen(
  raw: Record<string, unknown>
): BirdSpecimen {
  const match = normalizeBirdMatch(raw);
  const collectionsRaw = raw.collections;
  const collections = Array.isArray(collectionsRaw)
    ? collectionsRaw
        .map(normalizeBirdCollectionRef)
        .filter((c): c is BirdSpecimenCollectionRef => Boolean(c))
    : undefined;

  return {
    ...match,
    _id: String(raw._id ?? raw.id ?? match._id),
    id: asString(raw.id) ?? String(raw._id ?? match._id),
    _archetype: asString(raw._archetype) ?? match.archetypeId ?? null,
    _user: asString(raw._user),
    userId: asString(raw.userId) ?? asString(raw.user_id),
    userNotes: asString(raw.userNotes),
    topMatches: Array.isArray(raw.topMatches) ? raw.topMatches : undefined,
    isIdentified: Boolean(raw.isIdentified),
    isWishlisted: Boolean(raw.isWishlisted),
    isOwned: raw.isOwned != null ? Boolean(raw.isOwned) : undefined,
    rating: raw.rating as number | null | undefined,
    comment: raw.comment as string | null | undefined,
    _collections: asStringArray(raw._collections),
    imageAugUrls: asStringArray(raw.imageAugUrls),
    collections,
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
    __v: asNumber(raw.__v),
  };
}

export function normalizeBirdArchetypeListResponse<
  T extends { data?: unknown[]; pagination?: unknown },
>(response: T): T & { data: BirdListItem[] } {
  const data = Array.isArray(response.data)
    ? response.data.map((item) =>
        normalizeBirdListItem(
          item && typeof item === "object"
            ? (item as Record<string, unknown>)
            : {}
        )
      )
    : [];
  return { ...response, data };
}

export function normalizeBirdListResponse(
  response: BirdListResponse
): BirdListResponse {
  return normalizeBirdArchetypeListResponse(response);
}

/** GET /core/archetypes/stats */
export function normalizeBirdArchetypeStats(
  data: unknown
): BirdArchetypeStats {
  if (!data || typeof data !== "object") return { ...EMPTY_BIRD_STATS };
  const stats = data as Record<string, number>;
  return {
    all: stats.all ?? 0,
    raptors: stats.raptors,
    songbirds: stats.songbirds,
    waterBirds: stats.waterBirds,
    threatened: stats.threatened,
    soaring: stats.soaring,
  };
}

/** Catalogue home tabs → POST /core/archetypes/fetchAll filter body. */
export function getBirdCatalogueTabFilters(
  tab: string
): Record<string, string[]> {
  switch (tab) {
    case "Raptors":
      return { birdType: ["Raptor"] };
    case "Songbirds":
      return { birdType: ["Songbird"] };
    case "Water birds":
    case "Water Birds":
      return { birdType: ["Waterfowl", "Shorebird", "Seabird", "Wading Bird"] };
    case "Threatened":
      return {
        conservationStatus: [
          "Near Threatened",
          "Vulnerable",
          "Endangered",
          "Critically Endangered",
          "Threatened",
          "ESA",
        ],
      };
    case "Soaring":
      return { flightPattern: ["Soaring"] };
    case "Near you":
      return {};
    default:
      return {};
  }
}

export function formatBirdList(
  value?: string[] | string | null
): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value))
    return value.filter(Boolean).join(", ") || undefined;
  return String(value);
}

export type BirdPossibleMatchListItem = {
  id: string;
  _id?: string;
  name: string;
  commonName?: string;
  scientificName?: string;
  canonicalName?: string;
  birdsLifeId?: string;
  accuracy?: number;
  similarityScore?: number;
  conservationStatus?: string;
  image?: string;
  images?: string[];
  match?: BirdMatch;
};

export function getBirdMatchImageUrls(match: BirdMatch): string[] {
  if (Array.isArray(match.imageUrls) && match.imageUrls.length > 0) {
    return match.imageUrls
      .map((u) => sanitizeBirdImageUrl(u))
      .filter((u): u is string => Boolean(u));
  }
  const fallback = sanitizeBirdImageUrl(match.defaultImageUrl);
  return fallback ? [fallback] : [];
}

/** Map identify API match → BirdIdentification for UI. */
export function mapBirdIdentificationMatch(
  match: BirdMatch,
  confidenceLevel?: string
): BirdIdentification {
  const name = getBirdDisplayName({
    commonName: match.commonName,
    scientificName: match.scientificName,
    canonicalName: match.canonicalName,
  });

  return {
    birdId: match._id || match.archetypeId || "",
    archetypeId: match.archetypeId,
    birdsLifeId: match.birdsLifeId,
    name: name || match.scientificName,
    commonName: match.commonName,
    scientificName: match.scientificName,
    confidence: Math.round((match.similarityScore ?? 0) * 100),
    similarityScore: match.similarityScore ?? 0,
    confidenceLevel,
    conservationStatus: match.conservationStatus,
    characteristics: {
      birdType: formatBirdList(match.birdType),
      habitat: formatBirdList(match.habitat),
      diet: formatBirdList(match.diet),
      conservationStatus: match.conservationStatus,
      dominantColors: formatBirdList(match.dominantColors),
      keyIdentificationMarks: formatBirdList(match.keyIdentificationMarks),
      flightPattern: formatBirdList(match.flightPattern),
    },
    match,
  };
}

export function mapBirdIdentificationToPossibleMatch(
  item: BirdIdentification
): BirdPossibleMatchListItem {
  const match = item.match;
  const imageUrls = match ? getBirdMatchImageUrls(match) : [];
  return {
    id: item.birdId,
    _id: match?._id ?? item.birdId,
    name: item.name,
    commonName: item.commonName ?? item.name,
    scientificName: item.scientificName,
    canonicalName: match?.canonicalName,
    birdsLifeId: item.birdsLifeId,
    accuracy: item.confidence,
    similarityScore: item.similarityScore,
    conservationStatus: item.conservationStatus,
    image: imageUrls[0],
    images: imageUrls.length ? imageUrls : undefined,
    match,
  };
}

/** POST /core/ai/identify or identify-sound → IdentifyBirdResult. */
export function normalizeBirdIdentifyResponse(
  response: BirdIdentifyResponse
): IdentifyBirdResult {
  const data = response.data ?? ({} as BirdIdentifyResponse["data"]);
  const confidence =
    response.confidence ?? data.confidence ?? undefined;
  const rawMatches = data.matches ?? [];

  const matches = rawMatches.map((raw) => {
    const normalized = normalizeBirdMatch(
      raw && typeof raw === "object"
        ? (raw as unknown as Record<string, unknown>)
        : {}
    );
    return mapBirdIdentificationMatch(normalized, confidence);
  });

  return {
    imageUrls: data.imageUrls ?? [],
    soundUrls: data.soundUrls,
    matches,
    matchesFoundCount: data.matchesFoundCount ?? matches.length,
    confidence,
    userLocation: response.userLocation ?? data.userLocation,
  };
}

/**
 * Bridge BirdIdentification → legacy MushroomIdentification for interim UI.
 * Remove once screens use BirdIdentification directly (Phase 2).
 */
export function birdIdentificationToLegacy(
  bird: BirdIdentification
): MushroomIdentification {
  const m = bird.match;
  return {
    mushroomId: bird.birdId,
    name: bird.name,
    scientificName: bird.scientificName,
    confidence: bird.confidence,
    similarityScore: bird.similarityScore,
    characteristics: {
      color: bird.characteristics?.dominantColors,
      habitatType: bird.characteristics?.habitat,
      edibility: bird.characteristics?.conservationStatus,
      capShape: bird.characteristics?.birdType,
    },
    match: m as unknown as MushroomIdentification["match"],
  };
}

export function normalizeBirdIdentifyResponseLegacy(
  response: BirdIdentifyResponse
): {
  imageUrls: string[];
  matches: MushroomIdentification[];
  matchesFoundCount: number;
  confidence?: string;
  soundUrls?: string[];
} {
  const result = normalizeBirdIdentifyResponse(response);
  return {
    imageUrls: result.imageUrls,
    soundUrls: result.soundUrls,
    matchesFoundCount: result.matchesFoundCount,
    confidence: result.confidence,
    matches: result.matches.map(birdIdentificationToLegacy),
  };
}

/** Confidence tone for UI copy (Bird API thresholds). */
export type BirdConfidenceTone = "confident" | "cautious" | "uncertain";

export function getBirdConfidenceTone(
  similarityScore: number
): BirdConfidenceTone {
  if (similarityScore >= 0.8) return "confident";
  if (similarityScore >= 0.5) return "cautious";
  return "uncertain";
}

export type BirdConservationTone = "safe" | "caution" | "danger" | "neutral";

export function getBirdConservationTone(
  status?: string | null
): BirdConservationTone {
  if (!status) return "neutral";
  const s = status.toLowerCase();
  if (
    s.includes("endangered") ||
    s.includes("critically") ||
    s.includes("extinct")
  ) {
    return "danger";
  }
  if (
    s.includes("vulnerable") ||
    s.includes("threatened") ||
    s.includes("near threatened")
  ) {
    return "caution";
  }
  if (s.includes("least concern")) return "safe";
  return "neutral";
}

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
