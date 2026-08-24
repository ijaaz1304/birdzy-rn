/**
 * Post-install deferred marketing deep links (no Branch / Dynamic Links).
 *
 * Android: Play Store `referrer=birdzy_dl%3D{path}` → Install Referrer on first launch.
 * iOS: Hosting copies HTTPS link to clipboard before App Store; read once on first open.
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Clipboard from "@react-native-clipboard/clipboard";
import { getInstallReferrer } from "../../services/attribution/androidReferrer";
import {
  getOrCreateInstallInstanceId,
  getTimeSinceFirstOpenMs,
} from "../../services/attribution/installInstance";
import {
  deepLinkManager,
  hasPendingMarketingDeepLink,
} from "./deepLinkManager";
import {
  buildHttpsUrlFromDeferredPath,
  extractDeferredPathFromReferrer,
} from "./deferredDeepLinkParsing";
import { isDeepLinkUrl } from "./parseDeepLinkUrl";

export {
  buildHttpsUrlFromDeferredPath,
  extractDeferredPathFromReferrer,
} from "./deferredDeepLinkParsing";

const DEFERRED_DEEP_LINK_CONSUMED_KEY = "birdzy_deferred_deep_link_consumed_v1";
/** Only attempt clipboard read shortly after first install (iOS). */
const DEFERRED_CLIPBOARD_MAX_AGE_MS = 30 * 60 * 1000;

async function hasConsumedDeferredDeepLink(): Promise<boolean> {
  return (await AsyncStorage.getItem(DEFERRED_DEEP_LINK_CONSUMED_KEY)) === "1";
}

async function markDeferredDeepLinkConsumed(): Promise<void> {
  await AsyncStorage.setItem(DEFERRED_DEEP_LINK_CONSUMED_KEY, "1");
}

async function resolveAndroidDeferredUrl(): Promise<string | null> {
  if (Platform.OS !== "android") return null;

  const delaysMs = [0, 400, 1200];
  for (const delayMs of delaysMs) {
    if (delayMs > 0) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }
    const payload = await getInstallReferrer();
    const rawReferrer = payload?.installReferrer?.trim();
    if (!rawReferrer) continue;

    const path = extractDeferredPathFromReferrer(rawReferrer);
    if (path) {
      return buildHttpsUrlFromDeferredPath(path);
    }
    return null;
  }

  return null;
}

async function resolveIosDeferredUrl(): Promise<string | null> {
  if (Platform.OS !== "ios") return null;

  const sinceFirstOpenMs = await getTimeSinceFirstOpenMs();
  if (sinceFirstOpenMs > DEFERRED_CLIPBOARD_MAX_AGE_MS) {
    return null;
  }

  let clipboardText = "";
  try {
    clipboardText = (await Clipboard.getString())?.trim() ?? "";
  } catch {
    return null;
  }

  if (!clipboardText || !isDeepLinkUrl(clipboardText)) {
    return null;
  }
  return clipboardText;
}

/** Returns HTTPS marketing URL captured before install, if any. */
export async function resolveDeferredMarketingDeepLinkUrl(): Promise<
  string | null
> {
  if (await hasConsumedDeferredDeepLink()) {
    return null;
  }

  const androidUrl = await resolveAndroidDeferredUrl();
  if (androidUrl && isDeepLinkUrl(androidUrl)) {
    return androidUrl;
  }

  const iosUrl = await resolveIosDeferredUrl();
  if (iosUrl && isDeepLinkUrl(iosUrl)) {
    return iosUrl;
  }

  return null;
}

/**
 * Queue deferred marketing deep link when cold start had no direct URL.
 * Marks consumed after attempt so referrer/clipboard are not re-read.
 */
export async function ingestDeferredMarketingDeepLinkUrl(): Promise<boolean> {
  if (hasPendingMarketingDeepLink()) {
    return true;
  }
  if (await hasConsumedDeferredDeepLink()) {
    return false;
  }

  await getOrCreateInstallInstanceId();

  try {
    const url = await resolveDeferredMarketingDeepLinkUrl();
    if (url) {
      deepLinkManager.handle(url);
      if (__DEV__) {
        console.log("[DEEP_LINK] deferred marketing link ingested:", url);
      }
    }
  } finally {
    await markDeferredDeepLinkConsumed();
  }

  return hasPendingMarketingDeepLink();
}
