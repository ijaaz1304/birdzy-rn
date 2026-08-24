/**
 * Remote Config Service
 * Handles Firebase Remote Config initialization and parameter retrieval
 *
 * All Remote Config parameters with their defaults are defined here.
 * Values are cached for performance and refreshed periodically.
 */

import {
  firebaseRemoteConfig,
  isFirebaseInitialized,
} from "../../lib/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QUIZ_MUSHROOM_IMAGE_DEFAULTS } from "../../config/mushroomImageUrls.config";

const REMOTE_CONFIG_CACHE_KEY = "remote_config_cache";
const REMOTE_CONFIG_CACHE_TIMESTAMP_KEY = "remote_config_cache_timestamp";
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour - don't fetch more often

const RC_LOG = "[REMOTE_CONFIG]";

interface RemoteConfigValues {
  // Rate Us
  rateUsCooldownDays: number;
  /** 1 = wait rateUsFirstShowDays after install; 0 = session-based (rateUsFirstSession). */
  rateUsUseDaysGate: number;
  /** Days after first app open before first rate-us prompt (when rateUsUseDaysGate is 1). */
  rateUsFirstShowDays: number;
  rateUsFirstSession: number;
  rateUsSessionInterval: number;

  // Notifications
  notificationCooldownDays: number;
  notificationSessionInterval: number;
  notificationIosSettingsThreshold: number;
  notificationAndroidSettingsThreshold: number;
  /** Home-screen location permission popup: 1st session, then every N sessions (6, 11, …). */
  locationSessionInterval: number;
  identificationReminderIntervalDays: number;
  inactivityTimeoutDays: number;

  // Subscription
  subscriptionSessionInterval: number;
  subscriptionDelayMs: number;
  subscriptionFirstSessionDiscount: number; // Discount percentage for first session (default: 70)
  /** 50% offer end time (Unix ms). When > 0 and Date.now() < value, show half_pack (yearly/lifetime). Default 0 = offer inactive. */
  subscription50OfferEndTs: number;

  // Discount
  discountTimerDurationHours: number;
  discountCycleDurationHours: number;
  discountDefaultPercentage: number;
  discountDefaultDurationSeconds: number;
  discountBannerCooldownHours: number;
  discountBannerShowDelayMs: number;
  /** When 1, show subscription discount bottom sheet while the discount timer is active. */
  discountPopupShowWhenTimerActive: number;
  /** Hours between discount popup displays (separate from banner cooldown). */
  discountPopupCooldownHours: number;

  // Version Check
  versionCheckCooldownHours: number;
  versionCheckSessionInterval: number;

  // Limits
  freeUserDailyScanLimit: number;
  /** Free user: max photo identifications per day. Falls back to freeUserDailyScanLimit. */
  freeUserDailyPhotoScanLimit: number;
  /** Free user: max sound identifications per day. Falls back to freeUserDailyScanLimit. */
  freeUserDailySoundScanLimit: number;
  /** Free user: max feed posts per day. Default 1. */
  freeUserDailyFeedPostLimit: number;

  // Purchase Validation
  purchaseValidationMaxAttempts: number;
  purchaseValidationDelayMs: number;

  // Post Retention
  regularUserPostRetentionDays: number;
  premiumUserPostRetentionDays: number;

  // Data Cache
  dataCacheRefreshIntervalHours: number;

  // Guest Login & Navigation
  guestLoginTimeoutMs: number;
  splashScreenDelayMs: number;
  splashStoreHydrationDelayMs: number;
  onboardingNavigationDelayMs: number;
  guestLoginNavigationDelayMs: number;

  // API Configuration
  apiTimeoutMs: number;
  apiAuthWaitTimeoutMs: number;
  apiAuthCheckIntervalMs: number;

  // Pagination
  defaultPageSize: number;
  homePageSize: number;
  cataloguePageSize: number;
  collectionPageSize: number;
  feedPageSize: number;
  homeDisplayCount: number;

  // Catalogue cache (first 100 for 7 days)
  catalogueCacheTtlHours: number;

  // Performance
  networkFailureHistoryLimit: number;
  traceNameMaxLength: number;

  // Cache Configuration
  cachePrefix: string;
  cacheTimestampPrefix: string;

  // Timing
  timingDelayBeforeInteractionMs: number;

  // Mineral / Rock of the Day
  /** First app session when auto Mushroom of the Day popup may appear (default 3). */
  mushroomOfTheDayFirstSession: number;
  mushroomOfTheDayPopupCooldownHours: number;

  /** When false, app uses light mode only (ignores theme preference and system). For first prod deployment. Default false. */
  darkModeEnabled: boolean;

  /**
   * Dark Mode A/B experiment default theme source.
   * Values: "system" | "light" | "variant_a" | "variant_b"
   * - system / variant_a → follow device theme, Appearance visible
   * - light / variant_b → locked to light, Appearance hidden
   */
  theme_default: string;

  /** When true, Settings shows App Logs diagnostics and in-app log capture is allowed. Default false. */
  appLogsEnabled: boolean;

  /** When true, iOS App Store subscription purchase/restore flows are enabled. Default true. */
  appleSubscriptionsEnabled: boolean;

