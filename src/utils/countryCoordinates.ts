/**
 * Country coordinates for static map display
 *
 * Resolves country names to stable latitude/longitude for static maps.
 * Strategy: (1) predefined mapping from JSON asset (preferred, no API), (2) one-time geocode with cache.
 * Do NOT geocode on every render.
 *
 * Input normalization: country name is normalized with replace(/\s+/g, '').toUpperCase()
 * so "Saudi Arabia", "SAUDI ARABIA", "saudiarabia" all match the same entry.
 */

import { geocodeAddress } from "./googleMapsApi";

// JSON asset: keys are normalized (no spaces, uppercase). Load once at module init.

const COUNTRY_COORDINATES_JSON =
  require("../data/countryCoordinates.json") as Record<
    string,
    { latitude: number; longitude: number; displayName: string }
  >;

export interface CountryCoordinates {
  latitude: number;
  longitude: number;
  displayName?: string;
}

/** Zoom levels suitable for country-level static maps (3–5). */
export const COUNTRY_MAP_ZOOM_LEVEL = 4;

/**
 * Normalize country name for lookup.
 * Handles "Saudi Arabia", "SAUDI ARABIA", "saudiarabia" → same key without exploding the map.
 */
function normalizeKey(country: string): string {
  if (!country || typeof country !== "string") return "";
  const key = country.replace(/\s+/g, "").toUpperCase();
  const aliases: Record<string, string> = {
    "U.S.": "US",
    "U.S.A.": "USA",
    "U.K.": "UK",
    UNITEDSTATESOFAMERICA: "UNITEDSTATES",
  };
  return aliases[key] ?? key;
}

/**
 * Get coordinates from predefined map only (sync, no API).
 * Returns null if country is not in the predefined list.
 */
export function getCountryCoordinatesSync(
  countryName: string
): CountryCoordinates | null {
  const key = normalizeKey(countryName);
  if (!key) return null;
  const entry = COUNTRY_COORDINATES_JSON[key];
  if (!entry) return null;
  return {
    latitude: entry.latitude,
    longitude: entry.longitude,
    displayName: entry.displayName,
  };
}

/** In-memory cache for geocoded country coordinates (one-time geocode, reuse). */
const geocodeCache = new Map<string, CountryCoordinates>();

/**
 * Find the first country in the list that we have lat/long for (in our predefined JSON).
 * Do NOT just take the first in the list — check each and use the one we have coordinates for.
 */
export function findFirstCountryWithCoordinates(
  countryNames: string[]
): CountryCoordinates | null {
  const names = countryNames
    .map((n) => (typeof n === "string" ? n : String(n)).trim())
    .filter(Boolean);
  for (const name of names) {
    const coords = getCountryCoordinatesSync(name);
    if (coords) {
      return { ...coords, displayName: coords.displayName ?? name.trim() };
    }
  }
  return null;
}

/**
 * Resolve one or more country names to stable coordinates.
 * Uses only countries we have lat/long for: scan the list, take the first that exists in our JSON, show that.
 * Does NOT take the first object blindly; does NOT geocode — only predefined coordinates.
 */
export async function resolveCountryToCoordinates(
  countryNames: string[]
): Promise<CountryCoordinates | null> {
  const names = countryNames
    .map((n) => (typeof n === "string" ? n : String(n)).trim())
    .filter(Boolean);
  if (names.length === 0) return null;

  // Check each country: do we have lat/long for it? Use the first we have.
  for (const name of names) {
    const predefined = getCountryCoordinatesSync(name);
    if (predefined) {
      return {
        ...predefined,
        displayName: predefined.displayName ?? name.trim(),
      };
    }
    const key = normalizeKey(name);
    const cached = geocodeCache.get(key);
    if (cached)
      return { ...cached, displayName: cached.displayName ?? name.trim() };
  }

  // None in our map or cache: one-time geocode for each in order, cache on success
  for (const name of names) {
    const trimmed = name.trim();
    const key = normalizeKey(trimmed);
    try {
      const result = await geocodeAddress(trimmed);
      const coords: CountryCoordinates = {
        latitude: result.latitude,
        longitude: result.longitude,
        displayName: trimmed,
      };
      geocodeCache.set(key, coords);
      return coords;
    } catch {
      continue;
    }
  }
  return null;
}
