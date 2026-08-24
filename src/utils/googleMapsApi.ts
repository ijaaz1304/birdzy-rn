/**
 * Google Maps API Utilities
 *
 * Functions for interacting with Google Maps APIs:
 * - Geocoding API (address to coordinates and reverse)
 * - Places API (search places, place details)
 *
 * Requires GOOGLE_MAPS_API_KEY in environment variables
 */

import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_GEOCODING_API_BASE_URL,
  GOOGLE_PLACES_API_BASE_URL,
} from "../constants/env";

export interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
  components: {
    streetNumber?: string;
    route?: string;
    locality?: string;
    administrativeArea?: string;
    country?: string;
    postalCode?: string;
  };
}

export interface ReverseGeocodeResult {
  address: string;
  formattedAddress: string;
  components: {
    streetNumber?: string;
    route?: string;
    locality?: string;
    administrativeArea?: string;
    country?: string;
    postalCode?: string;
  };
}

export interface PlaceSearchResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  photos?: Array<{
    photoReference: string;
    width: number;
    height: number;
  }>;
}

export interface GeocodeApiResponse {
  results: Array<{
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
      location_type: string;
      viewport: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
    };
    place_id: string;
    types: string[];
  }>;
  status: string;
}

export interface ReverseGeocodeApiResponse {
  results: Array<{
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
      location_type: string;
    };
    place_id: string;
    types: string[];
  }>;
  status: string;
}

export interface PlacesSearchApiResponse {
  results: Array<{
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    types: string[];
    rating?: number;
    user_ratings_total?: number;
    price_level?: number;
    photos?: Array<{
      photo_reference: string;
      width: number;
      height: number;
    }>;
  }>;
  status: string;
}

export interface PlaceAutocompleteResult {
  placeId: string;
  description: string;
  mainText?: string;
  secondaryText?: string;
}

interface PlacesAutocompleteApiResponse {
  predictions: Array<{
    description: string;
    place_id: string;
    structured_formatting?: {
      main_text: string;
      secondary_text: string;
    };
  }>;
  status: string;
}

/**
 * Geocode an address to coordinates
 */
export const geocodeAddress = async (
  address: string
): Promise<GeocodeResult> => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  }

  try {
    const url = `${GOOGLE_GEOCODING_API_BASE_URL}/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Geocoding API error: ${response.status} ${response.statusText}`
      );
    }

    const data: GeocodeApiResponse = await response.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      throw new Error(`Geocoding failed: ${data.status}`);
    }

    const result = data.results[0];
    const location = result.geometry.location;

    // Parse address components
    const components: GeocodeResult["components"] = {};
    result.address_components.forEach((component) => {
      if (component.types.includes("street_number")) {
        components.streetNumber = component.long_name;
      }
      if (component.types.includes("route")) {
        components.route = component.long_name;
      }
      if (component.types.includes("locality")) {
        components.locality = component.long_name;
      }
      if (component.types.includes("administrative_area_level_1")) {
        components.administrativeArea = component.long_name;
      }
      if (component.types.includes("country")) {
        components.country = component.long_name;
      }
      if (component.types.includes("postal_code")) {
        components.postalCode = component.long_name;
      }
    });

    return {
      address,
      latitude: location.lat,
      longitude: location.lng,
      formattedAddress: result.formatted_address,
      components,
    };
  } catch (error) {
    console.error("Error geocoding address:", error);
    throw error;
  }
};

/**
 * Reverse geocode coordinates to address
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  }

  try {
    const url = `${GOOGLE_GEOCODING_API_BASE_URL}/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Reverse Geocoding API error: ${response.status} ${response.statusText}`
      );
    }

    const data: ReverseGeocodeApiResponse = await response.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      throw new Error(`Reverse geocoding failed: ${data.status}`);
    }

    const result = data.results[0];

    // Parse address components
    const components: ReverseGeocodeResult["components"] = {};
    result.address_components.forEach((component) => {
      if (component.types.includes("street_number")) {
        components.streetNumber = component.long_name;
      }
      if (component.types.includes("route")) {
        components.route = component.long_name;
      }
      if (component.types.includes("locality")) {
        components.locality = component.long_name;
      }
      if (component.types.includes("administrative_area_level_1")) {
        components.administrativeArea = component.long_name;
      }
      if (component.types.includes("country")) {
        components.country = component.long_name;
      }
      if (component.types.includes("postal_code")) {
        components.postalCode = component.long_name;
      }
    });

    return {
      address: result.formatted_address,
      formattedAddress: result.formatted_address,
      components,
    };
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    throw error;
  }
};

/**
 * Address suggestions while typing (Google Geocoding API — same key as reverse geocode).
 */