  /** Android Play Store app URL (e.g. https://play.google.com/store/apps/details?id=com.trackzio.birds). Overridable via Remote Config. */
  androidPlayStoreUrl: string;
  /** iOS App Store app URL (e.g. https://apps.apple.com/app/id6758651735). Overridable via Remote Config. */
  iosAppStoreUrl: string;

  /** Privacy Policy page URL. Overridable via Remote Config. */
  privacyPolicyUrl: string;
  /** Terms of Service page URL. Overridable via Remote Config. */
  termsOfServiceUrl: string;

  // Quiz: "Which Mushroom Are You?"
  quizEnabled: number; // 1 = enabled, 0 = disabled
  quizMushroomImage_porcini: string;
  quizMushroomImage_reishi: string;
  quizMushroomImage_oyster_mushroom: string;
  quizMushroomImage_wild_enoki: string;
  quizMushroomImage_fly_agaric: string;
  quizMushroomImage_lions_mane: string;
  quizMushroomImage_morel: string;
  quizMushroomImage_winter_chanterelle: string;
}

// Default values (fallback if Remote Config fails)
const DEFAULT_CONFIG: RemoteConfigValues = {
  rateUsCooldownDays: 3,
  rateUsUseDaysGate: 1,
  rateUsFirstShowDays: 7,
  rateUsFirstSession: 2,
  rateUsSessionInterval: 5,
  notificationCooldownDays: 3,
  notificationSessionInterval: 5,
  notificationIosSettingsThreshold: 2,
  notificationAndroidSettingsThreshold: 2,
  locationSessionInterval: 5,
  identificationReminderIntervalDays: 2,
  inactivityTimeoutDays: 3,
  subscriptionSessionInterval: 5,
  subscriptionDelayMs: 2000,
  subscriptionFirstSessionDiscount: 70, // 70% discount for first session
  subscription50OfferEndTs: 0, // 0 = no 50% offer; set to Unix ms (e.g. now + 24h) to enable
  discountTimerDurationHours: 24,
  discountCycleDurationHours: 48,
  discountDefaultPercentage: 50,
  discountDefaultDurationSeconds: 20 * 60, // 20 minutes in seconds
  discountBannerCooldownHours: 24,
  discountBannerShowDelayMs: 0,
  discountPopupShowWhenTimerActive: 1,
  discountPopupCooldownHours: 24,
  versionCheckCooldownHours: 24,
  versionCheckSessionInterval: 5,
  freeUserDailyScanLimit: 2,
  freeUserDailyPhotoScanLimit: 2,
  freeUserDailySoundScanLimit: 2,
  freeUserDailyFeedPostLimit: 1,
  purchaseValidationMaxAttempts: 5,
  purchaseValidationDelayMs: 3000,
  regularUserPostRetentionDays: 30,
  premiumUserPostRetentionDays: 90,
  dataCacheRefreshIntervalHours: 12,
  // Guest Login & Navigation - optimized for faster UX
  guestLoginTimeoutMs: 30000, // 30 seconds - match API timeout so emulator/slow networks can complete
  splashScreenDelayMs: 800, // Splash screen minimum display time
  splashStoreHydrationDelayMs: 100, // Delay for store hydration check
  onboardingNavigationDelayMs: 0, // No delay for onboarding navigation
  guestLoginNavigationDelayMs: 400, // Brief delay after token save so persist can flush and home shows correctly

  // API Configuration
  apiTimeoutMs: 30000, // 30 seconds default API timeout
  apiAuthWaitTimeoutMs: 2000, // 2 seconds max wait for auth token (avoid blocking / unwanted loaders)
  apiAuthCheckIntervalMs: 80, // Check every 80ms for auth token

  // Pagination
  defaultPageSize: 10,
  homePageSize: 100,
  cataloguePageSize: 100,
  collectionPageSize: 50,
  feedPageSize: 20,
  homeDisplayCount: 4,
  catalogueCacheTtlHours: 168, // 7 days for first 100

  // Performance
  networkFailureHistoryLimit: 10, // Keep last 10 network failures
  traceNameMaxLength: 50, // Max length for trace names

  // Cache Configuration
  cachePrefix: "data_cache_",
  cacheTimestampPrefix: "cache_timestamp_",

  // Timing
  timingDelayBeforeInteractionMs: 1000, // 1 second delay before allowing interactions

  mushroomOfTheDayFirstSession: 3,
  mushroomOfTheDayPopupCooldownHours: 24, // Don't show Rock of the Day banner again for 24h after close

  darkModeEnabled: true,
  theme_default: "system", // Variant A default; Firebase A/B can assign "light" / "variant_b"
  appLogsEnabled: false, // Settings → App Logs hidden in prod unless enabled via Remote Config
  appleSubscriptionsEnabled: true, // iOS App Store subscriptions on by default; set false via Remote Config to disable

  androidPlayStoreUrl:
    "https://play.google.com/store/apps/details?id=com.trackzio.birds",
  iosAppStoreUrl: "https://apps.apple.com/app/id6758651735",

  privacyPolicyUrl: "https://trackzio.com/privacy-policy-birdzy-ai",
  termsOfServiceUrl: "https://trackzio.com/birdzy-terms-of-service",

  // Quiz: "Which Mushroom Are You?" — defaults from archetype image URLs; override via Remote Config
  quizEnabled: 1,
  quizMushroomImage_porcini: QUIZ_MUSHROOM_IMAGE_DEFAULTS.porcini ?? "",
  quizMushroomImage_reishi: QUIZ_MUSHROOM_IMAGE_DEFAULTS.reishi ?? "",
  quizMushroomImage_oyster_mushroom:
    QUIZ_MUSHROOM_IMAGE_DEFAULTS.oyster_mushroom ?? "",
  quizMushroomImage_wild_enoki: QUIZ_MUSHROOM_IMAGE_DEFAULTS.wild_enoki ?? "",
  quizMushroomImage_fly_agaric: QUIZ_MUSHROOM_IMAGE_DEFAULTS.fly_agaric ?? "",
  quizMushroomImage_lions_mane: QUIZ_MUSHROOM_IMAGE_DEFAULTS.lions_mane ?? "",
  quizMushroomImage_morel: QUIZ_MUSHROOM_IMAGE_DEFAULTS.morel ?? "",
  quizMushroomImage_winter_chanterelle:
    QUIZ_MUSHROOM_IMAGE_DEFAULTS.winter_chanterelle ?? "",
};

