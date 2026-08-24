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

export type EditMushroomTabId =
  | "overview"
  | "safety"
  | "similar"
  | "physical"
  | "habitat";

export const EDIT_MUSHROOM_TABS: { id: EditMushroomTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "safety", label: "Safety" },
  { id: "similar", label: "Similar species" },
  { id: "physical", label: "Physical Traits" },
  { id: "habitat", label: "Habitat and distribution" },
];

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

export function buildMushroomUpdatePayload(
  formData: EditableMushroomData
): Record<string, unknown> {
  const summary =
    formData.summary?.trim() ||
    formData.detailedDescription?.trim() ||
    undefined;
  const name = formData.commonName?.trim() || undefined;
  const commonNames = name ? [name] : undefined;
  const imageUrls = (formData.images || [])
    .filter((p) => !p.isDeleted && p.uri)
    .map((p) => p.uri);

  const classification = formData.scientificClassification;
  const hasClassification =
    classification &&
    Object.values(classification).some(
      (v) => typeof v === "string" && v.trim()
    );

  const geoHotspots = splitList(formData.distributionHotspotsText);

  const collections = normalizeCollectionIds(
    formData._collections,
    formData._collection
  );

  const raw: Record<string, unknown> = {
    name,
    commonNames,
    scientificName: formData.scientificName?.trim() || undefined,
    summary,
    detailedDescription: summary,
    customLocation: formData.customLocation ?? "",
    gpsLocation: formData.gpsLocation,
    _archetype: formData._archetype,
    ...(collections.length > 0 ? { _collections: collections } : {}),
    edibility: formData.edibility?.trim() || undefined,
    toxicitySeverity: formData.toxicitySeverity?.trim() || undefined,
    psychoactive: formData.psychoactive?.trim() || undefined,
    symptoms: formData.symptoms?.trim() || undefined,
    capShape: formData.capShape?.trim() || undefined,
    capSurface: splitList(formData.capSurface),
    capColor: formData.capColor?.trim() || undefined,
    undersideType: formData.undersideType?.trim() || undefined,
    stemPresence: formData.stemPresence?.trim() || undefined,
    stemSurface: splitList(formData.stemSurface),
    ringPresent: formData.ringPresent?.trim() || undefined,
    volvaPresent: formData.volvaPresent?.trim() || undefined,
    capDiameterRange: formData.capDiameterRange?.trim() || undefined,
    growthPattern: formData.growthPattern?.trim() || undefined,
    habitatType: splitList(formData.habitatType),
    geographicDistribution: splitList(formData.geographicDistribution),
    commonlyFoundIn: splitList(formData.geographicDistribution),
    geoRegionTags: geoHotspots,
    lengthRange: formData.lengthRange?.trim() || undefined,
    wingspanRange: formData.wingspanRange?.trim() || undefined,
    weightRange: formData.weightRange?.trim() || undefined,
    dominantColors: splitList(formData.dominantColors),
    flightPattern: splitList(formData.flightPattern),
    flightAltitude: splitList(formData.flightAltitude),
    conservationStatus: formData.conservationStatus?.trim() || undefined,
    birdType: splitList(formData.birdType),
    diet: splitList(formData.diet),
    keyIdentificationMarks: splitList(formData.keyIdentificationMarks),
    ...(formData.bestTimeToWatch?.trim() ||
    formData.preferredLocations?.trim()
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
    ...(imageUrls.length > 0 ? { imageUrls } : {}),
  };

  return Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== undefined)
  );
}

export type SpecimenAddOptions = {
  isIdentified?: boolean;
  isWishlisted?: boolean;
  collectionIds?: string | string[];
  /** @deprecated Prefer `collectionIds` */
  _collection?: string;
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

/** POST /core/specimen/add — merges archetype data with edited form fields. */
export function buildMushroomSpecimenAddPayload(
  archetypeRaw: Record<string, unknown>,
  formData: EditableMushroomData,
  archetypeId: string,
  options: SpecimenAddOptions = {}
): AddMushroomSpecimenRequest {
  const edited = buildMushroomUpdatePayload(formData);

  const canonicalName =
    (typeof archetypeRaw.canonicalName === "string" &&
      archetypeRaw.canonicalName.trim()) ||
    (typeof archetypeRaw.scientificName === "string" &&
      archetypeRaw.scientificName.trim()) ||
    formData.scientificName?.trim() ||
    formData.commonName?.trim() ||
    "";

  const scientificName =
    formData.scientificName?.trim() ||
    (typeof archetypeRaw.scientificName === "string" &&
      archetypeRaw.scientificName.trim()) ||
    canonicalName;

  const imageUrls =
    ((edited.imageUrls as string[] | undefined) ?? []).filter(Boolean).length >
    0
      ? (edited.imageUrls as string[]) ?? []
      : getArchetypeImageUrls(archetypeRaw);

  if (imageUrls.length === 0) {
    throw new Error("At least one image is required to save this mushroom.");
  }

  const gbifId = resolveSpecimenGbifId(archetypeRaw);
  if (!gbifId) {
    throw new Error("GBIF id is required to save this mushroom.");
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
  const commonNames = commonName ? [commonName] : undefined;

  const collections = normalizeCollectionIds(
    options.collectionIds,
    options._collection
  );

  return {
    ...(edited as unknown as AddMushroomSpecimenRequest),
    scientificName,
    canonicalName,
    gbifId,
    mindatId: resolveSpecimenMindatId(archetypeRaw),
    imageUrls,
    commonNames,
    name: commonName,
    _archetype: archetypeId,
    isIdentified: options.isIdentified ?? false,
    isWishlisted: options.isWishlisted ?? false,
    ...(collections.length > 0 ? { _collections: collections } : {}),
  };
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
