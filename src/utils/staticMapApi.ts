/**
 * Google Maps Static API Utilities
 *
 * Functions for generating static map images with markers.
 * Requires GOOGLE_MAPS_API_KEY in environment variables.
 *
 * Static map usage:
 * - Always use resolved latitude/longitude for center and marker (never raw country names).
 * - Country-level maps: use zoom 3–5 (see COUNTRY_ZOOM_LEVEL in countryCoordinates.ts).
 * - Single marker for country; no polygons or paths.
 */

import { GOOGLE_MAPS_API_KEY } from "../constants/env";

/** Zoom level for country-level static maps (3–5). Re-export for consistency; primary source is countryCoordinates.COUNTRY_MAP_ZOOM_LEVEL. */
export const COUNTRY_ZOOM_LEVEL = 4;

export interface StaticMapMarker {
  latitude: number;
  longitude: number;
  color?: string; // Color of the marker (e.g., 'red', 'blue', '0xFF0000')
  label?: string; // Single character label for marker
  size?: "tiny" | "small" | "mid" | "normal";
}

export interface StaticMapOptions {
  latitude: number;
  longitude: number;
  width?: number;
  height?: number;
  zoom?: number;
  mapType?: "roadmap" | "satellite" | "terrain" | "hybrid";
  scale?: 1 | 2; // 1 = normal, 2 = retina/high DPI
  markerColor?: string; // Color of the marker (e.g., 'red', 'blue', '0xFF0000') - for single marker
  markerLabel?: string; // Single character label for marker - for single marker
  markerSize?: "tiny" | "small" | "mid" | "normal"; // for single marker
  markers?: StaticMapMarker[]; // Multiple markers support
}

/**
 * Generate static map image URL
 * @param options - Map configuration options
 * @returns URL string for the static map image
 */
export const getStaticMapUrl = (options: StaticMapOptions): string => {
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.trim() === "") {
    throw new Error(
      "GOOGLE_MAPS_API_KEY is not configured. Please add it to .env file."
    );
  }

  const {
    latitude,
    longitude,
    width = 400,
    height = 300,
    zoom = 15,
    mapType = "roadmap",
    scale = 2, // Use 2 for retina displays
    markerColor = "red",
    markerLabel,
    markerSize = "normal",
    markers,
  } = options;

  // Validate coordinates
  if (isNaN(latitude) || isNaN(longitude)) {
    throw new Error("Invalid latitude or longitude");
  }

  if (latitude < -90 || latitude > 90) {
    throw new Error("Latitude must be between -90 and 90");
  }

  if (longitude < -180 || longitude > 180) {
    throw new Error("Longitude must be between -180 and 180");
  }

  // Google Static Maps API: size must be integers, max 640 per dimension
  const maxSize = 640;
  const sizeWidth = Math.round(
    Math.min(Math.max(Number(width) || 400, 1), maxSize)
  );
  const sizeHeight = Math.round(
    Math.min(Math.max(Number(height) || 300, 1), maxSize)
  );
  const sizeParam = `${sizeWidth}x${sizeHeight}`;

  // Base URL for Google Maps Static API
  const baseUrl = "https://maps.googleapis.com/maps/api/staticmap";

  // Build center parameter
  const center = `${latitude},${longitude}`;

  // Build query parameters
  const params = new URLSearchParams({
    center,
    zoom: zoom.toString(),
    size: sizeParam,
    scale: scale.toString(),
    maptype: mapType,
    key: GOOGLE_MAPS_API_KEY,
  });

  // Build markers parameter(s)
  if (markers && markers.length > 0) {
    // Multiple markers - add each as a separate markers parameter
    markers.forEach((marker) => {
      let markerStr = `color:${marker.color || "red"}`;
      if (marker.label) {
        markerStr += `|label:${marker.label}`;
      }
      if (marker.size && marker.size !== "normal") {
        markerStr += `|size:${marker.size}`;
      }
      markerStr += `|${marker.latitude},${marker.longitude}`;
      params.append("markers", markerStr);
    });
  } else {
    // Single marker (backward compatibility)
    let marker = `color:${markerColor}`;
    if (markerLabel) {
      marker += `|label:${markerLabel}`;
    }
    if (markerSize !== "normal") {
      marker += `|size:${markerSize}`;
    }
    marker += `|${latitude},${longitude}`;
    params.append("markers", marker);
  }

  const finalUrl = `${baseUrl}?${params.toString()}`;

  // Log in dev mode for debugging (with key hidden)
  if (__DEV__) {
    const urlWithoutKey = finalUrl.replace(/key=[^&]+/, "key=***");
    console.log("Generated Static Map URL:", urlWithoutKey);
  }

  return finalUrl;
};

/**
 * Generate static map with custom marker icon
 * @param options - Map configuration options
 * @param customIconUrl - URL to custom marker icon
 * @returns URL string for the static map image
 */
export const getStaticMapUrlWithCustomIcon = (
  options: Omit<StaticMapOptions, "markerColor" | "markerLabel" | "markerSize">,
  customIconUrl: string
): string => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  }

  const {
    latitude,
    longitude,
    width = 400,
    height = 300,
    zoom = 15,
    mapType = "roadmap",
    scale = 2,
  } = options;

  const maxSize = 640;
  const sizeWidth = Math.round(
    Math.min(Math.max(Number(width) || 400, 1), maxSize)
  );
  const sizeHeight = Math.round(
    Math.min(Math.max(Number(height) || 300, 1), maxSize)
  );
  const sizeParam = `${sizeWidth}x${sizeHeight}`;

  const baseUrl = "https://maps.googleapis.com/maps/api/staticmap";
  const center = `${latitude},${longitude}`;
  const marker = `icon:${encodeURIComponent(
    customIconUrl
  )}|${latitude},${longitude}`;

  const params = new URLSearchParams({
    center,
    zoom: zoom.toString(),
    size: sizeParam,
    scale: scale.toString(),
    maptype: mapType,
    markers: marker,
    key: GOOGLE_MAPS_API_KEY,
  });

  return `${baseUrl}?${params.toString()}`;
};