let cachedConfig: RemoteConfigValues | null = null;
let isInitialized = false;

/** Max time to wait for first RC fetch when no local cache (theme A/B correctness). */
const FIRST_FETCH_TIMEOUT_MS = 2500;

export type InitializeRemoteConfigOptions = {
  /**
   * When true and no AsyncStorage cache exists, await first fetch/activate
   * (with timeout) so theme_default is known before the UI paints.
   * When cache exists, never blocks on network.
   */
  awaitFirstFetchIfNoCache?: boolean;
};

export const isRemoteConfigInitialized = (): boolean => isInitialized;

/**
 * Fetch from network and cache (call in background only; do not block startup).
 */
const fetchAndCacheInBackground = async (): Promise<void> => {
  try {
    const stale = await isCacheStale();
    if (!stale) {
      if (__DEV__) {
        console.log(RC_LOG, "Skip fetch (cache still fresh, 1hr TTL)");
      }
      return;
    }
    if (__DEV__) {
      console.log(RC_LOG, "Background fetch (cache stale or missing)");
    }
    await firebaseRemoteConfig.fetchAndActivate();
    await loadAndCacheConfig();
    if (__DEV__) {
      console.log(RC_LOG, "Background fetch done");
    }
  } catch (e) {
    if (__DEV__) {
      console.warn(RC_LOG, "Background fetch failed:", e);
    }
  }
};

/**
 * Initialize Remote Config with default values.
 * Prefer AsyncStorage cache (any age) for immediate reads; fetch in background.
 * Optionally await first network fetch when no cache exists (theme startup).
 */
