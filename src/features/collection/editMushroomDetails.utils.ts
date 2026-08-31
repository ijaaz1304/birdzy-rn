import {
  FruitingSeason,
  LookAlike,
  ScientificClassification,
  AddMushroomSpecimenRequest,
} from "../../services/api/features/core.api.types";
import { MushroomPhoto } from "../../types/mushroom-media.types";
import { getArchetypeImageUrls } from "../../utils/mushroomApiMappers";
import { getPrimaryCommonName } from "../../utils/mushroomDisplayUtils";
import { normalizeCollectionIds } from "./collection.utils";

export type EditMushroomTabId = "overview" | "physical" | "habitat";

export const EDIT_BIRD_TABS: { id: EditMushroomTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "physical", label: "Identification" },
  { id: "habitat", label: "Habitat & Diet" },
];

export type EditableMushroomData = {
  commonName?: string;
  scientificName?: string;
  detailedDescription?: string;
  summary?: string;
  customLocation?: string;
  gpsLocation?: { latitude: number; longitude: number };
  images: MushroomPhoto[];
  scientificClassification?: ScientificClassification;
  edibility?: string;
  toxicitySeverity?: string;
  psychoactive?: string;
  symptoms?: string;
  capShape?: string;
  capSurface?: string;
  capColor?: string;
  undersideType?: string;
  stemPresence?: string;
  stemSurface?: string;
  ringPresent?: string;
  volvaPresent?: string;
  capDiameterRange?: string;
  growthPattern?: string;
  habitatType?: string;
  geographicDistribution?: string;
  fruitingSeasonText?: string;
  distributionHotspotsText?: string;
  lookAlikes?: LookAlike[];
  /** Bird specimen fields */
  lengthRange?: string;
  wingspanRange?: string;
  weightRange?: string;
  dominantColors?: string;
  flightPattern?: string;
  flightAltitude?: string;
  conservationStatus?: string;
  birdType?: string;
  diet?: string;
  keyIdentificationMarks?: string;
  bestTimeToWatch?: string;
  preferredLocations?: string;
  _archetype?: string;
  _collection?: string;
  _collections?: string[];
};

function joinList(value?: string[] | string | null): string {
  if (!value) return "";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return String(value);
}

