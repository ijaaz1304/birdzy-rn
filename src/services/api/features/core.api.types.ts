/**
 * Core Module API Types
 * Types matching the backend API structure
 */

import { BackendApiResponse } from "./auth.api.types";

export interface LookAlike {
  speciesId?: string;
  scientificName: string;
  commonNames?: string[];
  genusCommonNames?: string[];
  isDangerous?: boolean;
  keyDifferences?: string;
  imageUrls?: string[];
  similarityScore?: number;
}

export interface ScientificClassification {
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
}

export interface FruitingSeason {
  total_observations?: number;
  monthly_distribution?: Record<string, number>;
  seasonal_distribution?: Record<string, number>;
}

/**
 * MushroomArchetype / identification match (mushrooms API).
 */
export interface MushroomMatch {
  _id: string;
  custom_id?: string;
  archetypeId?: string;
  gbifId?: string;
  mindatId?: number;
  __v?: number;
  amplification?: string;
  avgPricePerCarat?: string;
  canonicalName?: string;
  chakra?: string[];
  cleaningTips?: CleaningTips | null;
  cleavageType?: string;
  color?: string[];
  capColor?: string;
  capDiameterRange?: string;
  capShape?: string;
  capSurface?: string[];
  commonNames?: string[];
  genusCommonNames?: string[];
  verbatimScientificName?: string;
  commonlyFoundIn?: string[];
  geographicDistribution?: string[];
  confusedWith?: any[];
  lookAlikes?: LookAlike[];
  createdAt?: string;
  crystalSystem?: string[];
  danaClass?: string | null;
  density?: number;
  detailedDescription?: string;
  summary?: string;
  durability?: string | null;
  elementWeights?: Record<string, number>;
  elements?: string[];
  entryType?: number;
  formula?: string;
  fractureType?: string;
  gemTreatment?: GemTreatment;
  geoRegionTags?: string[];
  images?: string[];
  imageUrls?: string[];
  isGem?: boolean;
  lastUpdated?: string;
  lusture?: string[];
  magnetism?: string;
  members?: any[];
  metaphysicalQualities?: string[];
  mhMax?: number;
  mhMin?: number;
  mindatUrl?: string;
  mineralComposition?: any[];
  mohsHardness?: string;
  nameOrigin?: string;
  parentDtl?: {
    parentId: number;
    parentName: string;
    parentEntryType: number;
    parentUrl: string;
  };
  polytypes?: any[];
  radioactivity?: string;
  rarityScore?: number;
  recordType?: string[];
  revitalizeCharging?: string;
  revitalizeCleansing?: string;
  rimax?: number;
  rimin?: number;
  scientificName: string;
  scientificClassification?: ScientificClassification;
  scratchResistance?: string;
  stability?: Stability | null;
  streak?: string;
  strunzClass?: string | null;
  synonyms?: Synonym[];
  tenacity?: string[];
  toughness?: string;
  transparency?: string[];
  updatedAt?: string;
  varieties?: any[];
  wikipediaUrl?: string;
  wikipediaLink?: string;
  worksWellWith?: string[];
  zodiacSign?: string[];
  storage?: StorageInfo;
  healthRisks?: string;
  symptoms?: string;
  non_specified_percentage?: number;
  similarityScore: number;
  edibility?: string;
  toxicitySeverity?: string;
  psychoactive?: string;
  warningBanner?: string | null;
  growthPattern?: string;
  habitatType?: string[];
  ringPresent?: string;
  stemPresence?: string;
  stemSurface?: string[];
  stemHeightRange?: string;
  undersideType?: string;
  volvaPresent?: string;
  fruitingSeason?: FruitingSeason;
  alternativeNames?: string[];
}

/**
 * AI Identification Response
 */
export interface IdentifyResponse extends BackendApiResponse {
  data: {
    imageUrls: string[];
    matchesFoundCount: number;
    matches: MushroomMatch[];
  };
}

/**
 * AI Chat Response
 */
export interface ChatResponse extends BackendApiResponse {
  data: {
    reply: string;
  };
}

/**
 * Filter Items Response
 */
export interface FilterItemsResponse extends BackendApiResponse {
  data: {
    [key: string]:
      | string[]
      | {
          lightStability?: string[];
          heatStability?: string[];
          chemicalsStability?: string[];
          waterOrHumidityStability?: string[];
          thermalShockStability?: string[];
        };
  };
}

