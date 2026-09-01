/**
 * Session-Based Modal Orchestrator
 * Manages when to show subscription, notification, and rate us modals
 * based on session count and Remote Config parameters
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRemoteConfigValue } from "../remoteConfig";
import {
  checkNotificationPermission,
  checkLocationPermission,
} from "../permissions";
import {
  getSessionCount,
  incrementNotificationSessionCount,
  hasCountedRateUsThisSession,
  markRateUsCounted,
  getFirstAppOpenAt,
} from "./session.service";

const NOTIF_LAST_DISMISSED_KEY = "NOTIF_LAST_DISMISSED";
const NOTIF_DENIAL_COUNT_KEY = "NOTIF_DENIAL_COUNT";
const HAS_RATED_KEY = "HAS_RATED_KEY";
const RATE_US_LAST_SHOWN_KEY = "RATE_US_LAST_SHOWN";
const RATE_US_LAST_SHOWN_SESSION_KEY = "RATE_US_LAST_SHOWN_SESSION";
/** When set, show notification permission popup on next home focus (after returning from subscription). */
export const PENDING_NOTIFICATION_AFTER_SUBSCRIPTION_KEY =
  "PENDING_NOTIFICATION_AFTER_SUBSCRIPTION";
/** Session count when we last showed notification popup (so we don't show again same session). */
const NOTIFICATION_SHOWN_FOR_SESSION_KEY = "NOTIFICATION_SHOWN_FOR_SESSION";
/** Session count when we last auto-navigated to subscription (so we don't navigate again same session). */
const SUBSCRIPTION_SHOWN_FOR_SESSION_KEY = "SUBSCRIPTION_SHOWN_FOR_SESSION";
/** When notification popup is shown first, show rate us after it is dismissed (queue: subscription → notification → location → rate us). */
const PENDING_RATE_US_AFTER_NOTIFICATION_KEY =
  "PENDING_RATE_US_AFTER_NOTIFICATION";
/** When notification popup is dismissed, show location permission if pending. */
const PENDING_LOCATION_AFTER_NOTIFICATION_KEY =
  "PENDING_LOCATION_AFTER_NOTIFICATION";
/** When location popup is dismissed, show rate us if pending. */
const PENDING_RATE_US_AFTER_LOCATION_KEY = "PENDING_RATE_US_AFTER_LOCATION";
/** Session count when we last showed location popup (so we don't show again same session). */
const LOCATION_SHOWN_FOR_SESSION_KEY = "LOCATION_SHOWN_FOR_SESSION";
/** Mineral of the Day popup: show 3rd session onwards, max once per day (cooldown from Remote Config) */
const MUSHROOM_OF_DAY_POPUP_SHOWN_AT_KEY = "mushroom_of_the_day_popup_shown_at";
const MUSHROOM_OF_DAY_SHOWN_FOR_SESSION_KEY =
  "MUSHROOM_OF_DAY_SHOWN_FOR_SESSION";
const LEGACY_MINERAL_OF_DAY_POPUP_SHOWN_AT_KEY =
  "mineral_of_the_day_popup_shown_at";

async function readMushroomOfDayPopupShownAt(): Promise<string | null> {
  const current = await AsyncStorage.getItem(
    MUSHROOM_OF_DAY_POPUP_SHOWN_AT_KEY
  );
  if (current) return current;
  const legacy = await AsyncStorage.getItem(
    LEGACY_MINERAL_OF_DAY_POPUP_SHOWN_AT_KEY
  );
  if (legacy) {
    await AsyncStorage.setItem(MUSHROOM_OF_DAY_POPUP_SHOWN_AT_KEY, legacy);
    return legacy;
  }
  return null;
}

/** Set that user was sent to subscription from home; show notification popup when they return. */
export const setPendingNotificationAfterSubscription = async (
  value: boolean
): Promise<void> => {
  try {
    if (value) {
      await AsyncStorage.setItem(
        PENDING_NOTIFICATION_AFTER_SUBSCRIPTION_KEY,
        "true"
      );
    } else {
      await AsyncStorage.removeItem(
        PENDING_NOTIFICATION_AFTER_SUBSCRIPTION_KEY
      );
    }
  } catch (e) {
    console.warn("setPendingNotificationAfterSubscription failed", e);
  }
};