function splitList(text?: string): string[] | undefined {
  const trimmed = text?.trim();
  if (!trimmed) return undefined;
  const parts = trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

function formatFruitingSeason(fs?: FruitingSeason | null): string {
  if (!fs) return "";
  if (
    fs.seasonal_distribution &&
    typeof fs.seasonal_distribution === "object"
  ) {
    return Object.entries(fs.seasonal_distribution)
      .map(([season, count]) => `${season}: ${count}`)
      .join(", ");
  }
  if (fs.monthly_distribution && typeof fs.monthly_distribution === "object") {
    return Object.entries(fs.monthly_distribution)
      .map(([month, count]) => `${month}: ${count}`)
      .join(", ");
  }
  if (typeof fs.total_observations === "number") {
    return `Total observations: ${fs.total_observations}`;
  }
  return "";
}

function formatDistributionHotspots(
  hotspots?: Record<string, unknown> | null
): string {
  if (!hotspots || typeof hotspots !== "object") return "";
  return Object.entries(hotspots)
    .map(([region, count]) => `${region}: ${count}`)
    .join(", ");
}

export function parseEditableMushroomData(
  raw: Record<string, unknown>,
  mushroomId?: string
): EditableMushroomData {
  const classification =
    raw.scientificClassification &&
    typeof raw.scientificClassification === "object"
      ? (raw.scientificClassification as ScientificClassification)
      : undefined;

  return {
    commonName:
      getPrimaryCommonName({
        commonNames: raw.commonNames,
        genusCommonNames: raw.genusCommonNames,
        commonName:
          typeof raw.commonName === "string" ? raw.commonName : undefined,
        name: typeof raw.name === "string" ? raw.name : undefined,
      }) || "",
    scientificName:
      typeof raw.scientificName === "string" ? raw.scientificName : "",
    detailedDescription:
      (typeof raw.detailedDescription === "string" &&
        raw.detailedDescription) ||
      (typeof raw.summary === "string" && raw.summary) ||
      "",
    summary:
      (typeof raw.summary === "string" && raw.summary) ||
      (typeof raw.detailedDescription === "string" &&
        raw.detailedDescription) ||
      "",
    customLocation:
      typeof raw.customLocation === "string" ? raw.customLocation : "",
    gpsLocation: raw.gpsLocation as EditableMushroomData["gpsLocation"],
    images: Array.isArray(raw.images) ? (raw.images as MushroomPhoto[]) : [],
    scientificClassification: classification,
    edibility: typeof raw.edibility === "string" ? raw.edibility : undefined,
    toxicitySeverity:
      typeof raw.toxicitySeverity === "string"
        ? raw.toxicitySeverity
        : undefined,
    psychoactive:
      typeof raw.psychoactive === "string" ? raw.psychoactive : undefined,
    symptoms: typeof raw.symptoms === "string" ? raw.symptoms : undefined,
    capShape: typeof raw.capShape === "string" ? raw.capShape : undefined,
    capSurface: joinList(raw.capSurface as string[] | string | undefined),
    capColor: typeof raw.capColor === "string" ? raw.capColor : undefined,
    undersideType:
      typeof raw.undersideType === "string" ? raw.undersideType : undefined,
    stemPresence:
      typeof raw.stemPresence === "string" ? raw.stemPresence : undefined,
    stemSurface: joinList(raw.stemSurface as string[] | string | undefined),
    ringPresent:
      typeof raw.ringPresent === "string" ? raw.ringPresent : undefined,
    volvaPresent:
      typeof raw.volvaPresent === "string" ? raw.volvaPresent : undefined,
    capDiameterRange:
      typeof raw.capDiameterRange === "string"
        ? raw.capDiameterRange
        : undefined,
    growthPattern:
      typeof raw.growthPattern === "string" ? raw.growthPattern : undefined,
    habitatType: joinList(raw.habitatType as string[] | string | undefined),
    geographicDistribution: joinList(
      (raw.geographicDistribution as string[] | undefined) ??
        (raw.commonlyFoundIn as string[] | undefined)
    ),
    fruitingSeasonText: formatFruitingSeason(
      raw.fruitingSeason as FruitingSeason | undefined
    ),
    distributionHotspotsText: formatDistributionHotspots(
      raw.distributionHotspots as Record<string, unknown> | undefined
    ),
    lengthRange:
      typeof raw.lengthRange === "string" ? raw.lengthRange : undefined,
    wingspanRange:
      typeof raw.wingspanRange === "string" ? raw.wingspanRange : undefined,
    weightRange:
      typeof raw.weightRange === "string" ? raw.weightRange : undefined,
    dominantColors: joinList(
      raw.dominantColors as string[] | string | undefined
    ),
    flightPattern: joinList(
      raw.flightPattern as string[] | string | undefined
    ),
    flightAltitude: joinList(
      raw.flightAltitude as string[] | string | undefined
    ),
    conservationStatus:
      typeof raw.conservationStatus === "string"
        ? raw.conservationStatus
        : undefined,
    birdType: joinList(raw.birdType as string[] | string | undefined),
    diet: joinList(raw.diet as string[] | string | undefined),
    keyIdentificationMarks: joinList(
      raw.keyIdentificationMarks as string[] | string | undefined
    ),
    bestTimeToWatch:
      typeof (raw.birdWatchingTips as { bestTime?: string } | undefined)
        ?.bestTime === "string"
        ? (raw.birdWatchingTips as { bestTime: string }).bestTime
        : undefined,
    preferredLocations:
      typeof (
        raw.birdWatchingTips as { preferredLocations?: string } | undefined
      )?.preferredLocations === "string"
        ? (raw.birdWatchingTips as { preferredLocations: string })
            .preferredLocations
        : undefined,
    lookAlikes: Array.isArray(raw.lookAlikes)
      ? (raw.lookAlikes as LookAlike[])
      : [],
    _archetype:
      (typeof raw._archetype === "string" && raw._archetype) || mushroomId,
    _collections: normalizeCollectionIds(
      raw._collections as string[] | undefined,
      typeof raw._collection === "string" ? raw._collection : undefined,
      typeof (raw.collection as { collectionId?: string } | undefined)
        ?.collectionId === "string"
        ? (raw.collection as { collectionId: string }).collectionId
        : undefined
    ),
    _collection:
      normalizeCollectionIds(
        raw._collections as string[] | undefined,
        typeof raw._collection === "string" ? raw._collection : undefined
      )[0] ??
      (typeof raw._collection === "string" ? raw._collection : undefined),
  };
}

export function flattenBirdSpecimenUpdate(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const nestedKeys = [
    "scientificClassification",
    "birdWatchingTips",
    "rangeDetails",
    "potentialHazards",
  ] as const;

  const allowed = new Set([
    "commonName",
    "scientificName",
    "summary",
    "wikipediaLink",
    "birdType",
    "customLocation",
    "flightPattern",
    "flightSpeed",
    "flightAltitude",
    "diet",
    "habitat",
    "lifeExpectancyInWild",
    "conservationStatus",
    "funFacts",
    "lengthRange",
    "wingspanRange",
    "weightRange",
    "keyIdentificationMarks",
    "dominantColors",
    "sexDifferences",
    "isIdentified",
    "isOwned",
    "matchScore",
    "_collections",
    "_archetype",
    "scientificClassification.kingdom",
    "scientificClassification.phylum",
    "scientificClassification.class",
    "scientificClassification.order",
    "scientificClassification.family",
    "scientificClassification.genus",
    "scientificClassification.species",
    "birdWatchingTips.bestTime",
    "birdWatchingTips.preferredLocations",
    "birdWatchingTips.behavioralCues",
    "potentialHazards.toHumans",
    "potentialHazards.toPets",
    "potentialHazards.tobirds",
    "rangeDetails.yearRound",
    "rangeDetails.migration",
    "rangeDetails.breeding",
    "rangeDetails.nonBreeding",
  ]);

  const out: Record<string, unknown> = {};
  const assign = (key: string, value: unknown) => {
    if (!allowed.has(key)) return;
    if (value === undefined || value === "") return;
    if (Array.isArray(value) && value.length === 0) return;
    out[key] = value;
  };

  for (const prefix of nestedKeys) {
    const nested = payload[prefix];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      for (const [key, value] of Object.entries(
        nested as Record<string, unknown>
      )) {
        assign(`${prefix}.${key}`, value);
      }
    }
  }

  if (payload.isWishlisted === false) {
    out.isWishlisted = false;
  }

  for (const [key, value] of Object.entries(payload)) {
    if ((nestedKeys as readonly string[]).includes(key)) continue;
    if (key === "isWishlisted") continue;
    assign(key, value);
  }

  return out;
}

