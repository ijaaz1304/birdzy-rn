/**
 * Background Task Service
 * Handles periodic background data refresh
 * Uses AppState to detect when app comes to foreground
 */

import { AppState, AppStateStatus } from "react-native";
import { getCacheAge, CACHE_KEYS } from "../cache/dataCache.service";
import { getRemoteConfigValue } from "../remoteConfig";

let backgroundTaskInterval: NodeJS.Timeout | null = null;
let appStateSubscription: any = null;

/**
 * Refresh data in background (non-blocking)
 */
const refreshDataInBackground = async (): Promise<void> => {
  try {
    const cacheRefreshInterval = getRemoteConfigValue(
      "dataCacheRefreshIntervalHours"
    );
    const _catalogueTtlHours =
      getRemoteConfigValue("catalogueCacheTtlHours") ?? 168;

    const keysWithInterval: { key: string; ttlHours: number }[] = [
      { key: CACHE_KEYS.CATEGORIES, ttlHours: cacheRefreshInterval },
      { key: CACHE_KEYS.CATALOGUE, ttlHours: cacheRefreshInterval },
      // { key: CACHE_KEYS.CATALOGUE_FIRST, ttlHours: catalogueTtlHours }, // no longer used
      { key: CACHE_KEYS.COLLECTION, ttlHours: cacheRefreshInterval },
      { key: CACHE_KEYS.MARKETPLACE, ttlHours: cacheRefreshInterval },
      { key: CACHE_KEYS.ARCHETYPES, ttlHours: cacheRefreshInterval },
      { key: CACHE_KEYS.SPECIMENS, ttlHours: cacheRefreshInterval },
      { key: CACHE_KEYS.COLLECTIONS, ttlHours: cacheRefreshInterval },
    ];

    const { clearCache } = require("../cache/dataCache.service");
    for (const { key, ttlHours } of keysWithInterval) {
      const age = await getCacheAge(key);
      if (age !== null && age >= ttlHours) {
        await clearCache(key);
        if (__DEV__)
          console.log(`Cache expired for ${key}, marked for refresh`);
      }
    }
  } catch (error) {
    if (__DEV__) console.warn("Background refresh error:", error);
  }
};

/**
 * Initialize background task service
 */
export const initializeBackgroundTasks = (): void => {
  // Check cache age when app comes to foreground
  appStateSubscription = AppState.addEventListener(
    "change",
    (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        // App came to foreground, check if cache needs refresh
        refreshDataInBackground().catch(() => {
          // Silently fail
        });
      }
    }
  );

  // Set up periodic background check (every hour)
  backgroundTaskInterval = setInterval(() => {
    refreshDataInBackground().catch(() => {
      // Silently fail
    });
  }, 60 * 60 * 1000); // 1 hour

  if (__DEV__) {
    console.log("✅ Background tasks initialized");
  }
};

/**
 * Stop background tasks
 */
export const stopBackgroundTasks = (): void => {
  if (backgroundTaskInterval) {
    clearInterval(backgroundTaskInterval);
    backgroundTaskInterval = null;
  }

  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }

  if (__DEV__) {
    console.log("Background tasks stopped");
  }
};

/**
 * Force refresh all cached data
 */
export const forceRefreshAllCache = async (): Promise<void> => {
  const { clearAllCache } = require("../cache/dataCache.service");
  await clearAllCache();

  if (__DEV__) {
    console.log("All cache cleared, will refresh on next fetch");
  }
};