export const searchAddressSuggestions = async (
  query: string
): Promise<PlaceSearchResult[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];
  if (!GOOGLE_MAPS_API_KEY?.trim()) return [];

  try {
    const url = `${GOOGLE_GEOCODING_API_BASE_URL}/geocode/json?address=${encodeURIComponent(
      trimmed
    )}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data: GeocodeApiResponse = await response.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return [];
    }

    return (data.results ?? []).slice(0, 5).map((result) => ({
      placeId: result.place_id,
      name:
        result.formatted_address.split(",")[0]?.trim() ||
        result.formatted_address,
      formattedAddress: result.formatted_address,
      location: {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
      },
      types: result.types ?? [],
    }));
  } catch {
    return [];
  }
};

/**
 * Autocomplete place names/addresses while typing (Google Places API).
 * Requires Places API enabled on the key — may return REQUEST_DENIED on mobile keys.
 */
export const autocompletePlaces = async (
  input: string,
  location?: { latitude: number; longitude: number }
): Promise<PlaceAutocompleteResult[]> => {
  const trimmed = input.trim();
  if (!trimmed) return [];
  if (!GOOGLE_MAPS_API_KEY?.trim()) {
    return [];
  }

  try {
    let url = `${GOOGLE_PLACES_API_BASE_URL}/place/autocomplete/json?input=${encodeURIComponent(
      trimmed
    )}&key=${GOOGLE_MAPS_API_KEY}`;

    if (location) {
      url += `&location=${location.latitude},${location.longitude}&radius=50000`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Places Autocomplete API error: ${response.status} ${response.statusText}`
      );
    }

    const data: PlacesAutocompleteApiResponse = await response.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return [];
    }

    return (data.predictions ?? []).map((prediction) => ({
      placeId: prediction.place_id,
      description: prediction.description,
      mainText: prediction.structured_formatting?.main_text,
      secondaryText: prediction.structured_formatting?.secondary_text,
    }));
  } catch {
    return [];
  }
};

/**
 * Search for places using Google Places API
 */
export const searchPlaces = async (
  query: string,
  location?: { latitude: number; longitude: number },
  radius?: number,
  type?: string
): Promise<PlaceSearchResult[]> => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  }

  try {
    let url = `${GOOGLE_PLACES_API_BASE_URL}/place/textsearch/json?query=${encodeURIComponent(
      query
    )}&key=${GOOGLE_MAPS_API_KEY}`;

    if (location && radius) {
      url += `&location=${location.latitude},${location.longitude}&radius=${radius}`;
    }

    if (type) {
      url += `&type=${type}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Places API error: ${response.status} ${response.statusText}`
      );
    }

    const data: PlacesSearchApiResponse = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Places search failed: ${data.status}`);
    }

    if (!data.results || data.results.length === 0) {
      return [];
    }

    return data.results.map((place) => ({
      placeId: place.place_id,
      name: place.name,
      formattedAddress: place.formatted_address,
      location: {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
      },
      types: place.types,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      priceLevel: place.price_level,
      photos: place.photos?.map((photo) => ({
        photoReference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
      })),
    }));
  } catch (error) {
    console.error("Error searching places:", error);
    throw error;
  }
};

/**
 * Get place details by place ID
 */
export const getPlaceDetails = async (
  placeId: string
): Promise<PlaceSearchResult | null> => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  }

  try {
    const url = `${GOOGLE_PLACES_API_BASE_URL}/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&fields=place_id,name,formatted_address,geometry,types,rating,user_ratings_total,price_level,photos`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Place Details API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.result) {
      throw new Error(`Place details failed: ${data.status}`);
    }

    const place = data.result;

    return {
      placeId: place.place_id,
      name: place.name,
      formattedAddress: place.formatted_address,
      location: {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
      },
      types: place.types,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      priceLevel: place.price_level,
      photos: place.photos?.map((photo: any) => ({
        photoReference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
      })),
    };
  } catch (error) {
    console.error("Error getting place details:", error);
    throw error;
  }
};

/**
 * Get photo URL from Google Places photo reference
 */
export const getPlacePhotoUrl = (
  photoReference: string,
  maxWidth: number = 400
): string => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  }

  return `${GOOGLE_PLACES_API_BASE_URL}/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
};
