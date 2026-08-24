/**
 * Zustand Cache Helper
 * Unified approach: Zustand (in-memory) + Cache Service (AsyncStorage with TTL)
 *
 * Flow:
 * 1. Check Zustand store (in-memory, fastest) - if exists and fresh, use it
 * 2. Check Cache Service (AsyncStorage with TTL) - if valid, load into Zustand and use it
 * 3. Call API - update both Zustand and Cache
 */

import {
  getCachedDataIfValid,
  setCachedData,
  isCacheValid,
  CACHE_KEYS,
} from "./dataCache.service";

export interface CachedZustandCallOptions {
  forceRefresh?: boolean;
  ttlHours?: number;
  cacheKey: string;
}

/**
 * Execute API call with Zustand + Cache integration
 *
 * @param cacheKey - Cache key from CACHE_KEYS
 * @param zustandGetter - Function to get data from Zustand store (returns T | null)
 * @param zustandSetter - Function to set data in Zustand store
 * @param apiCall - Function that returns Promise<T>
 * @param options - Cache options
 * @returns Fresh data (from cache or API)
 */
export const cachedZustandCall = async <T>(
  cacheKey: string,
  zustandGetter: () => T | null,
  zustandSetter: (data: T) => void,
  apiCall: () => Promise<T>,
  options?: CachedZustandCallOptions
): Promise<T> => {
  const forceRefresh = options?.forceRefresh || false;

  // Step 1: Check Zustand store first (in-memory, fastest)
  const zustandData = zustandGetter();
  if (zustandData !== null && !forceRefresh) {
    // Data exists in Zustand - check if cache is still valid
    const cacheValid = await isCacheValid(cacheKey, options?.ttlHours);
    if (cacheValid) {
      // Zustand has data AND cache is valid - return Zustand data immediately
      // Refresh in background for next time
      Promise.resolve().then(async () => {
        try {
          const fresh = await apiCall();
          zustandSetter(fresh);
          await setCachedData(cacheKey, fresh);
        } catch {
          // Silently fail background refresh
        }
      });

      return zustandData;
    }
    // Cache expired but Zustand has data - still return it, but fetch fresh
    Promise.resolve().then(async () => {
      try {
        const fresh = await apiCall();
        zustandSetter(fresh);
        await setCachedData(cacheKey, fresh);
      } catch {
        // Silently fail
      }
    });

    return zustandData;
  }

  // Step 2: Zustand is empty or force refresh - check cache service
  if (!forceRefresh) {
    const cached = await getCachedDataIfValid<T>(cacheKey, options);
    if (cached !== null) {
      // Cache is valid - load into Zustand and return
      zustandSetter(cached);

      // Refresh in background
      Promise.resolve().then(async () => {
        try {
          const fresh = await apiCall();
          zustandSetter(fresh);
          await setCachedData(cacheKey, fresh);
        } catch {
          // Silently fail
        }
      });

      return cached;
    }
  }

  // Step 3: No cache or force refresh - call API
  const fresh = await apiCall();

  // Update both Zustand and cache
  zustandSetter(fresh);
  await setCachedData(cacheKey, fresh);

  return fresh;
};

/**
 * Execute API call with Zustand + Cache (returns both cached and fresh)
 * Useful when you want to show cached immediately and update with fresh
 */
export const cachedZustandCallWithUpdate = async <T>(
  cacheKey: string,
  zustandGetter: () => T | null,
  zustandSetter: (data: T) => void,
  apiCall: () => Promise<T>,
  options?: CachedZustandCallOptions
): Promise<{ cached: T | null; fresh: T }> => {
  const forceRefresh = options?.forceRefresh || false;

  // Check Zustand first
  const zustandData = zustandGetter();
  let cached: T | null = null;

  if (zustandData !== null && !forceRefresh) {
    cached = zustandData;
  } else {
    // Check cache service
    if (!forceRefresh) {
      cached = await getCachedDataIfValid<T>(cacheKey, options);
      if (cached) {
        zustandSetter(cached);
      }
    }
  }

  // Always fetch fresh
  const fresh = await apiCall();

  // Update both Zustand and cache
  zustandSetter(fresh);
  await setCachedData(cacheKey, fresh);

  return { cached, fresh };
};

/**
 * Clear both Zustand and cache
 */
export const clearZustandCache = async <_T>(
  cacheKey: string,
  zustandSetter: (data: null) => void
): Promise<void> => {
  const { clearCache } = require("./dataCache.service");
  zustandSetter(null as any);
  await clearCache(cacheKey);
};