/**
 * MushroomSpecimen Data (full structure)
 * Matches the exact API response structure from GET /core/specimen/getDetails/:id
 */
export interface MushroomSpecimen {
  _id: string;
  mindatId: number;
  canonicalName: string;
  commonNames?: string[];
  genusCommonNames?: string[];
  scientificName: string;
  formula?: string;
  elements?: string[];
  elementWeights?: Record<string, number>;
  crystalSystem?: string[];
  mohsHardness?: string;
  mhMin?: number;
  mhMax?: number;
  density?: number;
  lusture?: string[];
  tenacity?: string[];
  cleavageType?: string;
  fractureType?: string;
  streak?: string;
  transparency?: string[];
  color?: string[];
  danaClass?: string | null;
  strunzClass?: string | null;
  entryType: number;
  parentDtl?: {
    parentId: number;
    parentName: string;
    parentEntryType: number;
    parentUrl: string;
  };
  members?: any[];
  varieties?: any[];
  polytypes?: any[];
  synonyms?: Synonym[];
  detailedDescription?: string;
  nameOrigin?: string;
  mineralComposition?: any[];
  commonlyFoundIn?: string[];
  geoRegionTags?: string[];
  confusedWith?: any[];
  isGem?: boolean;
  rimin?: number;
  rimax?: number;
  durability?: string | null;
  gemTreatment?: GemTreatment;
  scratchResistance?: string;
  toughness?: string;
  stability?: Stability | null;
  healthRisks?: string;
  chakra?: string[];
  zodiacSign?: string[];
  metaphysicalQualities?: string[];
  worksWellWith?: string[];
  revitalizeCharging?: string;
  revitalizeCleansing?: string;
  amplification?: string;
  cleaningTips?: CleaningTips | null;
  rarityScore?: number;
  avgPricePerCarat?: string;
  images?: string[];
  mindatUrl?: string;
  wikipediaUrl?: string;
  storage?: StorageInfo;
  radioactivity?: string;
  magnetism?: string;
  recordType?: string[];
  lastUpdated?: string;
  _archetype?: string | null;
  _user: string;
  userId: string;
  userNotes?: string;
  customLocation?: string;
  gpsLocation?: {
    latitude: number;
    longitude: number;
  };
  isIdentified: boolean;
  isWishlisted: boolean;
  rating?: number | null;
  comment?: string | null;
  /** @deprecated Prefer `_collections` */
  _collection?: string;
  _collections?: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  id: string;
  collection?: {
    collectionId: string;
    name: string;
    description: string;
  };
}

/**
 * MushroomSpecimen List Item (summary)
 */
export interface MushroomSpecimenListItem {
  specimenId: string;
  /** MushroomArchetype (mushroom) ID - required for wishlist remove API */
  _archetype?: string;
  scientificName: string;
  commonNames?: string[];
  genusCommonNames?: string[];
  canonicalName?: string;
  imageUrls: string[];
  isIdentified: boolean;
  isWishlisted: boolean;
  collection: {
    collectionId: string;
    name: string;
    description: string;
  };
  entryType: number;
  isGem?: boolean;
}

/**
 * MushroomSpecimen List Response
 */
