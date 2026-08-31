/**
 * Mushrooms API — frontend types aligned with Trackzio mushrooms core module.
 */

import type {
  FruitingSeason,
  LookAlike,
  MushroomMatch,
  ScientificClassification,
  CleaningTips,
  StorageInfo,
  GemTreatment,
  Stability,
  Synonym,
} from "../services/api/features/core.api.types";

export type {
  LookAlike,
  ScientificClassification,
  FruitingSeason,
  MushroomMatch,
};

export type Edibility = "edible" | "inedible" | "toxic" | "deadly";
export type ToxicitySeverity = "none" | "mild" | "severe" | "potentially fatal";
export type Psychoactive = "yes" | "no";

export interface MushroomListItem {
  archetypeId: string;
  /** Primary display label derived from commonNames / genusCommonNames. */
  commonName: string;
  commonNames?: string[];
  genusCommonNames?: string[];
  scientificName: string;
  verbatimScientificName?: string;
  canonicalName?: string;
  imageUrls: string[];
  defaultImageUrl?: string;
  summary?: string;
  detailedDescription?: string;
  commonlyFoundIn: string[];
  geographicDistribution?: string[];
  edibility?: Edibility | string;
  toxicitySeverity?: ToxicitySeverity | string;
  psychoactive?: Psychoactive | string;
  isIdentified: boolean;
  isWishlisted: boolean;
  similarityScore?: number;
  /** Bird API fields (Phase 2) */
  birdsLifeId?: string;
  conservationStatus?: string;
  birdType?: string[];
  soundUrls?: string[];
  /** Legacy archetype entry type from API (minerals=0, rocks=7); optional on mushrooms API */
  entryType?: number;
}

export interface MushroomDetail extends MushroomListItem {
  _id: string;
  gbifId?: string;
  lookAlikes?: LookAlike[];
  scientificClassification?: ScientificClassification;
  capColor?: string;
  capDiameterRange?: string;
  capShape?: string;
  capSurface?: string[];
  undersideType?: string;
  stemPresence?: string;
  stemSurface?: string[];
  stemHeightRange?: string;
  ringPresent?: string;
  volvaPresent?: string;
  growthPattern?: string;
  habitatType?: string[];
  symptoms?: string;
  warningBanner?: string | null;
  wikipediaLink?: string;
  wikipediaUrl?: string;
  fruitingSeason?: FruitingSeason;
  distributionHotspots?: Record<string, unknown>;
  userNotes?: string;
  customLocation?: string;
  isOwned?: boolean;
  archetypeId: string;
  /** Legacy mineral / full archetype fields used by detail screens */
  description?: string;
  isGem?: boolean;
  formula?: string;
  elements?: string[];
  color?: string[];
  crystalSystem?: string[];
  mohsHardness?: string;
  density?: number;
  lusture?: string[];
  tenacity?: string[];
  transparency?: string[];
  danaClass?: string | null;
  strunzClass?: string | null;
  scratchResistance?: string;
  toughness?: string;
  radioactivity?: string;
  magnetism?: string;
  healthRisks?: string;
  rarityScore?: number;
  avgPricePerCarat?: string;
  nameOrigin?: string;
  rimin?: number;
  rimax?: number;
  amplification?: string;
  chakra?: string[];
  metaphysicalQualities?: string[];
  worksWellWith?: string[];
  revitalizeCharging?: string;
  revitalizeCleansing?: string;
  cleaningTips?: CleaningTips | null;
  storage?: StorageInfo;
  gemTreatment?: GemTreatment;
  stability?: Stability | null;
  confusedWith?: unknown[];
  varieties?: unknown[];
  synonyms?: Synonym[];
  /** Bird API — similar species (mapped from similarBirds) */
  flightPattern?: string[];
  flightAltitude?: string[];
  keyIdentificationMarks?: string[];
  dominantColors?: string[];
  diet?: string[];
  wingspanRange?: string;
  lengthRange?: string;
  weightRange?: string;
  birdWatchingTips?: import("../services/api/features/bird.api.types").BirdWatchingTips;
  rangeDetails?: import("../services/api/features/bird.api.types").BirdRangeDetails;
  profile?: import("../services/api/features/bird.api.types").BirdProfileDetails;
}

export interface MushroomListResponse {
  error: boolean;
  data: MushroomListItem[];
  pagination: {
    pageNo: number;
    pageSize: number;
    totalCount: number;
    totalPages?: number;
  };
}

export interface MushroomDetailResponse {
  error: boolean;
  data: MushroomDetail;
  reason?: string;
}

/** POST /core/archetypes/fetchAll & specimen fetchAll filter body. */
export interface MushroomFilterRequest {
  edibility?: string[];
  customLocation?: string[];
  toxicitySeverity?: string[];
  psychoactive?: string[];
  capShape?: string[];
  capSurface?: string[];
  undersideType?: string[];
  stemPresence?: string[];
  stemSurface?: string[];
  ringPresent?: string[];
  volvaPresent?: string[];
  habitatType?: string[];
  geographicDistribution?: string[];
}

/** GET /core/archetypes/filteritems query flags. */
export interface MushroomFilterParams {
  edibility?: boolean;
  customLocation?: boolean;
  toxicitySeverity?: boolean;
  psychoactive?: boolean;
  capShape?: boolean;
  capSurface?: boolean;
  undersideType?: boolean;
  stemPresence?: boolean;
  stemSurface?: boolean;
  ringPresent?: boolean;
  volvaPresent?: boolean;
  habitatType?: boolean;
  geographicDistribution?: boolean;
}

export interface MushroomIdentification {
  mushroomId: string;
  name: string;
  scientificName: string;
  confidence: number;
  similarityScore: number;
  edibility?: string;
  toxicitySeverity?: string;
  psychoactive?: string;
  warningBanner?: string | null;
  characteristics?: {
    color?: string;
    edibility?: string;
    toxicitySeverity?: string;
    psychoactive?: string;
    capShape?: string;
    habitatType?: string;
  };
  match?: MushroomMatch;
}

export interface IdentifyMushroomResult {
  imageUrls: string[];
  matches: MushroomIdentification[];
  matchesFoundCount: number;
}

export type { MushroomArchetypeStats } from "../services/api/features/core.api.types";

/** Phase 7 bridge aliases — prefer birds.types where available */
export type BirdCatalogueItem = MushroomListItem;
export type BirdSpecimenDetail = MushroomDetail;
export type BirdIdentificationResult = IdentifyMushroomResult;
