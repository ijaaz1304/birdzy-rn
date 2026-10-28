/**
 * Bird Module API Types
 * Shapes matching Trackzio Bird core API responses.
 * @see docs/API_DOMAIN_MAPPING.md
 */

import { BackendApiResponse } from "./auth.api.types";
import type { ScientificClassification } from "./core.api.types";

// ---------------------------------------------------------------------------
// Shared bird field groups
// ---------------------------------------------------------------------------

export interface BirdWatchingTips {
  bestTime?: string;
  preferredLocations?: string;
  behavioralCues?: string;
}

export interface BirdRangeDetails {
  yearRound?: string;
  migration?: string;
  breeding?: string;
  nonBreeding?: string;
}

/** Optional extra species-profile fields when the API provides them. */
export interface BirdProfileDetails {
  size?: string;
  familyDescription?: string;
  shape?: string;
  beak?: string;
  tailShape?: string;
  legCharacteristics?: string;
  feedingBehavior?: string;
  vocalBehavior?: string;
  territoriality?: string;
  socialBehavior?: string;
  dietType?: string;
  feedingStyle?: string;
  breedingSeason?: string;
  nestType?: string;
  nestingMaterial?: string;
  parentalCare?: string;
  residentStatus?: string;
  migrationPath?: string;
  seasonalPresence?: string;
}

export interface BirdPotentialHazards {
  toHumans?: string;
  toPets?: string;
  toPlants?: string;
  tobirds?: string;
}

export interface BirdIdentificationMetrics {
  visualMatch?: number;
  filterMatch?: number;
  popularityScore?: number;
  locationMatchTier?: string;
  isCommon?: boolean;
}

export interface BirdIdentificationDebug {
  weights?: {
    wVis?: number;
    wGeo?: number;
    wPop?: number;
    wFil?: number;
  };
  sVis?: number;
  sGeo?: number;
  sPop?: number;
  sFil?: number;
  userLocation?: unknown;
}

export interface SimilarBird {
  speciesId?: string;
  scientificName?: string;
  commonName?: string;
  keyDifferences?: string;
  imageUrls?: string[];
  similarityScore?: number;
}

export type BirdConfidenceLevel = "High" | "Medium" | "Low" | string;

// ---------------------------------------------------------------------------
// Identification match (POST /core/ai/identify, identify-sound)
// ---------------------------------------------------------------------------

