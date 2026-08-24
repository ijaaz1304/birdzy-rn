/**
 * Data Cache Service
 * Handles caching of API responses with TTL (Time To Live)
 * Automatically refreshes data after cache expiry (default: 12 hours)
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRemoteConfigValue } from "../remoteConfig";

// Cache prefixes - get from remote config with fallback
// Note: These are evaluated once at module load, but remote config should be initialized before cache is used
let CACHE_PREFIX = "data_cache_";
let CACHE_TIMESTAMP_PREFIX = "cache_timestamp_";

// Initialize cache prefixes from remote config
const initializeCachePrefixes = () => {
  try {
    CACHE_PREFIX = getRemoteConfigValue("cachePrefix") || "data_cache_";
    CACHE_TIMESTAMP_PREFIX =
      getRemoteConfigValue("cacheTimestampPrefix") || "cache_timestamp_";
  } catch {
    // Use defaults if remote config not available
    CACHE_PREFIX = "data_cache_";
    CACHE_TIMESTAMP_PREFIX = "cache_timestamp_";
  }
};

// Initialize on module load (remote config should be initialized in App.tsx before this)
initializeCachePrefixes();
const DEFAULT_CACHE_TTL_HOURS = 12;

export interface CacheOptions {
  ttlHours?: number; // Time to live in hours (default: 12)
  forceRefresh?: boolean; // Force refresh even if cache is valid
}

/**
 * Get cache key for a given data key
 */
const getCacheKey = (key: string): string => `${CACHE_PREFIX}${key}`;
const getTimestampKey = (key: string): string =>
  `${CACHE_TIMESTAMP_PREFIX}${key}`;

/**
 * Check if cached data is still valid
 */
export const isCacheValid = async (
  key: string,
  ttlHours?: number
): Promise<boolean> => {
  try {
    const timestampKey = getTimestampKey(key);
    const timestamp = await AsyncStorage.getItem(timestampKey);

    if (!timestamp) {
      return false; // No cache exists
    }

    const cacheAge = Date.now() - parseInt(timestamp, 10);
    const ttl =
      ttlHours ||
      getRemoteConfigValue("dataCacheRefreshIntervalHours") ||
      DEFAULT_CACHE_TTL_HOURS;
    const ttlMs = ttl * 60 * 60 * 1000;

    return cacheAge < ttlMs;
  } catch {
    return false;
  }
};

/**
 * Get cached data
 */
export const getCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    const cacheKey = getCacheKey(key);
    const cached = await AsyncStorage.getItem(cacheKey);

    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as T;
  } catch {
    return null;
  }
};

/**
 * Set cached data with timestamp
 */
export const setCachedData = async <T>(key: string, data: T): Promise<void> => {
  try {
    const cacheKey = getCacheKey(key);
    const timestampKey = getTimestampKey(key);

    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    await AsyncStorage.setItem(timestampKey, Date.now().toString());
  } catch (error) {
    console.warn(`Failed to cache data for key ${key}:`, error);
  }
};

/**
 * Get cached data if valid, otherwise return null
 */
export const getCachedDataIfValid = async <T>(
  key: string,
  options?: CacheOptions
): Promise<T | null> => {
  const isValid = await isCacheValid(key, options?.ttlHours);

  if (!isValid && !options?.forceRefresh) {
    return null;
  }

  return getCachedData<T>(key);
};

/**
 * Clear cached data
 */
export const clearCache = async (key: string): Promise<void> => {
  try {
    const cacheKey = getCacheKey(key);
    const timestampKey = getTimestampKey(key);

    await AsyncStorage.removeItem(cacheKey);
    await AsyncStorage.removeItem(timestampKey);
  } catch (error) {
    console.warn(`Failed to clear cache for key ${key}:`, error);
  }
};

/**
 * Clear all cached data
 */
export const clearAllCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(
      (key) =>
        key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_TIMESTAMP_PREFIX)
    );

    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.warn("Failed to clear all cache:", error);
  }
};

/**
 * Get cache age in hours
 */
export const getCacheAge = async (key: string): Promise<number | null> => {
  try {
    const timestampKey = getTimestampKey(key);
    const timestamp = await AsyncStorage.getItem(timestampKey);

    if (!timestamp) {
      return null;
    }

    const cacheAge = Date.now() - parseInt(timestamp, 10);
    return cacheAge / (1000 * 60 * 60); // Convert to hours
  } catch {
    return null;
  }
};

/**
 * Cache keys for different data types
 */
export const CACHE_KEYS = {
  CATEGORIES: "categories",
  CATALOGUE: "catalogue",
  COLLECTION: "collection",
  MARKETPLACE: "marketplace",
  FIREBASE_FEED: "firebase_feed",
  ARCHETYPES: "archetypes",
  SPECIMENS: "specimens",
  COLLECTIONS: "collections",
} as const;
