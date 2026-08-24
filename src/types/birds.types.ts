/**
 * Bird API — frontend display types (catalogue, identify, collection).
 */

import type {
  BirdMatch,
  BirdArchetypeStats,
  BirdWatchingTips,
  BirdRangeDetails,
  BirdPotentialHazards,
  SimilarBird,
} from "../services/api/features/bird.api.types";
import type { ScientificClassification } from "../services/api/features/core.api.types";

export type {
  BirdMatch,
  BirdArchetypeStats,
  BirdWatchingTips,
  BirdRangeDetails,
  BirdPotentialHazards,
  SimilarBird,
  ScientificClassification,
};

export interface BirdListItem {
  archetypeId: string;
  birdsLifeId?: string;
  commonName: string;
  scientificName: string;
  canonicalName?: string;
  summary?: string;
  description?: string;
  imageUrls: string[];
  defaultImageUrl?: string;
  soundUrls?: string[];
  isIdentified: boolean;
  isWishlisted: boolean;
  isOwned?: boolean;
  similarityScore?: number;
  score?: number;
  distanceFromUser?: number;
  conservationStatus?: string;
  birdType?: string[];
}

export interface BirdDetail extends BirdListItem {
  _id: string;
  wikipediaLink?: string;
  scientificClassification?: ScientificClassification;
  flightPattern?: string[];
  flightSpeed?: string;
  flightAltitude?: string[];
  birdWatchingTips?: BirdWatchingTips;
  diet?: string[];
  habitat?: string[];
  lifeExpectancyInWild?: string;
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
  userCapturedImages?: string[];
  userCapturedSounds?: string[];
  userNotes?: string;
  customLocation?: string;
  comment?: string | null;
}

export interface BirdListResponse {
  error: boolean;
  data: BirdListItem[];
  pagination: {
    pageNo: number;
    pageSize: number;
    totalCount: number;
    totalPages?: number;
  };
}

export interface BirdDetailResponse {
  error: boolean;
  data: BirdDetail;
  reason?: string;
}

/** POST /core/archetypes/fetchAll filter body (Bird fields). */
export interface BirdFilterRequest {
  birdType?: string[];
  diet?: string[];
  habitat?: string[];
  conservationStatus?: string[];
  flightPattern?: string[];
  flightAltitude?: string[];
  customLocation?: string[];
  "birdWatchingTips.bestTime"?: string[];
  "birdWatchingTips.preferredLocations"?: string[];
  "scientificClassification.order"?: string[];
  "scientificClassification.family"?: string[];
}

/** Normalized identify result for UI (camera / results screens). */
export interface BirdIdentification {
  birdId: string;
  archetypeId?: string;
  birdsLifeId?: string;
  name: string;
  commonName?: string;
  scientificName: string;
  confidence: number;
  similarityScore: number;
  confidenceLevel?: string;
  conservationStatus?: string;
  characteristics?: {
    birdType?: string;
    habitat?: string;
    diet?: string;
    conservationStatus?: string;
    dominantColors?: string;
    keyIdentificationMarks?: string;
    flightPattern?: string;
  };
  match?: BirdMatch;
}

export interface IdentifyBirdResult {
  imageUrls: string[];
  soundUrls?: string[];
  matches: BirdIdentification[];
  matchesFoundCount: number;
  confidence?: string;
  userLocation?: unknown;
}