export interface MushroomSpecimenListResponse extends BackendApiResponse {
  data: MushroomSpecimenListItem[];
  pagination: {
    pageNo: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

/**
 * MushroomSpecimen Details Response
 */
export interface MushroomSpecimenDetailResponse extends BackendApiResponse {
  data: MushroomSpecimen;
}

/**
 * MushroomSpecimen Add Request
 */
export interface AddMushroomSpecimenRequest {
  scientificName: string; // Required
  canonicalName: string; // Required
  /** GBIF taxon key from archetype / identification match */
  gbifId: string; // Required
  mindatId: number; // Required
  imageUrls: string[]; // Required, at least one
  commonNames?: string[];
  genusCommonNames?: string[];
  /** Mushrooms API display name */
  name?: string;
  detailedDescription?: string;
  /** Mushrooms API short description */
  summary?: string;
  isIdentified?: boolean;
  isWishlisted?: boolean;
  userNotes?: string;
  customLocation?: string;
  commonlyFoundIn?: string[];
  gpsLocation?: {
    latitude: number;
    longitude: number;
  };
  wikipediaUrl?: string;
  avgPricePerCarat?: string;
  amplification?: string;
  chakra?: string[];
  cleaningTips?: CleaningTips;
  cleavageType?: string;
  color?: string[];
  crystalSystem?: string[];
  danaClass?: string;
  density?: number;
  durability?: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "UNKNOWN";
  elementWeights?: Record<string, number>;
  elements?: string[];
  entryType?: number;
  formula?: string;
  fractureType?: string;
  gemTreatment?: GemTreatment;
  geoRegionTags?: string[];
  isGem?: boolean;
  lusture?: string[];
  magnetism?: string;
  metaphysicalQualities?: string[];
  mhMax?: number;
  mhMin?: number;
  mindatUrl?: string;
  mineralComposition?: any[];
  mohsHardness?: string;
  nameOrigin?: string;
  radioactivity?: string;
  rarityScore?: number;
  recordType?: string[];
  revitalizeCharging?: string;
  revitalizeCleansing?: string;
  rimax?: number;
  rimin?: number;
  scratchResistance?: string;
  stability?: Stability;
  streak?: string;
  strunzClass?: string;
  synonyms?: Synonym[];
  tenacity?: string[];
  toughness?: "EXCELLENT" | "GOOD" | "FAIR" | "POOR_FAIR" | "POOR" | "UNKNOWN";
  transparency?: string[];
  worksWellWith?: string[];
  zodiacSign?: string[];
  storage?: StorageInfo;
  healthRisks?: string;
  _archetype?: string;
  matchScore?: number | string;
  rating?: number; // 1-5
  comment?: string;
  /** @deprecated Prefer `_collections` */
  _collection?: string;
  /** User collection ObjectIds, e.g. `["6a563bc7bb8fae399c8c2aa2"]` */
  _collections?: string[];
}

/**
 * MushroomSpecimen Update Request — same field surface as add; backend PATCH accepts partial updates.
 */
export type UpdateMushroomSpecimenRequest = Partial<AddMushroomSpecimenRequest>;

/**
 * MushroomSpecimen Filter Request
 */
export interface MushroomSpecimenFilterRequest {
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
  isIdentified?: boolean[];
  isWishlisted?: boolean[];
  /** @deprecated Prefer `_collections` */
  _collection?: string[];
  _collections?: string[];
  /** @deprecated Legacy minerals API */
  entryType?: number[];
  crystalSystem?: string[];
  zodiacSign?: string[];
}

/**
 * Collection
 */
export interface Collection {
  collectionId: string;
  name: string;
  description?: string;
  /** Cover / custom image for the collection */
  imageUrl?: string;
  /** Representative preview image from API (preferred for list thumbnails when set) */
  representImage?: string;
  /** Up to several preview URLs returned on fetchAll rows */
  representativeImages?: string[];
  specimenCount: number;
  createdAt: string;
  updatedAt: string;
  specimens?: any[];
}

/**
 * Add Collection Request
 */
export interface AddCollectionRequest {
  name: string; // Required, must be unique for user
  description?: string;
  imageUrl?: string;
}

/**
 * Add Collection Response
 */
export interface AddCollectionResponse extends BackendApiResponse {
  data: Collection;
}

/**
 * Collection List Response
 */
export interface CollectionListResponse extends BackendApiResponse {
  data: Collection[];
  pagination: {
    pageNo: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  /** Aggregate preview URLs for system collections (fetchAll root fields) */
  identifiedImageUrls?: string[];
  wishlistedImageUrls?: string[];
  ownedImageUrls?: string[];
  identifiedCount?: number;
  wishlistedCount?: number;
  ownedCount?: number;
}

/**
 * Collection Details Response
 */
export interface CollectionDetailsResponse extends BackendApiResponse {
  data: Collection;
}

/**
 * Update Collection Request
 */
export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
  imageUrl?: string;
}

/**
 * Collection Stats Response
 */
export interface CollectionStatsResponse extends BackendApiResponse {
  data: {
    totalCollections: number;
  };
}

/**
 * MushroomArchetype (public catalog mushroom)
 */
export interface MushroomArchetype extends MushroomMatch {
  archetypeId: string;
  imageUrls: string[];
  isIdentified: boolean;
  isWishlisted: boolean;
  groupDtl?: {
    groupId: number;
    groupName: string;
    groupUrl: string;
  };
}

/**
 * MushroomArchetype List Item
 */
export interface MushroomArchetypeListItem {
  archetypeId: string;
  entryType?: number;
  commonNames?: string[];
  genusCommonNames?: string[];
  scientificName: string;
  canonicalName?: string;
  verbatimScientificName?: string;
  commonlyFoundIn?: string[];
  geographicDistribution?: string[];
  imageUrls: string[];
  defaultImageUrl?: string;
  detailedDescription?: string;
  summary?: string;
  edibility?: string;
  toxicitySeverity?: string;
  psychoactive?: string;
  isIdentified: boolean;
  isWishlisted: boolean;
}

/**
 * MushroomArchetype List Response
 */
export interface MushroomArchetypeListResponse extends BackendApiResponse {
  data: MushroomArchetypeListItem[];
  pagination: {
    pageNo: number;
    pageSize: number;
    totalCount: number;
  };
}

/**
 * MushroomArchetype Details Response
 */
export interface MushroomArchetypeDetailResponse extends BackendApiResponse {
  data: MushroomArchetype;
}

/**
 * MushroomArchetype Filter Request (query params)
 */
export interface MushroomArchetypeFilterParams {
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
  scientificClassification?: boolean;
  /** @deprecated Legacy minerals API */
  entryType?: boolean;
  recordType?: boolean;
  crystalSystem?: boolean;
  transparency?: boolean;
  lusture?: boolean;
  commonlyFoundIn?: boolean;
}

/**
 * MushroomArchetype Filter Request (body) — mushrooms API fields.
 */
export interface MushroomArchetypeFilterRequest {
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
  /** @deprecated Legacy minerals API */
  entryType?: number[];
  isGem?: boolean[];
  recordType?: string[];
  crystalSystem?: string[];
  color?: string[];
  transparency?: string[];
  lusture?: string[];
  zodiacSign?: string[];
}

/**
 * MushroomArchetype Stats Response
 */
export interface MushroomArchetypeStats {
  all: number;
  edible?: number;
  inedible?: number;
  toxic?: number;
  psychoactive?: number;
  wood_growing?: number;
  gems?: number;
  minerals?: number;
  rocks?: number;
}

export interface MushroomArchetypeStatsResponse extends BackendApiResponse {
  data: MushroomArchetypeStats | MushroomArchetypeStats[];
}

// Helper types
export interface StorageInfo {
  storeSeprately: "YES" | "NO";
  reason: string[];
}

export interface GemTreatment {
  common_treatments: string[];
  purpose: string | null;
  notes: string | null;
}

export interface Stability {
  lightStability?: "STABLE" | "MODERATELY_STABLE" | "UNSTABLE";
  heatStability?: "STABLE" | "MODERATELY_STABLE" | "UNSTABLE";
  chemicalsStability?: "STABLE" | "MODERATELY_STABLE" | "UNSTABLE";
  waterOrHumidityStability?: "STABLE" | "MODERATELY_STABLE" | "UNSTABLE";
  thermalShockStability?: "STABLE" | "MODERATELY_STABLE" | "UNSTABLE";
}

export interface CleaningTips {
  cleaningMethods: Record<
    string,
    {
      status: "SAFE" | "CAUTION" | "NOT_RECOMMENDED";
      note?: string;
    }
  >;
  cleaningNotes?: string;
}

export interface Synonym {
  synonymId: number;
  synonymName: string;
  synonymUrl: string;
}

// ---------------------------------------------------------------------------
// Bird API types (Trackzio Bird module)
// ---------------------------------------------------------------------------
export type {
  BirdMatch,
  BirdArchetype,
  BirdArchetypeListItem,
  BirdArchetypeListResponse,
  BirdArchetypeDetailResponse,
  BirdArchetypeStats,
  BirdArchetypeStatsResponse,
  BirdArchetypeFilterParams,
  BirdArchetypeFilterRequest,
  BirdIdentifyResponse,
  BirdIdentifyData,
  BirdSpecimen,
  BirdSpecimenListItem,
  BirdSpecimenListResponse,
  BirdSpecimenDetailResponse,
  AddBirdSpecimenRequest,
  UpdateBirdSpecimenRequest,
  BirdSpecimenFilterRequest,
  BirdFilterItemsResponse,
  BirdStepByStepRequest,
  BirdGalleryAudioResponse,
  BirdGalleryAudioFile,
  BirdWatchingTips,
  BirdRangeDetails,
  BirdPotentialHazards,
  SimilarBird,
  BirdIdentificationMetrics,
  BirdIdentificationDebug,
  BirdConfidenceLevel,
} from "./bird.api.types";
