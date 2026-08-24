/**
 * Forward & reverse geocoding via geocode.maps.co (OpenStreetMap / Nominatim).
 * Used for identify location label and Change Location search.
 */

import { GEOCODING_API_BASE_URL, GEOCODING_API_KEY } from "../constants/env";
import { logLocation, logLocationError } from "./locationDebug";

export interface GeocodingSearchResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface GeocodeForwardResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  region?: string;
  country?: string;
};

type NominatimResult = {
  place_id?: number | string;
  lat?: string | number;
  lon?: string | number;
  display_name?: string;
  address?: NominatimAddress;
};

function hasGeocodingConfig(): boolean {
  return Boolean(GEOCODING_API_BASE_URL?.trim() && GEOCODING_API_KEY?.trim());
}

function buildGeocodingUrl(
  path: string,
  params: Record<string, string>
): string {
  const base = GEOCODING_API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  url.searchParams.set("api_key", GEOCODING_API_KEY);
  url.searchParams.set("format", "json");

  return url.toString();
}

async function fetchNominatim(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${GEOCODING_API_KEY}`,
    },
  });

  if (response.status === 429 || response.status === 503) {
    throw new Error(`Geocoding rate limited: HTTP ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(`Geocoding API error: HTTP ${response.status}`);
  }

  return response.json();
}

function parseCoordinate(value: string | number | undefined): number | null {
  if (value == null) return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatGeocodingLabel(
  address?: NominatimAddress,
  displayName?: string
): string {
  if (address) {
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county;
    const region = address.state || address.region;
    const country = address.country;

    if (city && region) return `${city}, ${region}`;
    if (city && country) return `${city}, ${country}`;
    if (region && country) return `${region}, ${country}`;
    if (city) return city;
    if (region) return region;
    if (country) return country;
  }

  if (displayName?.trim()) {
    const parts = displayName
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`;
    return parts[0] ?? displayName.trim();
  }

  return "";
}

function mapNominatimResult(
  result: NominatimResult
): GeocodingSearchResult | null {
  const latitude = parseCoordinate(result.lat);
  const longitude = parseCoordinate(result.lon);
  if (latitude == null || longitude == null) return null;

  const formattedAddress = result.display_name?.trim() || "";
  const name =
    formatGeocodingLabel(result.address, formattedAddress) || formattedAddress;
  if (!name) return null;

  return {
    placeId: String(result.place_id ?? `${latitude},${longitude}`),
    name,
    formattedAddress: formattedAddress || name,
    location: { latitude, longitude },
  };
}

/** Reverse geocode GPS coordinates to a short place label. */
export async function reverseGeocodeAddress(
  latitude: number,
  longitude: number
): Promise<string> {
  if (!hasGeocodingConfig()) {
    logLocation("reverseGeocode: skipped — geocoding env not configured");
    return "";
  }

  try {
    const url = buildGeocodingUrl("/reverse", {
      lat: String(latitude),
      lon: String(longitude),
    });
    logLocation("reverseGeocode: request", { latitude, longitude });
    const data = (await fetchNominatim(url)) as
      | NominatimResult
      | NominatimResult[];
    const result = Array.isArray(data) ? data[0] : data;
    const label =
      formatGeocodingLabel(result?.address, result?.display_name) ||
      result?.display_name?.trim() ||
      "";
    logLocation("reverseGeocode: response", { label: label || "(empty)" });
    return label;
  } catch (error) {
    logLocationError("reverseGeocode: failed", error);
    return "";
  }
}

/** Forward geocode search suggestions while typing. */
export async function searchAddressSuggestions(
  query: string
): Promise<GeocodingSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];
  if (!hasGeocodingConfig()) return [];

  try {
    const url = buildGeocodingUrl("/search", {
      q: trimmed,
      limit: "5",
    });
    logLocation("geocode search: request", { query: trimmed });
    const data = (await fetchNominatim(url)) as NominatimResult[];
    if (!Array.isArray(data)) return [];

    return data
      .map(mapNominatimResult)
      .filter((item): item is GeocodingSearchResult => item != null);
  } catch (error) {
    logLocationError("geocode search: failed", error);
    return [];
  }
}

/** Forward geocode a free-form address to coordinates. */
export async function geocodeAddress(
  query: string
): Promise<GeocodeForwardResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error("Address query is empty");
  }

  const results = await searchAddressSuggestions(trimmed);
  const first = results[0];
  if (!first) {
    throw new Error("No geocoding results");
  }

  return {
    latitude: first.location.latitude,
    longitude: first.location.longitude,
    formattedAddress: first.formattedAddress || first.name,
  };
}
