/**
 * Cached API Call Helper
 * Wraps API calls with caching logic
 * Returns cached data if valid, otherwise fetches fresh data
 */

import {
  getCachedDataIfValid,
  setCachedData,
  CACHE_KEYS,
  CacheOptions,
} from "./dataCache.service";

/**
 * Execute API call with caching
 * @param cacheKey - Cache key from CACHE_KEYS
 * @param apiCall - Function that returns Promise<T>
 * @param options - Cache options
 * @returns Cached data if valid, otherwise fresh data from API
 */
export const cachedApiCall = async <T>(
  cacheKey: string,
  apiCall: () => Promise<T>,
  options?: CacheOptions
): Promise<T> => {
  // Try to get cached data first
  const cached = await getCachedDataIfValid<T>(cacheKey, options);

  if (cached !== null && !options?.forceRefresh) {
    // Return cached data immediately (non-blocking)
    // Fetch fresh data in background for next time
    Promise.resolve().then(async () => {
      try {
        const fresh = await apiCall();
        await setCachedData(cacheKey, fresh);
      } catch {
        // Silently fail background refresh
      }
    });

    return cached;
  }

  // Cache invalid or force refresh - fetch fresh data
  const fresh = await apiCall();
  await setCachedData(cacheKey, fresh);

  return fresh;
};

/**
 * Execute API call with caching (returns both cached and fresh)
 * Useful when you want to show cached data immediately and update with fresh data
 */
export const cachedApiCallWithUpdate = async <T>(
  cacheKey: string,
  apiCall: () => Promise<T>,
  options?: CacheOptions
): Promise<{ cached: T | null; fresh: T }> => {
  const cached = await getCachedDataIfValid<T>(cacheKey, options);
  const fresh = await apiCall();

  // Update cache with fresh data
  await setCachedData(cacheKey, fresh);

  return { cached, fresh };
};
