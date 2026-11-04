import type { FeatureCollection, Point } from "geojson";
/** Wire contracts from the supplied Explore documentation: paginated cards and raw map GeoJSON. */

import { BackendApiResponse } from "@/services/api/features/auth.api.types";

export type ExploreTab = "growingNow" | "yearRound";

export interface ExploreLocation {
  lat: number;
  lng: number;
}

export interface ExploreNearYouRequestBody {
  location: ExploreLocation;
  /**
   * Map search radius in km. Never forwarded to the location-only list endpoint.
   */
  radius?: number;
  birdSize?: string[];
  birdType?: string[];
  conservationStatus?: string[];
  habitat?: string[];
}

export interface ExploreNearYouQueryParams {
  /** One-based page number; defaults to 1. */
  pageNo?: number;
  pageSize?: number;
  tab?: ExploreTab;
}

export interface ExploreArchetypeCard {
  archetypeId: string;
  birdsLifeId: string;
  scientificName: string;
  /** Confirmed nullable in real responses. */
  commonName: string | null;
  imageUrls: string[];
  defaultImageUrl: string;
  isWishlisted: boolean;
  isSpottedNow: boolean;
  soundUrls?: string[];
  distanceFromUser: number;
}

export interface ExploreTabsCount {
  spottedNowCount: number;
  yearRoundCount: number;
}

export interface ExplorePagination {
  pageNo: number;
  pageSize: number;
  totalCount: number;
}

export interface ExploreNearYouResponse extends BackendApiResponse {
  data: ExploreArchetypeCard[];
  mapClusters?: { lat: number; lng: number }[];
  tabs: ExploreTabsCount;
  pagination: ExplorePagination;
}

/** The GeoJSON endpoint returns this collection directly, without an API envelope. */
export interface ExploreMapProperties {
  /** Observation/analytics ID, never an archetype ID. */
  id: string;
  birdsLifeId: string;
  scientificName?: string;
  countryCode?: string;
  state?: string;
  total_observations?: number;
  birdSize?: string;
  birdType?: string[];
  conservationStatus?: string;
  habitat?: string[];
  [key: string]: unknown;
}
export type ExploreMapGeoJSON = FeatureCollection<Point, ExploreMapProperties>;

/** All trait query parameters are scalar strings sent as query parameters on the POST map request. */
export interface ExploreMapQueryParams {
  bbox: string;
  countryCode?: string;
  state?: string;
  city?: string;
  level?: string;
  birdsLifeId?: string;
  minObservations?: number;
  birdSize?: string;
  birdType?: string;
  conservationStatus?: string;
  habitat?: string;
}

export const EMPTY_EXPLORE_MAP: ExploreMapGeoJSON = {
  type: "FeatureCollection",
  features: [],
};
