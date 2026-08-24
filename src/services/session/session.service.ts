/**
 * Session Tracking Service
 * Handles app session counting and tracking
 *
 * Sessions are counted once per app process launch to prevent double-counting.
 * Per-session flags (rate us) are cleared when the app backgrounds; the launch
 * counter guard stays in memory so Home refocus after camera/permission flows
 * does not increment again on the same launch.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";
// Storage keys
const APP_LAUNCH_SESSION_COUNT_KEY = "APP_LAUNCH_SESSION_COUNT";
const SESSION_COUNTED_FLAG_KEY = "SESSION_COUNTED_FLAG";
const NOTIF_SESSION_KEY = "NOTIF_SESSION_KEY";
const RATE_US_SESSION_COUNTED_FLAG_KEY = "RATE_US_SESSION_COUNTED_FLAG";
const LAST_SESSION_TIMESTAMP_KEY = "LAST_SESSION_TIMESTAMP";
/** Set when session count goes from 0 to 1 (first app open). Used for discount 24h/24h cycle. */
export const FIRST_APP_OPEN_AT_KEY = "FIRST_APP_OPEN_AT";

let sessionCount: number | null = null;
let notificationSessionCount: number | null = null;
let hasCountedThisSession = false;
let hasCountedRateUsThisSessionFlag = false;
let incrementInFlight: Promise<number> | null = null;

/**
 * Initialize session service
 * Sets up app state listener to clear flags on background
 */
export const initializeSessionService = (): void => {
  // Drop any persisted launch flag from a previous process so a cold start can increment.
  void AsyncStorage.removeItem(SESSION_COUNTED_FLAG_KEY);

  // Clear per-session modal flags only when app is truly backgrounded — not on
  // "inactive" (permission dialogs, calls, etc.). Never reset hasCountedThisSession
  // here; doing so lets Home refocus increment again after camera/permission flows.
  const subscription = AppState.addEventListener(
    "change",
    (nextAppState: AppStateStatus) => {
      if (nextAppState === "background") {
        clearSessionFlags();
      }
    }
  );

  // Keep subscription alive for app lifetime.
};

/**
 * Clear per-session modal flags when app goes to background.
 * Launch count dedup (hasCountedThisSession) is intentionally kept for this process.
 */
const clearSessionFlags = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(RATE_US_SESSION_COUNTED_FLAG_KEY);
    hasCountedRateUsThisSessionFlag = false;
  } catch (error) {
    if (__DEV__) {
      console.warn("Failed to clear session flags:", error);
    }
  }
};

/**
 * Get total session count
 */
export const getSessionCount = async (): Promise<number> => {
  if (sessionCount !== null) {
    return sessionCount;
  }

  try {
    const count = await AsyncStorage.getItem(APP_LAUNCH_SESSION_COUNT_KEY);
    sessionCount = count ? parseInt(count, 10) : 0;
    return sessionCount;
  } catch (error) {
    console.warn("Failed to get session count:", error);
    return 0;
  }
};

/**
 * Increment session count (only once per app launch)
 */
export const incrementSessionCount = async (): Promise<number> => {
  if (hasCountedThisSession) {
    return sessionCount || 0;
  }

  if (incrementInFlight) {
    return incrementInFlight;
  }

  incrementInFlight = (async () => {
    try {
      if (hasCountedThisSession) {
        return sessionCount || 0;
      }

      const currentCount = await getSessionCount();
      const newCount = currentCount + 1;

      await AsyncStorage.setItem(
        APP_LAUNCH_SESSION_COUNT_KEY,
        newCount.toString()
      );
      await AsyncStorage.setItem(SESSION_COUNTED_FLAG_KEY, "true");
      await AsyncStorage.setItem(
        LAST_SESSION_TIMESTAMP_KEY,
        Date.now().toString()
      );
      if (currentCount === 0) {
        await AsyncStorage.setItem(FIRST_APP_OPEN_AT_KEY, Date.now().toString());
      }

      sessionCount = newCount;
      hasCountedThisSession = true;

      if (__DEV__) {
        console.log(`✅ Session count incremented: ${newCount}`);
      }

      return newCount;
    } catch (error) {
      console.warn("Failed to increment session count:", error);
      return sessionCount || 0;
    } finally {
      incrementInFlight = null;
    }
  })();

  return incrementInFlight;
};