/** Check if we should show notification popup on home (after return from subscription). */
export const getPendingNotificationAfterSubscription =
  async (): Promise<boolean> => {
    try {
      const v = await AsyncStorage.getItem(
        PENDING_NOTIFICATION_AFTER_SUBSCRIPTION_KEY
      );
      return v === "true";
    } catch {
      return false;
    }
  };

export interface SessionModalState {
  shouldShowSubscription: boolean;
  shouldShowNotification: boolean;
  shouldShowLocation: boolean;
  shouldShowRateUs: boolean;
  subscriptionDelayMs: number;
}

/**
 * Check if subscription screen should be shown (auto-navigate on home)
 * Requirements:
 * - First login (session 1), then every 5 sessions after that (6, 11, 16, ...)
 * - Only once per eligible session
 */
export const shouldShowSubscriptionModal = async (
  isPremium: boolean
): Promise<boolean> => {
  if (isPremium) return false;

  try {
    const sessionCount = await getSessionCount();
    const sessionInterval = getRemoteConfigValue("subscriptionSessionInterval"); // Default: 5
    const isFirstLogin = sessionCount === 1;
    const isEveryNthAfterFirst =
      sessionCount > 1 && (sessionCount - 1) % sessionInterval === 0;
    if (!isFirstLogin && !isEveryNthAfterFirst) return false;

    const shownFor = await AsyncStorage.getItem(
      SUBSCRIPTION_SHOWN_FOR_SESSION_KEY
    );
    if (shownFor !== null && parseInt(shownFor, 10) === sessionCount) {
      return false;
    }
    return true;
  } catch (error) {
    console.warn("Failed to check subscription modal:", error);
    return false;
  }
};

/**
 * Mark that we auto-navigated to subscription this session.
 */
export const markSubscriptionShownForSession = async (): Promise<void> => {
  try {
    const sessionCount = await getSessionCount();
    await AsyncStorage.setItem(
      SUBSCRIPTION_SHOWN_FOR_SESSION_KEY,
      sessionCount.toString()
    );
  } catch (error) {
    console.warn("Failed to mark subscription shown for session:", error);
  }
};

/**
 * Get subscription discount percentage based on session count
 * Returns configurable first session discount, 50 for subsequent sessions
 */
export const getSubscriptionDiscountPercentage = async (): Promise<number> => {
  try {
    const sessionCount = await getSessionCount();
    // First session uses configurable discount, all others = 50%
    const firstSessionDiscount =
      getRemoteConfigValue("subscriptionFirstSessionDiscount") || 70;
    return sessionCount === 1 ? firstSessionDiscount : 50;
  } catch (error) {
    console.warn("Failed to get subscription discount percentage:", error);
    return 50; // Default to 50%
  }
};

/**
 * Check if notification modal should be shown
 * Requirements:
 * - 1st session, then every 5 sessions after that (6, 11, 16, ...)
 * - After 2 native denials, popup still shows but CTA becomes "Give Permission in Settings"
 */
export const shouldShowNotificationModal = async (): Promise<boolean> => {
  try {
    const permissionResult = await checkNotificationPermission();
    if (permissionResult.granted || permissionResult.blocked) {
      return false;
    }

    const sessionCount = await getSessionCount();
    const sessionInterval = getRemoteConfigValue("notificationSessionInterval"); // Default: 5
    const isFirstSession = sessionCount === 1;
    const isEveryNthAfterFirst =
      sessionCount > 1 && (sessionCount - 1) % sessionInterval === 0;
    if (!isFirstSession && !isEveryNthAfterFirst) return false;

    const shownFor = await AsyncStorage.getItem(
      NOTIFICATION_SHOWN_FOR_SESSION_KEY
    );
    if (shownFor !== null && parseInt(shownFor, 10) === sessionCount) {
      return false; // Already shown for this session
    }

    return true;
  } catch (error) {
    console.warn("Failed to check notification modal:", error);
    return false;
  }
};

/**
 * Get notification denial count (for "Give Permission in Settings" threshold)
 */
