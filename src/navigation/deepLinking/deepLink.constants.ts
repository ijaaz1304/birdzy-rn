/**
 * Deep link hosts, URL scheme, and supported path segments.
 * Must stay in sync with `hosting/public` AASA, assetlinks, and index.html SUPPORTED_ROUTES.
 */

import { isDevIntent } from "../../lib/env/appEnv";

/** Custom URL scheme — production (`birdzy://collection`). */
export const DEEP_LINK_URL_SCHEME_PROD = "birdzy";

/** Custom URL scheme — dev/staging (`birdzy-dev://collection`). */
export const DEEP_LINK_URL_SCHEME_DEV = "birdzy-dev";

/** @deprecated Use `getDeepLinkUrlScheme()` — kept for backwards-compatible imports. */
export const DEEP_LINK_URL_SCHEME = DEEP_LINK_URL_SCHEME_PROD;

/** Fallback route label for hosting web pages (in-app unknown paths do not navigate). */
export const DEEP_LINK_DEFAULT_ROUTE = "home" as const;

/** Play Install Referrer param written by hosting before Play Store redirect. */
export const DEFERRED_DEEP_LINK_REFERRER_PARAM = "birdzy_dl";

export const DEEP_LINK_TEAM_ID = "FUQBY8BYY3";

export const DEEP_LINK_BUNDLE_IDS = {
  prod: "com.trackzio.birds",
  dev: "com.trackzio.birds.dev",
} as const;

export const DEEP_LINK_FIREBASE_HOSTING = {
  prod: {
    projectId: "birdzy-app",
    webApp: "birdzy-app.web.app",
    firebaseApp: "birdzy-app.firebaseapp.com",
  },
  dev: {
    projectId: "birdzy-app-dev",
    webApp: "birdzy-app-dev.web.app",
    firebaseApp: "birdzy-app-dev.firebaseapp.com",
  },
} as const;

/** Path segments accepted in HTTPS and custom-scheme URLs. */
export const DEEP_LINK_SUPPORTED_ROUTE_NAMES = [
  "home",
  "identify",
  "camera",
  "catalogue",
  "catalog",
  "collection",
  "feed",
  "subs",
  "subscription",
  "settings",
  "ask-ai",
  "askai",
  "guides",
  "quiz",
  "personality",
  "bird-personality",
  "rock-personality",
  "sighting",
  "bird",
] as const;

export type DeepLinkRouteName =
  (typeof DEEP_LINK_SUPPORTED_ROUTE_NAMES)[number];

export function getDeepLinkUrlScheme(): string {
  return isDevIntent() ? DEEP_LINK_URL_SCHEME_DEV : DEEP_LINK_URL_SCHEME_PROD;
}

export function isDeepLinkSchemeForCurrentEnv(scheme: string): boolean {
  return scheme.toLowerCase().replace(/:$/, "") === getDeepLinkUrlScheme().toLowerCase();
}

export function getDeepLinkHttpsHosts(): string[] {
  const hosting = isDevIntent()
    ? DEEP_LINK_FIREBASE_HOSTING.dev
    : DEEP_LINK_FIREBASE_HOSTING.prod;
  return [hosting.webApp, hosting.firebaseApp];
}

export function getDeepLinkPrimaryHost(): string {
  const hosting = isDevIntent()
    ? DEEP_LINK_FIREBASE_HOSTING.dev
    : DEEP_LINK_FIREBASE_HOSTING.prod;
  return hosting.webApp;
}

export function getDeepLinkPrefixes(): string[] {
  const scheme = getDeepLinkUrlScheme();
  return [
    `${scheme}://`,
    ...getDeepLinkHttpsHosts().map((h) => `https://${h}`),
  ];
}
