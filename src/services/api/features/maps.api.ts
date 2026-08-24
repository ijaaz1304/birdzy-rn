/**
 * Maps API Service
 *
 * Proxies Google Maps API calls through backend
 * Backend handles Google Maps API key securely
 */

import { api } from "../axios";

export interface GeocodeRequest {
  address: string;
}

export interface ReverseGeocodeRequest {
  latitude: number;
  longitude: number;
}

export interface SearchPlacesRequest {
  query: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  radius?: number;
  type?: string;
}

export interface StaticMapRequest {
  latitude: number;
  longitude: number;
  width?: number;
  height?: number;
  zoom?: number;
  mapType?: "roadmap" | "satellite" | "terrain" | "hybrid";
  markerColor?: string;
  markerLabel?: string;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeId?: string;
}

export interface PlaceResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  types?: string[];
}

export interface StaticMapResponse {
  imageUrl: string;
}

/**
 * Maps API service (backend proxy)
 */
export const mapsApi = {
  /**
   * Geocode address to coordinates
   */
  geocodeAddress: async (
    request: GeocodeRequest
  ): Promise<GeocodeResult[]> => {
    return api.post<GeocodeResult[]>("/maps/geocode", request);
  },

  /**
   * Reverse geocode coordinates to address
   */
  reverseGeocode: async (
    request: ReverseGeocodeRequest
  ): Promise<GeocodeResult> => {
    return api.post<GeocodeResult>("/maps/reverse-geocode", request);
  },

  /**
   * Search places
   */
  searchPlaces: async (
    request: SearchPlacesRequest
  ): Promise<PlaceResult[]> => {
    return api.post<PlaceResult[]>("/maps/places/search", request);
  },

  /**
   * Get place details
   */
  getPlaceDetails: async (
    placeId: string
  ): Promise<PlaceResult> => {
    return api.get<PlaceResult>(`/maps/places/${placeId}`);
  },

  /**
   * Get static map image URL
   */
  getStaticMap: async (
    request: StaticMapRequest
  ): Promise<StaticMapResponse> => {
    return api.post<StaticMapResponse>("/maps/static", request);
  },
};