export const initializeRemoteConfig = async (
  options?: InitializeRemoteConfigOptions
): Promise<void> => {
  if (isInitialized) {
    return;
  }

  const start = Date.now();
  const awaitFirstFetchIfNoCache = options?.awaitFirstFetchIfNoCache === true;

  try {
    if (!isFirebaseInitialized()) {
      if (__DEV__) {
        console.log(RC_LOG, "Firebase not ready, using defaults");
      }
      cachedConfig = { ...DEFAULT_CONFIG };
      isInitialized = true;
      return;
    }

    // 1) Load any cached values immediately (even if TTL expired) for theme/UI
    const hadAnyCache = await loadCachedConfigAnyAge();

    // 2) Fresh cache (< 1hr) also marks TTL as valid for skip-fetch logic
    const hadFreshCache = await loadCachedConfig();

    if (!cachedConfig) {
      cachedConfig = { ...DEFAULT_CONFIG };
      if (__DEV__) {
        console.log(RC_LOG, "No cache, using defaults until fetch");
      }
    }

    // 3) Set Firebase defaults/settings for when background fetch runs
    await firebaseRemoteConfig.setDefaults({
      rateUsCooldownDays: DEFAULT_CONFIG.rateUsCooldownDays,
      rateUsUseDaysGate: DEFAULT_CONFIG.rateUsUseDaysGate,
      rateUsFirstShowDays: DEFAULT_CONFIG.rateUsFirstShowDays,
      rateUsFirstSession: DEFAULT_CONFIG.rateUsFirstSession,
      rateUsSessionInterval: DEFAULT_CONFIG.rateUsSessionInterval,
      notificationCooldownDays: DEFAULT_CONFIG.notificationCooldownDays,
      notificationSessionInterval: DEFAULT_CONFIG.notificationSessionInterval,
      notificationIosSettingsThreshold:
        DEFAULT_CONFIG.notificationIosSettingsThreshold,
      notificationAndroidSettingsThreshold:
        DEFAULT_CONFIG.notificationAndroidSettingsThreshold,
      locationSessionInterval: DEFAULT_CONFIG.locationSessionInterval,
      identificationReminderIntervalDays:
        DEFAULT_CONFIG.identificationReminderIntervalDays,
      inactivityTimeoutDays: DEFAULT_CONFIG.inactivityTimeoutDays,
      subscriptionSessionInterval: DEFAULT_CONFIG.subscriptionSessionInterval,
      subscriptionDelayMs: DEFAULT_CONFIG.subscriptionDelayMs,
      subscriptionFirstSessionDiscount:
        DEFAULT_CONFIG.subscriptionFirstSessionDiscount,
      discountTimerDurationHours: DEFAULT_CONFIG.discountTimerDurationHours,
      discountCycleDurationHours: DEFAULT_CONFIG.discountCycleDurationHours,
      discountDefaultPercentage: DEFAULT_CONFIG.discountDefaultPercentage,
      discountDefaultDurationSeconds:
        DEFAULT_CONFIG.discountDefaultDurationSeconds,
      discountBannerCooldownHours: DEFAULT_CONFIG.discountBannerCooldownHours,
      discountBannerShowDelayMs: DEFAULT_CONFIG.discountBannerShowDelayMs,
      discountPopupShowWhenTimerActive:
        DEFAULT_CONFIG.discountPopupShowWhenTimerActive,
      discountPopupCooldownHours: DEFAULT_CONFIG.discountPopupCooldownHours,
      versionCheckCooldownHours: DEFAULT_CONFIG.versionCheckCooldownHours,
      versionCheckSessionInterval: DEFAULT_CONFIG.versionCheckSessionInterval,
      freeUserDailyScanLimit: DEFAULT_CONFIG.freeUserDailyScanLimit,
      freeUserDailyPhotoScanLimit: DEFAULT_CONFIG.freeUserDailyPhotoScanLimit,
      freeUserDailySoundScanLimit: DEFAULT_CONFIG.freeUserDailySoundScanLimit,
      freeUserDailyFeedPostLimit: DEFAULT_CONFIG.freeUserDailyFeedPostLimit,
      darkModeEnabled: DEFAULT_CONFIG.darkModeEnabled,
      theme_default: DEFAULT_CONFIG.theme_default,
      appLogsEnabled: DEFAULT_CONFIG.appLogsEnabled,
      appleSubscriptionsEnabled: DEFAULT_CONFIG.appleSubscriptionsEnabled,
      purchaseValidationMaxAttempts:
        DEFAULT_CONFIG.purchaseValidationMaxAttempts,
      purchaseValidationDelayMs: DEFAULT_CONFIG.purchaseValidationDelayMs,
      regularUserPostRetentionDays: DEFAULT_CONFIG.regularUserPostRetentionDays,
      premiumUserPostRetentionDays: DEFAULT_CONFIG.premiumUserPostRetentionDays,
      dataCacheRefreshIntervalHours:
        DEFAULT_CONFIG.dataCacheRefreshIntervalHours,
      guestLoginTimeoutMs: DEFAULT_CONFIG.guestLoginTimeoutMs,
      splashScreenDelayMs: DEFAULT_CONFIG.splashScreenDelayMs,
      splashStoreHydrationDelayMs: DEFAULT_CONFIG.splashStoreHydrationDelayMs,
      onboardingNavigationDelayMs: DEFAULT_CONFIG.onboardingNavigationDelayMs,
      guestLoginNavigationDelayMs: DEFAULT_CONFIG.guestLoginNavigationDelayMs,
      apiTimeoutMs: DEFAULT_CONFIG.apiTimeoutMs,
      apiAuthWaitTimeoutMs: DEFAULT_CONFIG.apiAuthWaitTimeoutMs,
      apiAuthCheckIntervalMs: DEFAULT_CONFIG.apiAuthCheckIntervalMs,
      defaultPageSize: DEFAULT_CONFIG.defaultPageSize,
      homePageSize: DEFAULT_CONFIG.homePageSize,
      cataloguePageSize: DEFAULT_CONFIG.cataloguePageSize,
      collectionPageSize: DEFAULT_CONFIG.collectionPageSize,
      feedPageSize: DEFAULT_CONFIG.feedPageSize,
      homeDisplayCount: DEFAULT_CONFIG.homeDisplayCount,
      catalogueCacheTtlHours: DEFAULT_CONFIG.catalogueCacheTtlHours,
      networkFailureHistoryLimit: DEFAULT_CONFIG.networkFailureHistoryLimit,
      traceNameMaxLength: DEFAULT_CONFIG.traceNameMaxLength,
      cachePrefix: DEFAULT_CONFIG.cachePrefix,
      cacheTimestampPrefix: DEFAULT_CONFIG.cacheTimestampPrefix,
      timingDelayBeforeInteractionMs:
        DEFAULT_CONFIG.timingDelayBeforeInteractionMs,
      mushroomOfTheDayFirstSession: DEFAULT_CONFIG.mushroomOfTheDayFirstSession,
      mushroomOfTheDayPopupCooldownHours:
        DEFAULT_CONFIG.mushroomOfTheDayPopupCooldownHours,
      quizEnabled: DEFAULT_CONFIG.quizEnabled,
      quizMushroomImage_porcini: DEFAULT_CONFIG.quizMushroomImage_porcini,
      quizMushroomImage_reishi: DEFAULT_CONFIG.quizMushroomImage_reishi,
      quizMushroomImage_oyster_mushroom:
        DEFAULT_CONFIG.quizMushroomImage_oyster_mushroom,
      quizMushroomImage_wild_enoki: DEFAULT_CONFIG.quizMushroomImage_wild_enoki,
      quizMushroomImage_fly_agaric: DEFAULT_CONFIG.quizMushroomImage_fly_agaric,
      quizMushroomImage_lions_mane: DEFAULT_CONFIG.quizMushroomImage_lions_mane,
      quizMushroomImage_morel: DEFAULT_CONFIG.quizMushroomImage_morel,
      quizMushroomImage_winter_chanterelle:
        DEFAULT_CONFIG.quizMushroomImage_winter_chanterelle,
      androidPlayStoreUrl: DEFAULT_CONFIG.androidPlayStoreUrl,
      iosAppStoreUrl: DEFAULT_CONFIG.iosAppStoreUrl,
      privacyPolicyUrl: DEFAULT_CONFIG.privacyPolicyUrl,
      termsOfServiceUrl: DEFAULT_CONFIG.termsOfServiceUrl,
    });

    await firebaseRemoteConfig.setConfigSettings({
      minimumFetchIntervalMillis: CACHE_DURATION_MS, // 1 hour
    });

    isInitialized = true;
    if (__DEV__) {
      console.log(
        RC_LOG,
        "Ready in",
        Date.now() - start,
        "ms (cache:",
        hadAnyCache ? (hadFreshCache ? "fresh" : "stale") : "no",
        ")"
      );
    }

    // 3) Cache exists → never block; refresh in background if stale
    if (hadAnyCache) {
      fetchAndCacheInBackground();
      return;
    }

    // 4) No cache: optionally wait briefly for first A/B assignment
    if (awaitFirstFetchIfNoCache) {
      try {
        if (__DEV__) {
          console.log(
            RC_LOG,
            "No cache — awaiting first fetch (max",
            FIRST_FETCH_TIMEOUT_MS,
            "ms)"
          );
        }
        await withTimeout(
          (async () => {
            await firebaseRemoteConfig.fetchAndActivate();
            await loadAndCacheConfig();
          })(),
          FIRST_FETCH_TIMEOUT_MS
        );
        if (__DEV__) {
          console.log(RC_LOG, "First fetch completed before UI");
        }
      } catch (error) {
        if (__DEV__) {
          console.warn(
            RC_LOG,
            "First fetch timed out or failed; using defaults + background fetch",
            error
          );
        }
        fetchAndCacheInBackground();
      }
      return;
    }

    fetchAndCacheInBackground();
  } catch (error) {
    if (__DEV__) {
      console.warn(RC_LOG, "Init failed, using defaults:", error);
    }
    cachedConfig = { ...DEFAULT_CONFIG };
    isInitialized = true;
  }
};

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });

