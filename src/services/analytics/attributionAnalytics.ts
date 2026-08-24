/**
 * Firebase Analytics — install attribution event (Android Play Referrer).
 *
 * Throws if logging fails so callers can retry (e.g. persist `attribution_sent` only after success).
 */

import {
  waitForFirebaseReady,
  isFirebaseInitialized,
} from "../../lib/firebase/config";

export type InstallAttributionAnalyticsPayload = {
  campaign: string;
  source: string;
  medium: string;
  platform: string;
  /** Already truncated to ≤100 chars for Firebase limits */
  raw_referrer: string;
};

/**
 * Logs `install_attribution` with length-safe `raw_referrer` (max 100 chars).
 *
 * @param maxWaitMs - Max time to wait for Firebase init; should fit remaining global attribution deadline.
 * @throws If Firebase is not ready or `logEvent` fails.
 */
export async function logInstallAttribution(
  data: InstallAttributionAnalyticsPayload,
  maxWaitMs = 3000,
  extras?: Record<string, string | number | boolean>
): Promise<void> {
  await waitForFirebaseReady(maxWaitMs);
  if (!isFirebaseInitialized()) {
    throw new Error("Firebase not initialized for install attribution");
  }
  const analyticsModule = require("@react-native-firebase/analytics");
  if (!analyticsModule?.default) {
    throw new Error("Firebase Analytics module unavailable");
  }
  await analyticsModule.default().logEvent("install_attribution", {
    campaign: data.campaign,
    source: data.source,
    medium: data.medium,
    platform: data.platform,
    raw_referrer: data.raw_referrer,
    ...extras,
  });
}
