/**
 * Shared rules for "Other apps" (home strip + Other Apps screen):
 * never show this installed app in its own cross-promo list; require store URL for current platform.
 */

import { Platform } from "react-native";
import type { PublishedApp } from "./publishedApps.store";
import { ANDROID_PACKAGE_ID } from "../../constants/appStoreConstants";

const MUSHROOM_IOS_SLUG_MARKERS = ["shroom", "mushroom"] as const;

/** True if this row points at the app the user already has installed (Birdzy). */
export function isCrossPromoEntryForThisInstalledApp(
  app: PublishedApp
): boolean {
  const play = (app.playstoreUrl ?? "").toLowerCase();
  const ios = (app.appstoreUrl ?? "").toLowerCase();
  const title = (app.title ?? "").toLowerCase();

  // Play package is the reliable differentiator (Rockzy = minerals, Shroom = mushrooms).
  if (play.includes(ANDROID_PACKAGE_ID.toLowerCase())) return true;

  if (
    MUSHROOM_IOS_SLUG_MARKERS.some(
      (marker) => ios.includes(marker) || title.includes(marker)
    )
  ) {
    return true;
  }

  return false;
}

/** List safe to show in UI: not this app, and has Play/App Store link for this OS. */
export function filterPublishedAppsForCrossPromo(
  apps: PublishedApp[]
): PublishedApp[] {
  return apps.filter((app: PublishedApp) => {
    if (isCrossPromoEntryForThisInstalledApp(app)) return false;
    if (Platform.OS === "android") return !!app.playstoreUrl;
    if (Platform.OS === "ios") return !!app.appstoreUrl;
    return false;
  });
}