export interface BirdMatch {
  _id: string;
  archetypeId?: string;
  birdsLifeId?: string;
  scientificName: string;
  commonName?: string;
  summary?: string;
  wikipediaLink?: string;
  imageUrls?: string[];
  soundUrls?: string[];
  userCapturedImages?: string[];
  userCapturedSounds?: string[];
  processed_sound_urls?: string[];
  scientificClassification?: ScientificClassification;
  birdType?: string[];
  flightPattern?: string[];
  flightSpeed?: string;
  flightAltitude?: string[];
  birdWatchingTips?: BirdWatchingTips;
  diet?: string[];
  habitat?: string[];
  lifeExpectancyInWild?: string;
  conservationStatus?: string;
  potentialHazards?: BirdPotentialHazards;
  funFacts?: string[];
  similarBirds?: SimilarBird[];
  keyIdentificationMarks?: string[];
  dominantColors?: string[];
  sexDifferences?: string;
  rangeDetails?: BirdRangeDetails;
  profile?: BirdProfileDetails;
  lengthRange?: string;
  wingspanRange?: string;
  weightRange?: string;
  analyticsUrl?: string;
  canonicalName?: string;
  similarityScore: number;
  alternativeNames?: string[];
  imageCount?: number;
  s3_key?: string | null;
  metrics?: BirdIdentificationMetrics;
  debug?: BirdIdentificationDebug;
  defaultImageUrl?: string;
  isIdentified?: boolean;
  isWishlisted?: boolean;
  isOwned?: boolean;
  customLocation?: string;
  comment?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BirdIdentifyData {
  confidence?: BirdConfidenceLevel;
  userLocation?: unknown;
  imageUrls?: string[];
  soundUrls?: string[];
  matchesFoundCount: number;
  matches: BirdMatch[];
}

export interface BirdIdentifyResponse extends BackendApiResponse {
  confidence?: BirdConfidenceLevel;
  userLocation?: unknown;
  data: BirdIdentifyData;
}

// ---------------------------------------------------------------------------
// Archetype (public catalogue)
// ---------------------------------------------------------------------------

export interface BirdArchetypeListItem {
  archetypeId: string;
  birdsLifeId?: string;
  scientificName: string;
  commonName?: string;
  summary?: string;
  /** Present on step-by-step nearby results */
  description?: string;
  imageUrls: string[];
  soundUrls?: string[];
  defaultImageUrl?: string;
  isIdentified: boolean;
  isWishlisted: boolean;
  isOwned?: boolean;
  score?: number;
  /** Meters from user — step-by-step endpoint */
  distanceFromUser?: number;
}

export interface BirdArchetype extends BirdMatch {
  archetypeId: string;
}

export interface BirdArchetypeListResponse extends BackendApiResponse {
  data: BirdArchetypeListItem[];
  pagination: {
    pageNo: number;
    pageSize: number;
    totalCount: number;
    totalPages?: number;
  };
}

export interface BirdArchetypeDetailResponse extends BackendApiResponse {
  data: BirdArchetype;
}

export interface BirdArchetypeStats {
  all: number;
  raptors?: number;
  songbirds?: number;
  waterBirds?: number;
  threatened?: number;
  soaring?: number;
}

export interface BirdArchetypeStatsResponse extends BackendApiResponse {
  data: BirdArchetypeStats;
}

/** GET /core/archetypes/filteritems — query param flags */
export interface BirdArchetypeFilterParams {
  "scientificClassification.kingdom"?: boolean;
  "scientificClassification.phylum"?: boolean;
  "scientificClassification.class"?: boolean;
  "scientificClassification.order"?: boolean;
  "scientificClassification.family"?: boolean;
  "scientificClassification.genus"?: boolean;
  "scientificClassification.species"?: boolean;
  birdType?: boolean;
  customLocation?: boolean;
  flightPattern?: boolean;
  flightAltitude?: boolean;
  "birdWatchingTips.bestTime"?: boolean;
  "birdWatchingTips.preferredLocations"?: boolean;
  diet?: boolean;
  habitat?: boolean;
  lifeExpectancyInWild?: boolean;
  conservationStatus?: boolean;
}

/** POST /core/archetypes/fetchAll — body filter arrays */
export interface BirdArchetypeFilterRequest {
  "scientificClassification.kingdom"?: string[];
  "scientificClassification.phylum"?: string[];
  "scientificClassification.class"?: string[];
  "scientificClassification.order"?: string[];
  "scientificClassification.family"?: string[];
  "scientificClassification.genus"?: string[];
  "scientificClassification.species"?: string[];
  birdType?: string[];
  customLocation?: string[];
  flightPattern?: string[];
  flightAltitude?: string[];
  "birdWatchingTips.bestTime"?: string[];
  "birdWatchingTips.preferredLocations"?: string[];
  diet?: string[];
  habitat?: string[];
  lifeExpectancyInWild?: string[];
  conservationStatus?: string[];
  _archetype?: string[];
}

/** POST /core/archetypes/step-by-step */
export interface BirdStepByStepRequest {
  location: { lat: number; lng: number };
  seenDate?: string;
  birdSize?: string | string[];
  /** Client region preset id when not using GPS (draft). */
  region?: string;
}

// ---------------------------------------------------------------------------
// Specimen (private collection)
// ---------------------------------------------------------------------------

export interface BirdSpecimenCollectionRef {
  _id: string;
  name: string;
  description?: string;
  modifiedAt?: string;
}

export interface BirdSpecimenListItem {
  specimenId: string;
  _archetype?: string;
  scientificName: string;
  commonName?: string;
  defaultImageUrl?: string;
  imageUrls: string[];
  isIdentified: boolean;
  isWishlisted: boolean;
  isOwned?: boolean;
  collections?: BirdSpecimenCollectionRef[];
  /** Legacy single-collection shape from older payloads */
  collection?: {
    collectionId: string;
    name: string;
    description: string;
  };
}

export interface BirdSpecimen extends BirdMatch {
  _id: string;
  id?: string;
  _archetype?: string | null;
  _user?: string;
  userId?: string;
  userNotes?: string;
  customLocation?: string;
  topMatches?: unknown[];
  isIdentified: boolean;
  isWishlisted: boolean;
  isOwned?: boolean;
  rating?: number | null;
  comment?: string | null;
  _collections?: string[];
  imageAugUrls?: string[];
  collections?: BirdSpecimenCollectionRef[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface BirdSpecimenListResponse extends BackendApiResponse {
  data: BirdSpecimenListItem[];
  pagination: {
    pageNo: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface BirdSpecimenDetailResponse extends BackendApiResponse {
  data: BirdSpecimen;
}

export interface AddBirdSpecimenRequest {
  scientificName: string;
  imageUrls: string[];
  _collections: string[];
  birdsLifeId?: string;
  commonName?: string;
  summary?: string;
  wikipediaLink?: string;
  userCapturedImages?: string[];
  soundUrls?: string[];
  userCapturedSounds?: string[];
  scientificClassification?: ScientificClassification;
  birdType?: string[];
  flightPattern?: string[];
  flightSpeed?: string;
  flightAltitude?: string[];
  birdWatchingTips?: BirdWatchingTips;
  diet?: string[];
  habitat?: string[];
  lifeExpectancyInWild?: string;
  conservationStatus?: string;
  potentialHazards?: BirdPotentialHazards;
  funFacts?: string[];
  similarBirds?: SimilarBird[];
  keyIdentificationMarks?: string[];
  dominantColors?: string[];
  sexDifferences?: string;
  rangeDetails?: BirdRangeDetails;
  lengthRange?: string;
  wingspanRange?: string;
  weightRange?: string;
  analyticsUrl?: string;
  _archetype?: string;
  isIdentified?: boolean;
  isWishlisted?: boolean;
  isOwned?: boolean;
  defaultImageUrl?: string;
  comment?: string;
}

export type UpdateBirdSpecimenRequest = Partial<{
  commonName: string;
  scientificName: string;
  summary: string;
  wikipediaLink: string;
  "scientificClassification.kingdom": string;
  "scientificClassification.phylum": string;
  "scientificClassification.class": string;
  "scientificClassification.order": string;
  "scientificClassification.family": string;
  "scientificClassification.genus": string;
  "scientificClassification.species": string;
  birdType: string[];
  customLocation: string;
  userCapturedSounds: string[];
  flightPattern: string[];
  flightSpeed: string;
  flightAltitude: string[];
  "birdWatchingTips.bestTime": string;
  "birdWatchingTips.preferredLocations": string;
  "birdWatchingTips.behavioralCues": string;
  diet: string[];
  habitat: string[];
  lifeExpectancyInWild: string;
  conservationStatus: string;
  "potentialHazards.toHumans": string;
  "potentialHazards.toPets": string;
  "potentialHazards.tobirds": string;
  funFacts: string[];
  "rangeDetails.yearRound": string;
  "rangeDetails.migration": string;
  "rangeDetails.breeding": string;
  "rangeDetails.nonBreeding": string;
  lengthRange: string;
  wingspanRange: string;
  weightRange: string;
  keyIdentificationMarks: string[];
  dominantColors: string[];
  sexDifferences: string;
  isIdentified: boolean;
  isWishlisted: boolean;
  isOwned: boolean;
  matchScore: number | string;
  _collections: string[];
  _archetype: string;
}>;

export interface BirdSpecimenFilterRequest {
  "scientificClassification.kingdom"?: string[];
  "scientificClassification.phylum"?: string[];
  "scientificClassification.class"?: string[];
  "scientificClassification.order"?: string[];
  "scientificClassification.family"?: string[];
  "scientificClassification.genus"?: string[];
  "scientificClassification.species"?: string[];
  birdType?: string[];
  customLocation?: string[];
  flightPattern?: string[];
  flightAltitude?: string[];
  "birdWatchingTips.bestTime"?: string[];
  "birdWatchingTips.preferredLocations"?: string[];
  diet?: string[];
  habitat?: string[];
  lifeExpectancyInWild?: string[];
  conservationStatus?: string[];
  isIdentified?: boolean[];
  isWishlisted?: boolean[];
  isOwned?: boolean[];
  _collections?: string[];
  _archetype?: string[];
}

/** GET /core/archetypes/filteritems response data */
export interface BirdFilterItemsData {
  [key: string]: string[] | undefined;
}

export interface BirdFilterItemsResponse extends BackendApiResponse {
  data: BirdFilterItemsData;
}

// ---------------------------------------------------------------------------
// Audio gallery
// ---------------------------------------------------------------------------

export interface BirdGalleryAudioFile {
  fileId: string;
  url: string;
  filetype: "audio";
  createdAt?: string;
  capturedAt?: string;
  resultsCount?: number;
  locationString?: string | null;
  specimen?: {
    specimenId: string;
    scientificName: string;
    commonName?: string;
    defaultImageUrl?: string;
    imageUrls?: string[];
    soundUrls?: string[];
  } | null;
}

export interface BirdGalleryAudioResponse extends BackendApiResponse {
  data: {
    identified: { count: number; files: BirdGalleryAudioFile[] };
    unknown: { count: number; files: BirdGalleryAudioFile[] };
  };
}