export const getNotificationDenialCount = async (): Promise<number> => {
  try {
    const count = await AsyncStorage.getItem(NOTIF_DENIAL_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch {
    return 0;
  }
};

/**
 * Get notification settings threshold: after this many denials, show "Give Permission in Settings"
 */
export const getNotificationSettingsThreshold = (): number => {
  return Platform.OS === "ios"
    ? getRemoteConfigValue("notificationIosSettingsThreshold")
    : getRemoteConfigValue("notificationAndroidSettingsThreshold");
};

/**
 * Mark notification modal as dismissed
 */
export const markNotificationDismissed = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(NOTIF_LAST_DISMISSED_KEY, Date.now().toString());
    await incrementNotificationSessionCount();
  } catch (error) {
    console.warn("Failed to mark notification dismissed:", error);
  }
};

/**
 * Mark that we showed the notification popup for this session (so we don't show again until next eligible session).
 */
export const markNotificationShownForSession = async (): Promise<void> => {
  try {
    const sessionCount = await getSessionCount();
    await AsyncStorage.setItem(
      NOTIFICATION_SHOWN_FOR_SESSION_KEY,
      sessionCount.toString()
    );
  } catch (error) {
    console.warn("Failed to mark notification shown for session:", error);
  }
};

/**
 * Mark notification permission as denied (user tapped Allow but native denied).
 * Tracks denial count — at threshold the CTA switches to "Give Permission in Settings".
 */
export const markNotificationDenied = async (): Promise<void> => {
  try {
    const currentCount = await AsyncStorage.getItem(NOTIF_DENIAL_COUNT_KEY);
    const newCount = currentCount ? parseInt(currentCount, 10) + 1 : 1;
    await AsyncStorage.setItem(NOTIF_DENIAL_COUNT_KEY, newCount.toString());
    await markNotificationDismissed();
  } catch (error) {
    console.warn("Failed to mark notification denied:", error);
  }
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function isRateUsDaysGateEnabled(): boolean {
  const value = getRemoteConfigValue("rateUsUseDaysGate");
  return value !== 0;
}

/**
 * Check if rate us modal should be shown
 * Days gate (default): first show after rateUsFirstShowDays (7), then every rateUsSessionInterval sessions
 * Session gate (rateUsUseDaysGate=0): 2nd session, then every 5 sessions (2, 7, 12, …)
 */
export const shouldShowRateUsModal = async (): Promise<boolean> => {
  try {
    const hasRated = await AsyncStorage.getItem(HAS_RATED_KEY);
    if (hasRated === "true") {
      return false;
    }

    if (await hasCountedRateUsThisSession()) {
      return false;
    }

    const sessionCount = await getSessionCount();
    const sessionInterval = getRemoteConfigValue("rateUsSessionInterval");

    if (isRateUsDaysGateEnabled()) {
      const firstShowDays = Math.max(
        1,
        getRemoteConfigValue("rateUsFirstShowDays") || 7
      );
      const firstOpenAt = await getFirstAppOpenAt();
      if (!firstOpenAt) {
        return false;
      }
      const daysSinceFirstOpen = (Date.now() - firstOpenAt) / MS_PER_DAY;
      if (daysSinceFirstOpen < firstShowDays) {
        return false;
      }

      const lastShownSessionRaw = await AsyncStorage.getItem(
        RATE_US_LAST_SHOWN_SESSION_KEY
      );
      if (!lastShownSessionRaw) {
        return true;
      }

      const lastShownSession = parseInt(lastShownSessionRaw, 10);
      if (Number.isNaN(lastShownSession)) {
        return true;
      }

      return (
        sessionCount > lastShownSession &&
        (sessionCount - lastShownSession) % sessionInterval === 0
      );
    }

    const firstSession = Math.max(
      2,
      getRemoteConfigValue("rateUsFirstSession") || 2
    );

    if (sessionCount < firstSession) {
      return false;
    }

    const isFirstShow = sessionCount === firstSession;
    const isEveryNthSession =
      sessionCount > firstSession &&
      (sessionCount - firstSession) % sessionInterval === 0;

    return isFirstShow || isEveryNthSession;
  } catch (error) {
    console.warn("Failed to check rate us modal:", error);
    return false;
  }
};

/**
 * Mark user as rated (never show again)
 */
export const markUserRated = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(HAS_RATED_KEY, "true");
    await markRateUsCounted();
  } catch (error) {
    console.warn("Failed to mark user as rated:", error);
  }
};

