/**
 * App Constants
 * Centralized constants for the application
 * These values can be overridden by Remote Config
 * No hardcoded values in components
 */

import { getRemoteConfigValue } from "../services/remoteConfig/remoteConfig.service";

// Helper to get pagination values from remote config with fallback
const getPaginationValue = (key: string, fallback: number): number => {
  try {
    return getRemoteConfigValue(key as any) || fallback;
  } catch {
    return fallback;
  }
};

// Pagination Constants - Now dynamic from Remote Config
export const PAGINATION = {
  get DEFAULT_PAGE_SIZE() {
    return getPaginationValue("defaultPageSize", 10);
  },
  get HOME_PAGE_SIZE() {
    return getPaginationValue("homePageSize", 100);
  },
  get CATALOGUE_PAGE_SIZE() {
    return getPaginationValue("cataloguePageSize", 100);
  },
  get COLLECTION_PAGE_SIZE() {
    return getPaginationValue("collectionPageSize", 50);
  },
  get FEED_PAGE_SIZE() {
    return getPaginationValue("feedPageSize", 20);
  },
  get HOME_DISPLAY_COUNT() {
    return getPaginationValue("homeDisplayCount", 4);
  },
  INITIAL_PAGE: 0, // Always 0, not configurable
} as const;

// Authentication Wait Constants - Now dynamic from Remote Config
export const AUTH_WAIT = {
  get MAX_WAIT_TIME_MS() {
    return getPaginationValue("apiAuthWaitTimeoutMs", 5000);
  },
  get CHECK_INTERVAL_MS() {
    return getPaginationValue("apiAuthCheckIntervalMs", 100);
  },
} as const;

// Category Constants
export const CATEGORIES = {
  ALL: "All",
  NEAR_YOU: "Near you",
  RAPTORS: "Raptors",
  SONGBIRDS: "Songbirds",
  WATER_BIRDS: "Water birds",
  THREATENED: "Threatened",
  SOARING: "Soaring",
  /** @deprecated Mushroom tabs — kept for route compat */
  EDIBLE: "Edible",
  INEDIBLE: "Inedible",
  TOXIC: "Toxic",
  PSYCHOACTIVE: "Psychoactive",
  ON_WOOD: "On wood",
} as const;

/** Rock personality and legacy home category flows — off for Birdzy. */
export const SHOW_LEGACY_ROCK_FLOWS = false;

// Collection Limits
export const COLLECTION_LIMITS = {
  /** Maximum number of items (specimens) allowed per collection */
  MAX_ITEMS_PER_COLLECTION: 100,
} as const;

/** Free users can create this many user-created collections (Identified/Wishlist/Owned not counted). Backend returns 403 when exceeded. */
export const FREE_COLLECTION_LIMIT = 2;

/**
 * Backend/system collection names — do not count toward {@link FREE_COLLECTION_LIMIT}.
 * Must stay aligned with CollectionDetailsScreen special cases (Identified / Wishlist / Owned).
 */
export const SYSTEM_COLLECTION_NAMES = [
  "Identified",
  "Wishlist",
  "Owned",
] as const;

export function isUserCreatedCollectionName(name: string): boolean {
  return !SYSTEM_COLLECTION_NAMES.includes(
    name as (typeof SYSTEM_COLLECTION_NAMES)[number]
  );
}

/** Free users can add this many specimens in total across all collections. Backend returns 403 when exceeded; we check before calling specimen/add to show upgrade sheet without calling API. */
export const FREE_SPECIMEN_LIMIT = 100;

/** Free users can store this many clips in the sound recording gallery. */
export const FREE_AUDIO_GALLERY_LIMIT = 20;

/** Special collection targets in Add to Collection flow (identified / wishlist flags on specimen/add). */
export const ADD_TO_COLLECTION_IDS = {
  IDENTIFIED: "__identified__",
  WISHLIST: "__wishlist__",
} as const;

// Entry Type Constants (for filters)
export const ENTRY_TYPES = {
  // Keep in sync with backend:
  // - minerals: entryType = 0
  // - rocks: entryType = 7
  MINERAL: 0,
  ROCK: 7,
} as const;

// Discount Constants - Now dynamic from Remote Config
export const DISCOUNT = {
  get DEFAULT_PERCENTAGE() {
    try {
      return getRemoteConfigValue("discountDefaultPercentage") || 50;
    } catch {
      return 50;
    }
  },
  get DEFAULT_DURATION_SECONDS() {
    try {
      return getRemoteConfigValue("discountDefaultDurationSeconds") || 20 * 60;
    } catch {
      return 20 * 60;
    }
  },
  COUNTDOWN_UPDATE_INTERVAL_MS: 1000, // 1 second - UI update interval, not configurable
} as const;

// FlatList Performance Constants
export const FLATLIST_CONFIG = {
  INITIAL_NUM_TO_RENDER: 10,
  MAX_TO_RENDER_PER_BATCH: 10,
  WINDOW_SIZE: 5,
  UPDATE_CELLS_BATCHING_PERIOD: 50,
  REMOVE_CLIPPED_SUBVIEWS: true,
} as const;

// Skeleton Loading Constants
export const SKELETON_COUNTS = {
  HOME_MINERALS: 6,
  CATALOGUE: 6,
  COLLECTION: 4,
  FEED: 5,
} as const;

// Timing Constants - Now dynamic from Remote Config
export const TIMING = {
  get DELAY_BEFORE_INTERACTION_MS() {
    try {
      return getRemoteConfigValue("timingDelayBeforeInteractionMs") || 1000;
    } catch {
      return 1000;
    }
  },
  COUNTDOWN_THROTTLE_MS: 1000, // Update countdown max once per second - UI throttle, not configurable
} as const;

// Placeholder Constants
export const PLACEHOLDERS = {
  IMAGE_URI: "https://via.placeholder.com/100",
  PICSUM_URI: "https://picsum.photos/200",
} as const;
