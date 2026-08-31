/**
 * Storage Constants
 * Centralized local storage keys for AsyncStorage
 * This prevents key conflicts and makes it easy to audit what's stored
 */

/** Screen navigation and feature flags — Birdzy-specific storage keys */
export const SCREEN_STORAGE_KEYS = {
  /** Species of the Day banner closed timestamp */
  MUSHROOM_OF_DAY_CLOSED_AT: "birdzy_species_of_day_banner_closed_at",
  /** Last seen Species of the Day entry */
  MUSHROOM_OF_DAY_LAST_SEEN: "@birdzy_species_of_day_last_seen",
  /** Current Species of the Day streak count */
  MUSHROOM_OF_DAY_STREAK: "@birdzy_species_of_day_streak",
  /** Species of the Day refresh count today */
  MUSHROOM_OF_DAY_REFRESH_COUNT: "@birdzy_species_of_day_refresh_count",
  /** @deprecated Use MUSHROOM_OF_DAY_CLOSED_AT */
  ROCK_OF_DAY_CLOSED_AT: "birdzy_species_of_day_banner_closed_at",
  /** @deprecated Use MUSHROOM_OF_DAY_LAST_SEEN */
  ROCK_OF_DAY_LAST_SEEN: "@birdzy_species_of_day_last_seen",
  /** @deprecated Use MUSHROOM_OF_DAY_STREAK */
  ROCK_OF_DAY_STREAK: "@birdzy_species_of_day_streak",
  /** @deprecated Use MUSHROOM_OF_DAY_REFRESH_COUNT */
  ROCK_OF_DAY_REFRESH_COUNT: "@birdzy_species_of_day_refresh_count",
  /** Camera tips onboarding shown flag */
  HAS_SEEN_CAMERA_TIPS: "hasSeenCameraTips",
  /** Camera permission attempt count */
  CAMERA_PERMISSION_ATTEMPT_COUNT: "cameraPermissionAttemptCount",
  /** Location permission native-dialog denial count */
  LOCATION_PERMISSION_DENIAL_COUNT: "locationPermissionDenialCount",
  /** Native notification dialog already shown (Allow or Don't Allow) */
  NOTIFICATION_PERMISSION_PROMPTED: "notificationPermissionPrompted",
} as const;

/** Session and analytics tracking */
export const SESSION_STORAGE_KEYS = {
  /** Total app launch count across all sessions */
  APP_LAUNCH_COUNT: "APP_LAUNCH_SESSION_COUNT",
  /** Flag: if session launch was already counted today */
  SESSION_COUNTED_FLAG: "SESSION_COUNTED_FLAG",
  /** Notification session count */
  NOTIF_SESSION: "NOTIF_SESSION_KEY",
  /** Flag: if rate us was shown for this session */
  RATE_US_COUNTED: "RATE_US_SESSION_COUNTED_FLAG",
  /** Last session timestamp */
  LAST_SESSION_TIMESTAMP: "LAST_SESSION_TIMESTAMP",
  /** First time app was opened ever */
  FIRST_APP_OPEN_AT: "FIRST_APP_OPEN_AT",
} as const;

/** Feature usage tracking - Ask AI and Quiz */
export const FEATURE_USAGE_KEYS = {
  /** Ask AI - last query date */
  ASK_AI_DATE: "askAiQueryDate",
  /** Ask AI - query count for today */
  ASK_AI_COUNT: "askAiQueryCount",
  /** Quiz - last flow date */
  QUIZ_DATE: "quizFlowDate",
  /** Quiz - flow count for today */
  QUIZ_COUNT: "quizFlowCount",
} as const;

/** Identification and usage limits */
export const IDENTIFICATION_STORAGE_KEYS = {
  /** @deprecated Legacy combined photo counter — migrated to PHOTO_* */
  DATE: "identificationUsageDate",
  /** @deprecated Legacy combined photo counter — migrated to PHOTO_* */
  COUNT: "identificationUsageCount",
  PHOTO_DATE: "photoIdentificationUsageDate",
  PHOTO_COUNT: "photoIdentificationUsageCount",
  SOUND_DATE: "soundIdentificationUsageDate",
  SOUND_COUNT: "soundIdentificationUsageCount",
  /** Lifetime successful identifications (all users) */
  LIFETIME_COUNT: "identificationLifetimeCount",
  /** Milestone count (1, 5, 10) to show on Home after identification completes */
  PENDING_MILESTONE: "identificationPendingMilestone",
  /** First-time safety disclaimer before opening identification details */
  HAS_SEEN_SAFETY_WARNING: "hasSeenIdentificationSafetyWarning",
} as const;

export const IDENTIFICATION_MILESTONE_COUNTS = [1, 5, 10] as const;

/** Analytics tracking */
export const ANALYTICS_STORAGE_KEYS = {
  /** First open event sent flag */
  FIRST_OPEN: "@analytics_first_open_done",
  /** First open date for tracking */
  FIRST_OPEN_DATE: "@analytics_first_open_date",
  /** App open day event sent flag */
  APP_OPEN_DAY_SENT: "@analytics_app_open_day_sent",
} as const;

/** UI state and preferences */
export const UI_STATE_KEYS = {
  /** App logs tooltip shown flag */
  APP_LOGS_TOOLTIP_SHOWN: "app_logs_tooltip_shown",
  /** FTUE already auto-switched away from Home once (or user returned to Home explicitly). */
  FTUE_AUTO_LEFT_HOME: "ftue_auto_left_home",
  /** Theme preference storage key (Birdzy-specific) */
  THEME: "birdzy-theme-storage",
  /**
   * JSON: { userId: string; ms: number } — last feed Firestore notification time
   * shown via Notifee on Collection focus (avoids spam / duplicates).
   */
  FEED_NOTIF_NOTIFEE_WATERMARK: "birdzy_feed_notif_watermark_v1",
} as const;

/** Feed — hidden/reported posts (per-user, device-local) */
export const FEED_STORAGE_KEYS = {
  HIDDEN_POST_IDS_PREFIX: "@feed_hidden_post_ids_",
  REPORTED_POST_IDS_PREFIX: "@feed_reported_post_ids_",
} as const;

/** User data and preferences — Birdzy-specific keys */
export const USER_STORAGE_KEYS = {
  /** Authentication storage */
  AUTH: "birdzy-auth-storage",
  /** Subscription status storage */
  SUBSCRIPTION: "birdzy-subscription-storage",
  /** User notifications storage */
  NOTIFICATIONS: "birdzy-notifications-storage",
  /** Rate us prompt shown flag */
  RATE_US: "birdzy-rate-us-storage",
} as const;

/**
 * Consolidated helper to export all keys
 * Useful for bulk operations like logout clearing storage.
 * Use clearSessionStorage() — it preserves PRESERVED_STORAGE_KEYS_ON_LOGOUT.
 */
export const ALL_STORAGE_KEYS = {
  ...SCREEN_STORAGE_KEYS,
  ...SESSION_STORAGE_KEYS,
  ...FEATURE_USAGE_KEYS,
  ...IDENTIFICATION_STORAGE_KEYS,
  ...ANALYTICS_STORAGE_KEYS,
  ...UI_STATE_KEYS,
  ...FEED_STORAGE_KEYS,
  ...USER_STORAGE_KEYS,
} as const;
