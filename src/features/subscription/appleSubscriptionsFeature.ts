import { Platform } from "react-native";
import { getRemoteConfigValue } from "../../services/remoteConfig/remoteConfig.service";

/** Shown when Remote Config disables Apple IAP on iOS. */
export const APPLE_SUBSCRIPTIONS_DISABLED_MESSAGE =
  "Apple subscriptions are temporarily unavailable. Please try again later.";

/**
 * Remote Config gate for iOS App Store subscriptions.
 * Android Google Play subscriptions are unaffected.
 */
export function isAppleSubscriptionsEnabled(): boolean {
  if (Platform.OS !== "ios") return true;
  return getRemoteConfigValue("appleSubscriptionsEnabled") === true;
}
