/**
 * Firebase Storage URL Helper
 *
 * Provides environment-aware storage URLs to prevent hardcoded prod URLs
 * in mock/test data from accidentally pointing to production.
 */

import { ENV, MUSHROOMS_API_BASE_URL } from "../../constants/env";

/**
 * Mindat scraped images: use the same bucket as the minerals API environment.
 * __DEV__ alone is wrong when the dev client points at prod API — URLs would 404 and the carousel shows blank.
 */
function isProductionFirebaseStorageBucket(): boolean {
  if (ENV === "production") return true;
  const url = (MUSHROOMS_API_BASE_URL || "").toLowerCase();
  if (
    url.includes("minerals-api-prod") ||
    url.includes("mushrooms-api-prod") ||
    url.includes("birds-api-prod")
  ) {
    return true;
  }
  if (
    url.includes("minerals-api-dev") ||
    url.includes("mushrooms-api") ||
    url.includes("birds-api")
  ) {
    return false;
  }
  return !__DEV__;
}

/**
 * Get the Firebase Storage base URL based on environment
 * DEV: birdzy-app-dev.firebasestorage.app
 * PROD: birdzy-app.firebasestorage.app
 */
export const getFirebaseStorageBaseUrl = (): string => {
  return isProductionFirebaseStorageBucket()
    ? "https://storage.googleapis.com/birdzy-app.firebasestorage.app"
    : "https://storage.googleapis.com/birdzy-app-dev.firebasestorage.app";
};

/**
 * Get a full Firebase Storage URL for a given path
 * @param path - Storage path (e.g., 'scraped/mindat_images/quartz/quartz_1.jpg')
 * @returns Full storage URL
 */
export const getFirebaseStorageUrl = (path: string): string => {
  const baseUrl = getFirebaseStorageBaseUrl();
  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${baseUrl}/${cleanPath}`;
};

/**
 * Get mock asset URL (for test/mock data)
 * Uses environment-aware storage URL
 */
export const getMockAssetUrl = (path: string): string => {
  return getFirebaseStorageUrl(path);
};