/**
 * Get notification-specific session count
 */
export const getNotificationSessionCount = async (): Promise<number> => {
  if (notificationSessionCount !== null) {
    return notificationSessionCount;
  }

  try {
    const count = await AsyncStorage.getItem(NOTIF_SESSION_KEY);
    notificationSessionCount = count ? parseInt(count, 10) : 0;
    return notificationSessionCount;
  } catch (error) {
    console.warn("Failed to get notification session count:", error);
    return 0;
  }
};

/**
 * Increment notification session count
 */
export const incrementNotificationSessionCount = async (): Promise<number> => {
  try {
    const currentCount = await getNotificationSessionCount();
    const newCount = currentCount + 1;

    await AsyncStorage.setItem(NOTIF_SESSION_KEY, newCount.toString());
    notificationSessionCount = newCount;

    return newCount;
  } catch (error) {
    console.warn("Failed to increment notification session count:", error);
    return notificationSessionCount || 0;
  }
};

/**
 * Check if rate us has been counted this session
 */
export const hasCountedRateUsThisSession = async (): Promise<boolean> => {
  if (hasCountedRateUsThisSessionFlag) {
    return true;
  }

  try {
    const counted = await AsyncStorage.getItem(
      RATE_US_SESSION_COUNTED_FLAG_KEY
    );
    if (counted === "true") {
      hasCountedRateUsThisSessionFlag = true;
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Mark rate us as counted this session
 */
export const markRateUsCounted = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(RATE_US_SESSION_COUNTED_FLAG_KEY, "true");
    hasCountedRateUsThisSessionFlag = true;
  } catch (error) {
    console.warn("Failed to mark rate us as counted:", error);
  }
};

/**
 * Get last session timestamp
 */
export const getLastSessionTimestamp = async (): Promise<number | null> => {
  try {
    const timestamp = await AsyncStorage.getItem(LAST_SESSION_TIMESTAMP_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch {
    return null;
  }
};

/**
 * Get first app open timestamp (when app was first opened).
 * Used for discount 24h on / 24h off cycle.
 */
export const getFirstAppOpenAt = async (): Promise<number | null> => {
  try {
    const raw = await AsyncStorage.getItem(FIRST_APP_OPEN_AT_KEY);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
};

/**
 * Set first app open timestamp if not already set (timer starts on first app open).
 * Call when app/root navigator first mounts so the 24h/24h discount cycle begins immediately.
 */
export const ensureFirstAppOpenAt = async (): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(FIRST_APP_OPEN_AT_KEY);
    if (existing) return;
    await AsyncStorage.setItem(FIRST_APP_OPEN_AT_KEY, Date.now().toString());
  } catch (e) {
    if (__DEV__) console.warn("ensureFirstAppOpenAt failed", e);
  }
};

/**
 * Reset session count and all session-related keys (used on logout / delete account).
 */
export const resetSessionCount = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(APP_LAUNCH_SESSION_COUNT_KEY);
    await AsyncStorage.removeItem(SESSION_COUNTED_FLAG_KEY);
    await AsyncStorage.removeItem(NOTIF_SESSION_KEY);
    await AsyncStorage.removeItem(RATE_US_SESSION_COUNTED_FLAG_KEY);
    await AsyncStorage.removeItem(LAST_SESSION_TIMESTAMP_KEY);
    await AsyncStorage.removeItem(FIRST_APP_OPEN_AT_KEY);
    sessionCount = null;
    notificationSessionCount = null;
    hasCountedThisSession = false;
    hasCountedRateUsThisSessionFlag = false;
  } catch (error) {
    console.warn("Failed to reset session count:", error);
  }
};
