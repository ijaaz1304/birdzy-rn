/**
 * App Constants - Package IDs and App Store information
 * Centralized store IDs for rating/sharing functionality
 *
 * Android app link: https://play.google.com/store/apps/details?id=com.trackzio.birds
 * Store URLs can be overridden via Firebase Remote Config (androidPlayStoreUrl, iosAppStoreUrl).
 */

import { Platform } from "react-native";
/** Android package ID for Google Play Store (Birdzy) */
export const ANDROID_PACKAGE_ID = "com.trackzio.birds" as const;

/** iOS App Store ID - Update this with your actual App Store ID */
export const IOS_APP_STORE_ID = "6758651735" as const;

/** App rating/sharing constants (static fallbacks when Remote Config is not used) */
export const APP_STORE_CONSTANTS = {
  ANDROID_PACKAGE_ID,
  IOS_APP_STORE_ID,
  ANDROID_PLAY_STORE_URL: `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_ID}`,
  IOS_APP_STORE_URL: `https://apps.apple.com/app/id${IOS_APP_STORE_ID}`,
} as const;

/**
 * Returns the app store URL for the current platform.
 * Uses Remote Config (androidPlayStoreUrl / iosAppStoreUrl) when available, otherwise APP_STORE_CONSTANTS.
 */
export function getAppStoreUrl(): string {
  try {
    const {
      getRemoteConfigValue,
    } = require("../services/remoteConfig/remoteConfig.service");
    const url =
      Platform.OS === "ios"
        ? getRemoteConfigValue("iosAppStoreUrl")
        : getRemoteConfigValue("androidPlayStoreUrl");
    if (url && typeof url === "string" && url.length > 0) {
      return url;
    }
  } catch {
    // Remote Config not ready or not available
  }
  return Platform.OS === "ios"
    ? APP_STORE_CONSTANTS.IOS_APP_STORE_URL
    : APP_STORE_CONSTANTS.ANDROID_PLAY_STORE_URL;
}