/**
 * Load config from AsyncStorage regardless of TTL.
 * Used at startup so theme_default (and other keys) are available before UI paint.
 */
const loadCachedConfigAnyAge = async (): Promise<boolean> => {
  try {
    const cached = await AsyncStorage.getItem(REMOTE_CONFIG_CACHE_KEY);
    if (!cached) return false;
    cachedConfig = JSON.parse(cached);
    if (__DEV__) {
      const timestamp = await AsyncStorage.getItem(
        REMOTE_CONFIG_CACHE_TIMESTAMP_KEY
      );
      const ageSec = timestamp
        ? Math.round((Date.now() - parseInt(timestamp, 10)) / 1000)
        : -1;
      console.log(RC_LOG, "Loaded cache (any age)", ageSec, "s");
    }
    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn(RC_LOG, "Cache load (any age) failed:", error);
    }
    return false;
  }
};

/**
 * Load config from cache. Returns true if valid cache (< 1hr) was applied.
 */
const loadCachedConfig = async (): Promise<boolean> => {
  try {
    const cached = await AsyncStorage.getItem(REMOTE_CONFIG_CACHE_KEY);
    const timestamp = await AsyncStorage.getItem(
      REMOTE_CONFIG_CACHE_TIMESTAMP_KEY
    );

    if (cached && timestamp) {
      const cacheAge = Date.now() - parseInt(timestamp, 10);
      if (cacheAge < CACHE_DURATION_MS) {
        cachedConfig = JSON.parse(cached);
        if (__DEV__) {
          console.log(
            RC_LOG,
            "Using cache",
            "(age",
            Math.round(cacheAge / 1000),
            "s, skip fetch until 1hr)"
          );
        }
        return true;
      }
    }
  } catch (error) {
    if (__DEV__) {
      console.warn(RC_LOG, "Cache load failed:", error);
    }
  }
  return false;
};

/**
 * Returns true if cache is stale or missing (should fetch).
 */
const isCacheStale = async (): Promise<boolean> => {
  try {
    const timestamp = await AsyncStorage.getItem(
      REMOTE_CONFIG_CACHE_TIMESTAMP_KEY
    );
    if (!timestamp) return true;
    const age = Date.now() - parseInt(timestamp, 10);
    return age >= CACHE_DURATION_MS;
  } catch {
    return true;
  }
};

/**
 * Load config from Firebase and cache it
 */
