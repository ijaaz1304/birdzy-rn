/**
 * Marketing deep link bootstrap only — guest login + skip onboarding gates.
 * Normal app launch must use the standard bootstrap path in RootNavigator.
 */

import { Linking } from "react-native";
import { parsePasswordResetDeepLink } from "../../features/auth/utils/authDeepLinks";
import { ensureGuestSessionForDeepLink, prepareAppForDeepLinkEntry } from "./deepLinkAuthFlow";
import {
  deepLinkManager,
  hasAppSessionForDeepLink,
  hasPendingMarketingDeepLink,
} from "./deepLinkManager";
import { ingestDeferredMarketingDeepLinkUrl } from "./deferredDeepLink";
import { isDeepLinkUrl } from "./parseDeepLinkUrl";

export type DeepLinkBootstrapRoute =
  | "Onboarding"
  | "MainTabs"
  | "PostAuthOnboarding";

/** Ingest cold-start URL; returns true only when a marketing deep link is queued. */
export async function ingestInitialMarketingDeepLinkUrl(): Promise<boolean> {
  const url = await Linking.getInitialURL();
  if (!url || parsePasswordResetDeepLink(url) || !isDeepLinkUrl(url)) {
    return ingestDeferredMarketingDeepLinkUrl();
  }
  deepLinkManager.handle(url);
  if (hasPendingMarketingDeepLink()) {
    return true;
  }
  return ingestDeferredMarketingDeepLinkUrl();
}

export async function ensureGuestSessionForPendingDeepLink(): Promise<boolean> {
  if (!hasPendingMarketingDeepLink()) return false;
  if (hasAppSessionForDeepLink()) return true;
  return ensureGuestSessionForDeepLink();
}

/**
 * Bootstrap route when a marketing deep link is pending (caller must verify first).
 * Performs guest login when needed and skips post-auth onboarding for the link target.
 */
export async function resolveMarketingDeepLinkBootstrapRoute(): Promise<DeepLinkBootstrapRoute> {
  if (!hasPendingMarketingDeepLink()) {
    return "Onboarding";
  }

  prepareAppForDeepLinkEntry();

  if (!hasAppSessionForDeepLink()) {
    const sessionReady = await ensureGuestSessionForPendingDeepLink();
    return sessionReady ? "MainTabs" : "Onboarding";
  }

  return "MainTabs";
}