export function buildMushroomUpdatePayload(
  formData: EditableMushroomData
): Record<string, unknown> {
  const summary =
    formData.summary?.trim() ||
    formData.detailedDescription?.trim() ||
    undefined;
  const collections = normalizeCollectionIds(
    formData._collections,
    formData._collection
  );
  const classification = formData.scientificClassification;
  const hasClassification =
    classification &&
    Object.values(classification).some(
      (v) => typeof v === "string" && v.trim()
    );

  return flattenBirdSpecimenUpdate({
    commonName: formData.commonName?.trim() || undefined,
    scientificName: formData.scientificName?.trim() || undefined,
    summary,
    customLocation: formData.customLocation ?? "",
    _archetype: formData._archetype,
    ...(collections.length > 0 ? { _collections: collections } : {}),
    lengthRange: formData.lengthRange?.trim() || undefined,
    wingspanRange: formData.wingspanRange?.trim() || undefined,
    weightRange: formData.weightRange?.trim() || undefined,
    dominantColors: splitList(formData.dominantColors),
    flightPattern: splitList(formData.flightPattern),
    flightAltitude: splitList(formData.flightAltitude),
    conservationStatus: formData.conservationStatus?.trim() || undefined,
    birdType: splitList(formData.birdType),
    diet: splitList(formData.diet),
    habitat: splitList(formData.habitatType),
    keyIdentificationMarks: splitList(formData.keyIdentificationMarks),
    ...(formData.bestTimeToWatch?.trim() || formData.preferredLocations?.trim()
      ? {
          birdWatchingTips: {
            ...(formData.bestTimeToWatch?.trim()
              ? { bestTime: formData.bestTimeToWatch.trim() }
              : {}),
            ...(formData.preferredLocations?.trim()
              ? { preferredLocations: formData.preferredLocations.trim() }
              : {}),
          },
        }
      : {}),
    ...(hasClassification ? { scientificClassification: classification } : {}),
  });
}

export type SpecimenAddOptions = {
  isIdentified?: boolean;
  isWishlisted?: boolean;
  collectionIds?: string | string[];
  /** @deprecated Prefer `collectionIds` */
  _collection?: string;
  comment?: string;
  userCapturedSounds?: string[];
  userCapturedImages?: string[];
};

export function resolveSpecimenGbifId(raw: Record<string, unknown>): string {
  const gbif = raw.gbifId ?? raw.gbif_id;
  if (typeof gbif === "string" && gbif.trim()) return gbif.trim();
  if (typeof gbif === "number" && Number.isFinite(gbif)) return String(gbif);

  const mindat = raw.mindatId ?? raw.mindat_id;
  if (typeof mindat === "number" && Number.isFinite(mindat) && mindat > 0) {
    return String(mindat);
  }
  if (typeof mindat === "string" && mindat.trim()) return mindat.trim();
  return "";
}