const loadAndCacheConfig = async (): Promise<void> => {
  try {
    const all = firebaseRemoteConfig.getAll();
    const config: RemoteConfigValues = {
      rateUsCooldownDays: getNumberValue(
        all.rateUsCooldownDays,
        DEFAULT_CONFIG.rateUsCooldownDays
      ),
      rateUsUseDaysGate: getNumberValue(
        all.rateUsUseDaysGate,
        DEFAULT_CONFIG.rateUsUseDaysGate
      ),
      rateUsFirstShowDays: getNumberValue(
        all.rateUsFirstShowDays,
        DEFAULT_CONFIG.rateUsFirstShowDays
      ),
      rateUsFirstSession: getNumberValue(
        all.rateUsFirstSession,
        DEFAULT_CONFIG.rateUsFirstSession
      ),
      rateUsSessionInterval: getNumberValue(
        all.rateUsSessionInterval,
        DEFAULT_CONFIG.rateUsSessionInterval
      ),
      notificationCooldownDays: getNumberValue(
        all.notificationCooldownDays,
        DEFAULT_CONFIG.notificationCooldownDays
      ),
      notificationSessionInterval: getNumberValue(
        all.notificationSessionInterval,
        DEFAULT_CONFIG.notificationSessionInterval
      ),
      notificationIosSettingsThreshold: getNumberValue(
        all.notificationIosSettingsThreshold,
        DEFAULT_CONFIG.notificationIosSettingsThreshold
      ),
      notificationAndroidSettingsThreshold: getNumberValue(
        all.notificationAndroidSettingsThreshold,
        DEFAULT_CONFIG.notificationAndroidSettingsThreshold
      ),
      locationSessionInterval: getNumberValue(
        all.locationSessionInterval,
        DEFAULT_CONFIG.locationSessionInterval
      ),
      identificationReminderIntervalDays: getNumberValue(
        all.identificationReminderIntervalDays,
        DEFAULT_CONFIG.identificationReminderIntervalDays
      ),
      inactivityTimeoutDays: getNumberValue(
        all.inactivityTimeoutDays,
        DEFAULT_CONFIG.inactivityTimeoutDays
      ),
      subscriptionSessionInterval: getNumberValue(
        all.subscriptionSessionInterval,
        DEFAULT_CONFIG.subscriptionSessionInterval
      ),
      subscriptionDelayMs: getNumberValue(
        all.subscriptionDelayMs,
        DEFAULT_CONFIG.subscriptionDelayMs
      ),
      subscriptionFirstSessionDiscount: getNumberValue(
        all.subscriptionFirstSessionDiscount,
        DEFAULT_CONFIG.subscriptionFirstSessionDiscount
      ),
      subscription50OfferEndTs: getNumberValue(
        all.subscription50OfferEndTs,
        DEFAULT_CONFIG.subscription50OfferEndTs
      ),
      discountTimerDurationHours: getNumberValue(
        all.discountTimerDurationHours,
        DEFAULT_CONFIG.discountTimerDurationHours
      ),
      discountCycleDurationHours: getNumberValue(
        all.discountCycleDurationHours,
        DEFAULT_CONFIG.discountCycleDurationHours
      ),
      discountDefaultPercentage: getNumberValue(
        all.discountDefaultPercentage,
        DEFAULT_CONFIG.discountDefaultPercentage
      ),
      discountDefaultDurationSeconds: getNumberValue(
        all.discountDefaultDurationSeconds,
        DEFAULT_CONFIG.discountDefaultDurationSeconds
      ),
      discountBannerCooldownHours: getNumberValue(
        all.discountBannerCooldownHours,
        DEFAULT_CONFIG.discountBannerCooldownHours
      ),
      discountBannerShowDelayMs: getNumberValue(
        all.discountBannerShowDelayMs,
        DEFAULT_CONFIG.discountBannerShowDelayMs
      ),
      discountPopupShowWhenTimerActive: getNumberValue(
        all.discountPopupShowWhenTimerActive,
        DEFAULT_CONFIG.discountPopupShowWhenTimerActive
      ),
      discountPopupCooldownHours: getNumberValue(
        all.discountPopupCooldownHours,
        DEFAULT_CONFIG.discountPopupCooldownHours
      ),
      versionCheckCooldownHours: getNumberValue(
        all.versionCheckCooldownHours,
        DEFAULT_CONFIG.versionCheckCooldownHours
      ),
      versionCheckSessionInterval: getNumberValue(
        all.versionCheckSessionInterval,
        DEFAULT_CONFIG.versionCheckSessionInterval
      ),
      freeUserDailyScanLimit: getNumberValue(
        all.freeUserDailyScanLimit,
        DEFAULT_CONFIG.freeUserDailyScanLimit
      ),
      freeUserDailyPhotoScanLimit: getNumberValue(
        all.freeUserDailyPhotoScanLimit,
        DEFAULT_CONFIG.freeUserDailyPhotoScanLimit
      ),
      freeUserDailySoundScanLimit: getNumberValue(
        all.freeUserDailySoundScanLimit,
        DEFAULT_CONFIG.freeUserDailySoundScanLimit
      ),
      freeUserDailyFeedPostLimit: getNumberValue(
        all.freeUserDailyFeedPostLimit,
        DEFAULT_CONFIG.freeUserDailyFeedPostLimit
      ),
      purchaseValidationMaxAttempts: getNumberValue(
        all.purchaseValidationMaxAttempts,
        DEFAULT_CONFIG.purchaseValidationMaxAttempts
      ),
      purchaseValidationDelayMs: getNumberValue(
        all.purchaseValidationDelayMs,
        DEFAULT_CONFIG.purchaseValidationDelayMs
      ),
      regularUserPostRetentionDays: getNumberValue(
        all.regularUserPostRetentionDays,
        DEFAULT_CONFIG.regularUserPostRetentionDays
      ),
      premiumUserPostRetentionDays: getNumberValue(
        all.premiumUserPostRetentionDays,
        DEFAULT_CONFIG.premiumUserPostRetentionDays
      ),
      dataCacheRefreshIntervalHours: getNumberValue(
        all.dataCacheRefreshIntervalHours,
        DEFAULT_CONFIG.dataCacheRefreshIntervalHours
      ),
      guestLoginTimeoutMs: getNumberValue(
        all.guestLoginTimeoutMs,
        DEFAULT_CONFIG.guestLoginTimeoutMs
      ),
      splashScreenDelayMs: getNumberValue(
        all.splashScreenDelayMs,
        DEFAULT_CONFIG.splashScreenDelayMs
      ),
      splashStoreHydrationDelayMs: getNumberValue(
        all.splashStoreHydrationDelayMs,
        DEFAULT_CONFIG.splashStoreHydrationDelayMs
      ),
      onboardingNavigationDelayMs: getNumberValue(
        all.onboardingNavigationDelayMs,
        DEFAULT_CONFIG.onboardingNavigationDelayMs
      ),
      guestLoginNavigationDelayMs: getNumberValue(
        all.guestLoginNavigationDelayMs,
        DEFAULT_CONFIG.guestLoginNavigationDelayMs
      ),
      apiTimeoutMs: getNumberValue(
        all.apiTimeoutMs,
        DEFAULT_CONFIG.apiTimeoutMs
      ),
      apiAuthWaitTimeoutMs: getNumberValue(
        all.apiAuthWaitTimeoutMs,
        DEFAULT_CONFIG.apiAuthWaitTimeoutMs
      ),
      apiAuthCheckIntervalMs: getNumberValue(
        all.apiAuthCheckIntervalMs,
        DEFAULT_CONFIG.apiAuthCheckIntervalMs
      ),
      defaultPageSize: getNumberValue(
        all.defaultPageSize,
        DEFAULT_CONFIG.defaultPageSize
      ),
      homePageSize: getNumberValue(
        all.homePageSize,
        DEFAULT_CONFIG.homePageSize
      ),
      cataloguePageSize: getNumberValue(
        all.cataloguePageSize,
        DEFAULT_CONFIG.cataloguePageSize
      ),
      collectionPageSize: getNumberValue(
        all.collectionPageSize,
        DEFAULT_CONFIG.collectionPageSize
      ),
      feedPageSize: getNumberValue(
        all.feedPageSize,
        DEFAULT_CONFIG.feedPageSize
      ),
      homeDisplayCount: getNumberValue(
        all.homeDisplayCount,
        DEFAULT_CONFIG.homeDisplayCount
      ),
      catalogueCacheTtlHours: getNumberValue(
        all.catalogueCacheTtlHours,
        DEFAULT_CONFIG.catalogueCacheTtlHours
      ),
      networkFailureHistoryLimit: getNumberValue(
        all.networkFailureHistoryLimit,
        DEFAULT_CONFIG.networkFailureHistoryLimit
      ),
      traceNameMaxLength: getNumberValue(
        all.traceNameMaxLength,
        DEFAULT_CONFIG.traceNameMaxLength
      ),
      cachePrefix: getStringValue(all.cachePrefix, DEFAULT_CONFIG.cachePrefix),
      cacheTimestampPrefix: getStringValue(
        all.cacheTimestampPrefix,
        DEFAULT_CONFIG.cacheTimestampPrefix
      ),
      timingDelayBeforeInteractionMs: getNumberValue(
        all.timingDelayBeforeInteractionMs,
        DEFAULT_CONFIG.timingDelayBeforeInteractionMs
      ),
      mushroomOfTheDayFirstSession: getNumberValue(
        all.mushroomOfTheDayFirstSession,
        DEFAULT_CONFIG.mushroomOfTheDayFirstSession
      ),
      mushroomOfTheDayPopupCooldownHours: getNumberValue(
        all.mushroomOfTheDayPopupCooldownHours,
        DEFAULT_CONFIG.mushroomOfTheDayPopupCooldownHours
      ),
      darkModeEnabled: getBooleanValue(
        all.darkModeEnabled,
        DEFAULT_CONFIG.darkModeEnabled
      ),
      theme_default: getStringValue(
        all.theme_default,
        DEFAULT_CONFIG.theme_default
      ),
      appLogsEnabled: getBooleanValue(
        all.appLogsEnabled,
        DEFAULT_CONFIG.appLogsEnabled
      ),
      appleSubscriptionsEnabled: getBooleanValue(
        all.appleSubscriptionsEnabled,
        DEFAULT_CONFIG.appleSubscriptionsEnabled
      ),
      androidPlayStoreUrl: getStringValue(
        all.androidPlayStoreUrl,
        DEFAULT_CONFIG.androidPlayStoreUrl
      ),
      iosAppStoreUrl: getStringValue(
        all.iosAppStoreUrl,
        DEFAULT_CONFIG.iosAppStoreUrl
      ),
      privacyPolicyUrl: getStringValue(
        all.privacyPolicyUrl,
        DEFAULT_CONFIG.privacyPolicyUrl
      ),
      termsOfServiceUrl: getStringValue(
        all.termsOfServiceUrl,
        DEFAULT_CONFIG.termsOfServiceUrl
      ),
      quizEnabled: getNumberValue(all.quizEnabled, DEFAULT_CONFIG.quizEnabled),
      quizMushroomImage_porcini: getStringValue(
        all.quizMushroomImage_porcini,
        DEFAULT_CONFIG.quizMushroomImage_porcini
      ),
      quizMushroomImage_reishi: getStringValue(
        all.quizMushroomImage_reishi,
        DEFAULT_CONFIG.quizMushroomImage_reishi
      ),
      quizMushroomImage_oyster_mushroom: getStringValue(
        all.quizMushroomImage_oyster_mushroom,
        DEFAULT_CONFIG.quizMushroomImage_oyster_mushroom
      ),
      quizMushroomImage_wild_enoki: getStringValue(
        all.quizMushroomImage_wild_enoki,
        DEFAULT_CONFIG.quizMushroomImage_wild_enoki
      ),
      quizMushroomImage_fly_agaric: getStringValue(
        all.quizMushroomImage_fly_agaric,
        DEFAULT_CONFIG.quizMushroomImage_fly_agaric
      ),
      quizMushroomImage_lions_mane: getStringValue(
        all.quizMushroomImage_lions_mane,
        DEFAULT_CONFIG.quizMushroomImage_lions_mane
      ),
      quizMushroomImage_morel: getStringValue(
        all.quizMushroomImage_morel,
        DEFAULT_CONFIG.quizMushroomImage_morel
      ),
      quizMushroomImage_winter_chanterelle: getStringValue(
        all.quizMushroomImage_winter_chanterelle,
        DEFAULT_CONFIG.quizMushroomImage_winter_chanterelle
      ),
    };

    cachedConfig = config;

    // Cache values
    await AsyncStorage.setItem(REMOTE_CONFIG_CACHE_KEY, JSON.stringify(config));
    await AsyncStorage.setItem(
      REMOTE_CONFIG_CACHE_TIMESTAMP_KEY,
      Date.now().toString()
    );

    console.log("✅ Remote Config values loaded and cached");

    // Re-apply theme A/B default when RC updates (no-op if user already chose)
    try {
      const {
        applyThemeExperimentFromRemoteConfig,
      } = require("../../features/theme/themeExperiment.service");
      applyThemeExperimentFromRemoteConfig();
    } catch {
      // Theme experiment module may be unavailable during early init
    }
  } catch (error) {
    console.warn("Failed to load Remote Config values:", error);
    // Fallback to defaults
    cachedConfig = { ...DEFAULT_CONFIG };
  }
};