/**
 * Mark rate us modal as shown (for 24-hour cooldown)
 */
export const markRateUsShown = async (): Promise<void> => {
  try {
    const sessionCount = await getSessionCount();
    await AsyncStorage.setItem(RATE_US_LAST_SHOWN_KEY, Date.now().toString());
    await AsyncStorage.setItem(
      RATE_US_LAST_SHOWN_SESSION_KEY,
      sessionCount.toString()
    );
    await markRateUsCounted();
  } catch (error) {
    console.warn("Failed to mark rate us shown:", error);
  }
};

/**
 * Check if Mushroom of the Day popup should be shown (auto-open on home).
 * PRD: 3rd session onwards; don't show if user already saw today's mushroom (once per calendar day).
 * If new data is available (new day), show it.
 */
export const shouldShowMushroomOfTheDayPopup = async (): Promise<boolean> => {
  try {
    const sessionCount = await getSessionCount();
    const firstSession = Math.max(
      3,
      getRemoteConfigValue("mushroomOfTheDayFirstSession") || 3
    );
    if (sessionCount < firstSession) return false;

    const shownFor = await AsyncStorage.getItem(
      MUSHROOM_OF_DAY_SHOWN_FOR_SESSION_KEY
    );
    if (shownFor !== null && parseInt(shownFor, 10) === sessionCount) {
      return false;
    }

    const shownAt = await readMushroomOfDayPopupShownAt();
    if (!shownAt) return true;

    const shownDate = new Date(parseInt(shownAt, 10)).toDateString();
    const today = new Date().toDateString();
    if (shownDate === today) return false;
    return true;
  } catch {
    return false;
  }
};

/**
 * Mark Mushroom of the Day popup as shown (once per calendar day).
 */
export const markMushroomOfTheDayPopupShown = async (): Promise<void> => {
  try {
    const sessionCount = await getSessionCount();
    await AsyncStorage.setItem(
      MUSHROOM_OF_DAY_SHOWN_FOR_SESSION_KEY,
      sessionCount.toString()
    );
    await AsyncStorage.setItem(
      MUSHROOM_OF_DAY_POPUP_SHOWN_AT_KEY,
      Date.now().toString()
    );
  } catch (error) {
    console.warn("Failed to mark mushroom of the day popup shown:", error);
  }
};

/**
 * Check if location permission modal should be shown on home (after subscription flow).
 * Requirements:
 * - 1st session, then every 5 sessions after that (6, 11, 16, ...)
 * - Skip if location already granted
 */
