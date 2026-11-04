/**
 * Forward & reverse geocoding via geocode.maps.co (OpenStreetMap / Nominatim).
 * Used for identify location label and Change Location search.
 */

import { GEOCODING_API_BASE_URL, GEOCODING_API_KEY } from "@/constants/env";
import { createRequestGate } from "./abortableRequest";
import { isValidCoordinate } from "./locationCoordinates";
import { logLocation, logLocationError } from "@/utils/locationDebug";

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

const requestGeocoding = createRequestGate(500);
const searchCache = new Map<
  string,
  { at: number; results: GeocodingSearchResult[] }
>();

async function fetchNominatim(
  url: string,
  signal?: AbortSignal
): Promise<unknown> {
  return requestGeocoding(async () => {
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) controller.abort();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 12000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${GEOCODING_API_KEY}`,
        },
      });
      if (!response.ok) {
        const error = new Error(
          response.status === 429 || response.status === 503
            ? "Location search is busy. Please try again shortly."
            : "Unable to search locations. Please try again."
        );
        Object.assign(error, {
          response: {
            status: response.status,
            headers: { "retry-after": response.headers.get("retry-after") },
          },
        });
        throw error;
      }
      return await response.json();
    } catch (error) {
      if (timedOut)
        throw new Error("Location search timed out. Please try again.");
      throw error;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    }
  }, signal);
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
  if (
    latitude == null ||
    longitude == null ||
    !isValidCoordinate(latitude, longitude)
  )
    return null;

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
  query: string,
  options: { signal?: AbortSignal; throwOnError?: boolean } = {}
): Promise<GeocodingSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];
  if (!hasGeocodingConfig()) {
    if (options.throwOnError)
      throw new Error(
        "Location search is unavailable. Please try again later."
      );
    return [];
  }
  const cacheKey = trimmed.toLocaleLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.at < 60000) return cached.results;

  try {
    const url = buildGeocodingUrl("/search", {
      q: trimmed,
      limit: "5",
    });
    logLocation("geocode search: request", { query: trimmed });
    const data = (await fetchNominatim(
      url,
      options.signal
    )) as NominatimResult[];
    if (!Array.isArray(data)) return [];

    const results = data
      .map(mapNominatimResult)
      .filter((item): item is GeocodingSearchResult => item != null);
    if (searchCache.size >= 50)
      searchCache.delete(searchCache.keys().next().value!);
    searchCache.set(cacheKey, { at: Date.now(), results });
    return results;
  } catch (error) {
    if (options.throwOnError || options.signal?.aborted) throw error;
    logLocationError("geocode search: failed", error);
    return [];
  }
}

/** Forward geocode a free-form address to coordinates. */
export async function geocodeAddress(
  query: string,
  signal?: AbortSignal
): Promise<GeocodeForwardResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error("Address query is empty");
  }

  const results = await searchAddressSuggestions(trimmed, {
    signal,
    throwOnError: true,
  });
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
