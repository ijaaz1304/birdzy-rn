import { Platform } from "react-native";

/** Shown when Sign in with Apple is invoked off iOS. */
export const APPLE_LOGIN_DISABLED_MESSAGE =
  "Sign in with Apple is only available on iOS.";

/**
 * Sign in with Apple is iOS-only (login / signup).
 * Not gated by Remote Config.
 */
export function isAppleLoginEnabled(): boolean {
  return Platform.OS === "ios";
}