export function resolveSpecimenMindatId(raw: Record<string, unknown>): number {
  const mindat = raw.mindatId ?? raw.mindat_id ?? raw.gbifId ?? raw.gbif_id;
  if (typeof mindat === "number" && Number.isFinite(mindat)) {
    return mindat;
  }
  if (typeof mindat === "string" && mindat.trim()) {
    const parsed = Number.parseInt(mindat, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

/** POST /core/specimen/add — bird required fields: scientificName, imageUrls, _collections. */
export function buildMushroomSpecimenAddPayload(
  archetypeRaw: Record<string, unknown>,
  formData: EditableMushroomData,
  archetypeId: string,
  options: SpecimenAddOptions = {}
): AddMushroomSpecimenRequest {
  const edited = buildMushroomUpdatePayload(formData);

  const scientificName =
    formData.scientificName?.trim() ||
    (typeof archetypeRaw.scientificName === "string" &&
      archetypeRaw.scientificName.trim()) ||
    formData.commonName?.trim() ||
    (typeof archetypeRaw.commonName === "string" &&
      archetypeRaw.commonName.trim()) ||
    "";

  const imageUrls = (formData.images || [])
    .filter((p) => !p.isDeleted && p.uri)
    .map((p) => p.uri);
  const resolvedImageUrls =
    imageUrls.length > 0 ? imageUrls : getArchetypeImageUrls(archetypeRaw);

  if (resolvedImageUrls.length === 0) {
    throw new Error("At least one image is required to save this bird.");
  }

  const commonName =
    formData.commonName?.trim() ||
    getPrimaryCommonName({
      commonNames: archetypeRaw.commonNames,
      genusCommonNames: archetypeRaw.genusCommonNames,
      commonName:
        typeof archetypeRaw.commonName === "string"
          ? archetypeRaw.commonName
          : undefined,
    });

  const collections = normalizeCollectionIds(
    options.collectionIds,
    options._collection,
    formData._collections,
    formData._collection
  );

  const birdsLifeId =
    (typeof archetypeRaw.birdsLifeId === "string" &&
      archetypeRaw.birdsLifeId.trim()) ||
    undefined;
  const wikipediaLink =
    (typeof archetypeRaw.wikipediaLink === "string" &&
      archetypeRaw.wikipediaLink.trim()) ||
    (typeof archetypeRaw.wikipediaUrl === "string" &&
      archetypeRaw.wikipediaUrl.trim()) ||
    undefined;
  const soundUrls = Array.isArray(archetypeRaw.soundUrls)
    ? (archetypeRaw.soundUrls as string[]).filter(Boolean)
    : undefined;
  const userCapturedSounds =
    options.userCapturedSounds ??
    (Array.isArray(archetypeRaw.userCapturedSounds)
      ? (archetypeRaw.userCapturedSounds as string[]).filter(Boolean)
      : undefined);
  const userCapturedImages =
    options.userCapturedImages ??
    (Array.isArray(archetypeRaw.userCapturedImages)
      ? (archetypeRaw.userCapturedImages as string[]).filter(Boolean)
      : undefined);

  const payload: Record<string, unknown> = {
    scientificName,
    imageUrls: resolvedImageUrls,
    defaultImageUrl: resolvedImageUrls[0],
    commonName: commonName || undefined,
    summary: edited.summary,
    wikipediaLink,
    birdsLifeId,
    soundUrls: soundUrls?.length ? soundUrls : undefined,
    userCapturedSounds: userCapturedSounds?.length
      ? userCapturedSounds
      : undefined,
    userCapturedImages: userCapturedImages?.length
      ? userCapturedImages
      : undefined,
    comment: options.comment,
    _archetype: archetypeId,
    isIdentified: options.isIdentified ?? false,
    isWishlisted: options.isWishlisted ?? false,
    ...(collections.length > 0 ? { _collections: collections } : {}),
    birdType: edited.birdType,
    flightPattern: edited.flightPattern,
    flightAltitude: edited.flightAltitude,
    diet: edited.diet,
    habitat: edited.habitat,
    conservationStatus: edited.conservationStatus,
    lengthRange: edited.lengthRange,
    wingspanRange: edited.wingspanRange,
    weightRange: edited.weightRange,
    dominantColors: edited.dominantColors,
    keyIdentificationMarks: edited.keyIdentificationMarks,
    customLocation: edited.customLocation,
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined)
  ) as unknown as AddMushroomSpecimenRequest;
}

export function buildMushroomSpecimenAddFromRaw(
  archetypeRaw: Record<string, unknown>,
  archetypeId: string,
  options: SpecimenAddOptions = {}
): AddMushroomSpecimenRequest {
  return buildMushroomSpecimenAddPayload(
    archetypeRaw,
    parseEditableMushroomData(archetypeRaw, archetypeId),
    archetypeId,
    options
  );
}

export function toDropdownOptions(
  values?: string[] | null
): { label: string; value: string }[] {
  return (values ?? []).map((value) => ({ label: value, value }));
}