/**
 * Get number value from Remote Config
 */
const getNumberValue = (value: any, defaultValue: number): number => {
  try {
    if (value && value.asNumber) {
      return value.asNumber();
    }
    if (typeof value === "number") {
      return value;
    }
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? defaultValue : parsed;
  } catch {
    return defaultValue;
  }
};

/**
 * Get string value from Remote Config
 */
const getStringValue = (value: any, defaultValue: string): string => {
  try {
    if (value && value.asString) {
      return value.asString();
    }
    if (typeof value === "string") {
      return value;
    }
    return String(value || defaultValue);
  } catch {
    return defaultValue;
  }
};

/**
 * Get boolean value from Remote Config
 */
const getBooleanValue = (value: any, defaultValue: boolean): boolean => {
  try {
    if (value && typeof value.asBoolean === "function") {
      return value.asBoolean();
    }
    if (typeof value === "boolean") {
      return value;
    }
    const s = String(value ?? "").toLowerCase();
    if (s === "true" || s === "1") return true;
    if (s === "false" || s === "0") return false;
    return defaultValue;
  } catch {
    return defaultValue;
  }
};

/**
 * Get Remote Config values
 * Returns cached values for performance
 */
export const getRemoteConfig = (): RemoteConfigValues => {
  if (!isInitialized) {
    console.warn("Remote Config not initialized, using defaults");
    return { ...DEFAULT_CONFIG };
  }

  return cachedConfig || { ...DEFAULT_CONFIG };
};

/**
 * Refresh Remote Config (e.g. on app foreground).
 * Only fetches if cache is older than 1 hour to avoid unnecessary network calls.
 */
export const refreshRemoteConfig = async (): Promise<void> => {
  try {
    if (!isFirebaseInitialized()) {
      if (__DEV__) console.log(RC_LOG, "Firebase not ready, skip refresh");
      return;
    }
    const stale = await isCacheStale();
    if (!stale) {
      if (__DEV__) console.log(RC_LOG, "Refresh skipped (cache < 1hr)");
      return;
    }
    await firebaseRemoteConfig.fetch();
    await firebaseRemoteConfig.activate();
    await loadAndCacheConfig();
    if (__DEV__) console.log(RC_LOG, "Refreshed");
  } catch (error) {
    if (__DEV__) console.warn(RC_LOG, "Refresh failed:", error);
  }
};

/**
 * Get a specific Remote Config value
 */
export const getRemoteConfigValue = <K extends keyof RemoteConfigValues>(
  key: K
): RemoteConfigValues[K] => {
  const config = getRemoteConfig();
  return config[key];
};