export const shouldShowLocationModal = async (): Promise<boolean> => {
  try {
    const permissionResult = await checkLocationPermission();
    if (permissionResult.granted || permissionResult.blocked) {
      return false;
    }

    const sessionCount = await getSessionCount();
    const sessionInterval = getRemoteConfigValue("locationSessionInterval");
    const isFirstSession = sessionCount === 1;
    const isEveryNthAfterFirst =
      sessionCount > 1 && (sessionCount - 1) % sessionInterval === 0;
    if (!isFirstSession && !isEveryNthAfterFirst) return false;

    const shownFor = await AsyncStorage.getItem(LOCATION_SHOWN_FOR_SESSION_KEY);
    if (shownFor !== null && parseInt(shownFor, 10) === sessionCount) {
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Failed to check location modal:", error);
    return false;
  }
};

/**
 * Mark that we showed the location popup for this session.
 */
export const markLocationShownForSession = async (): Promise<void> => {
  try {
    const sessionCount = await getSessionCount();
    await AsyncStorage.setItem(
      LOCATION_SHOWN_FOR_SESSION_KEY,
      sessionCount.toString()
    );
  } catch (error) {
    console.warn("Failed to mark location shown for session:", error);
  }
};

/**
 * Get all modal states (used to build queue: subscription → notification → location → rate us).
 */
export const getSessionModalStates = async (
  isPremium: boolean
): Promise<SessionModalState> => {
  const [
    shouldShowSubscription,
    shouldShowNotification,
    shouldShowLocation,
    shouldShowRateUs,
  ] = await Promise.all([
    shouldShowSubscriptionModal(isPremium),
    shouldShowNotificationModal(),
    shouldShowLocationModal(),
    shouldShowRateUsModal(),
  ]);

  const subscriptionDelayMs = getRemoteConfigValue("subscriptionDelayMs");

  return {
    shouldShowSubscription,
    shouldShowNotification,
    shouldShowLocation,
    shouldShowRateUs,
    subscriptionDelayMs,
  };
};

/**
 * Queue: show one session modal at a time — subscription, notification, location, rate us.
 */
export const getNextSessionModalInQueue = async (
  isPremium: boolean
): Promise<"subscription" | "notification" | "location" | "rate_us" | null> => {
  const pendingNotif = await getPendingNotificationAfterSubscription();
  if (pendingNotif) {
    if (await shouldShowNotificationModal()) return "notification";
    await setPendingNotificationAfterSubscription(false);
  }

  const state = await getSessionModalStates(isPremium);
  if (state.shouldShowSubscription) return "subscription";
  if (state.shouldShowNotification) return "notification";
  if (state.shouldShowLocation) return "location";
  if (state.shouldShowRateUs) return "rate_us";
  return null;
};

/** Set that rate us should be shown when notification permission popup is dismissed (queue). */
export const setPendingRateUsAfterNotification = async (
  value: boolean
): Promise<void> => {
  try {
    if (value) {
      await AsyncStorage.setItem(
        PENDING_RATE_US_AFTER_NOTIFICATION_KEY,
        "true"
      );
    } else {
      await AsyncStorage.removeItem(PENDING_RATE_US_AFTER_NOTIFICATION_KEY);
    }
  } catch (e) {
    console.warn("setPendingRateUsAfterNotification failed", e);
  }
};

/** Check if we should show rate us immediately after notification popup is dismissed. */
export const getPendingRateUsAfterNotification = async (): Promise<boolean> => {
  try {
    const v = await AsyncStorage.getItem(
      PENDING_RATE_US_AFTER_NOTIFICATION_KEY
    );
    return v === "true";
  } catch {
    return false;
  }
};

/** Set that location should be shown when notification permission popup is dismissed. */
export const setPendingLocationAfterNotification = async (
  value: boolean
): Promise<void> => {
  try {
    if (value) {
      await AsyncStorage.setItem(
        PENDING_LOCATION_AFTER_NOTIFICATION_KEY,
        "true"
      );
    } else {
      await AsyncStorage.removeItem(PENDING_LOCATION_AFTER_NOTIFICATION_KEY);
    }
  } catch (e) {
    console.warn("setPendingLocationAfterNotification failed", e);
  }
};

/** Check if we should show location immediately after notification popup is dismissed. */
export const getPendingLocationAfterNotification =
  async (): Promise<boolean> => {
    try {
      const v = await AsyncStorage.getItem(
        PENDING_LOCATION_AFTER_NOTIFICATION_KEY
      );
      return v === "true";
    } catch {
      return false;
    }
  };

/** Set that rate us should be shown when location permission popup is dismissed. */
export const setPendingRateUsAfterLocation = async (
  value: boolean
): Promise<void> => {
  try {
    if (value) {
      await AsyncStorage.setItem(PENDING_RATE_US_AFTER_LOCATION_KEY, "true");
    } else {
      await AsyncStorage.removeItem(PENDING_RATE_US_AFTER_LOCATION_KEY);
    }
  } catch (e) {
    console.warn("setPendingRateUsAfterLocation failed", e);
  }
};

/** Check if we should show rate us immediately after location popup is dismissed. */
export const getPendingRateUsAfterLocation = async (): Promise<boolean> => {
  try {
    const v = await AsyncStorage.getItem(PENDING_RATE_US_AFTER_LOCATION_KEY);
    return v === "true";
  } catch {
    return false;
  }
};

/** @deprecated Use shouldShowBirdOfTheDayPopup */
export const shouldShowBirdOfTheDayPopup = shouldShowMushroomOfTheDayPopup;
/** @deprecated Use markBirdOfTheDayPopupShown */
export const markBirdOfTheDayPopupShown = markMushroomOfTheDayPopupShown;
