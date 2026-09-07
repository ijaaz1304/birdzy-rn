/**
 * Parses birdzy:// / birdzy-dev:// and Firebase Hosting HTTPS URLs into root navigation targets.
 */

import type { NavigatorScreenParams } from "@react-navigation/native";
import type { MainTabParamList } from "../types";
import type { ResolvedRootNavigation } from "../../services/notifications/notificationRouting";
import { getIdentificationCameraEntryParams } from "../../features/camera/identificationNavigation";
import { parsePasswordResetDeepLink } from "../../features/auth/utils/authDeepLinks";
import {
  DEEP_LINK_SUPPORTED_ROUTE_NAMES,
  getDeepLinkHttpsHosts,
  getDeepLinkUrlScheme,
  isDeepLinkSchemeForCurrentEnv,
  type DeepLinkRouteName,
} from "./deepLink.constants";

function mainTabsParams(
  params: NavigatorScreenParams<MainTabParamList>
): NavigatorScreenParams<MainTabParamList> {
  return params;
}

function resolveHomeNavigation(): ResolvedRootNavigation {
  return {
    screen: "MainTabs",
    params: mainTabsParams({
      screen: "Home",
    }),
  };
}

function isSupportedRoute(segment: string): segment is DeepLinkRouteName {
  return (DEEP_LINK_SUPPORTED_ROUTE_NAMES as readonly string[]).includes(
    segment
  );
}

function isHostingHostnameSegment(segment: string): boolean {
  const normalized = segment.toLowerCase();
  return getDeepLinkHttpsHosts().some(
    (host) => normalized === host || normalized.endsWith(`.${host}`)
  );
}

function normalizePathSegment(raw: string): string {
  return raw.trim().toLowerCase().replace(/\/+$/, "");
}

function parseUrlParts(url: string): { scheme: string; parts: string[] } | null {
  try {
    const parsed = new URL(url);
    const scheme = parsed.protocol.replace(":", "").toLowerCase();
    const isWebScheme = scheme === "http" || scheme === "https";

    if (!isWebScheme && parsed.hostname) {
      const hostSegment = normalizePathSegment(parsed.hostname);
      const pathSegments = parsed.pathname
        .split("/")
        .filter(Boolean)
        .map(normalizePathSegment);
      return { scheme, parts: [hostSegment, ...pathSegments] };
    }

    const parts = parsed.pathname
      .split("/")
      .filter(Boolean)
      .map(normalizePathSegment);
    return { scheme, parts };
  } catch {
    const withoutScheme = url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
    const pathOnly = withoutScheme.split(/[?#]/)[0] ?? "";
    const rawParts = pathOnly.split("/").filter(Boolean);
    const schemeMatch = url.match(/^([a-z][a-z0-9+.-]*):\/\//i);
    const fallbackScheme =
      schemeMatch?.[1]?.toLowerCase() ?? getDeepLinkUrlScheme();

    if (rawParts.length === 0) {
      return { scheme: fallbackScheme, parts: [] };
    }

    const first = normalizePathSegment(rawParts[0]);
    if (
      getDeepLinkHttpsHosts().some(
        (host) => first === host || first.endsWith(host)
      )
    ) {
      return {
        scheme: getDeepLinkUrlScheme(),
        parts: rawParts.slice(1).map(normalizePathSegment),
      };
    }

    return {
      scheme: fallbackScheme,
      parts: rawParts.map(normalizePathSegment),
    };
  }
}

/**
 * Extract path segments from URL (ignores query/hash).
 */
export function getDeepLinkPathParts(url: string): string[] {
  const parsed = parseUrlParts(url);
  return parsed?.parts ?? [];
}

/** Returns first path segment (legacy helper). */
export function getDeepLinkPathSegment(url: string): string | null {
  const parts = getDeepLinkPathParts(url);
  return parts[0] ?? null;
}

export function isDeepLinkUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (parsePasswordResetDeepLink(trimmed)) return false;

  const schemeMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):\/\//i);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme === getDeepLinkUrlScheme().toLowerCase()) return true;
    if (scheme !== "http" && scheme !== "https") return false;
  }

  try {
    const host = new URL(trimmed).hostname.toLowerCase();
    return getDeepLinkHttpsHosts().some((h) => host === h);
  } catch {
    return false;
  }
}

function isCustomSchemeUrl(url: string): boolean {
  const schemeMatch = url.trim().match(/^([a-z][a-z0-9+.-]*):\/\//i);
  if (!schemeMatch) return false;
  return isDeepLinkSchemeForCurrentEnv(schemeMatch[1]);
}

function resolveStaticRoute(segment: string): ResolvedRootNavigation | null {
  switch (segment) {
    case "home":
      return resolveHomeNavigation();

    case "identify":
    case "camera":
      return {
        screen: "MainTabs",
        params: mainTabsParams({
          screen: "Camera",
          params: getIdentificationCameraEntryParams(),
        }),
      };

    case "catalogue":
    case "catalog":
      return {
        screen: "MainTabs",
        params: mainTabsParams({
          screen: "Catalogue",
          params: { screen: "CatalogueMain" },
        }),
      };

    case "collection":
      return {
        screen: "MainTabs",
        params: mainTabsParams({
          screen: "Collection",
          params: { screen: "CollectionMain", params: {} },
        }),
      };

    case "feed":
      return {
        screen: "MainTabs",
        params: mainTabsParams({
          screen: "Feed",
          params: { screen: "FeedMain" },
        }),
      };

    case "subs":
    case "subscription":
      return {
        screen: "SubscriptionStack",
        params: {
          screen: "SubscriptionMain",
          params: { comingFrom: "deepLink" },
        },
      };

    case "settings":
      return {
        screen: "SettingsStack",
        params: { screen: "SettingsMain" },
      };

    case "ask-ai":
    case "askai":
      return {
        screen: "AskAIStack",
        params: { screen: "AskAIMain" },
      };

    case "quiz":
    case "personality":
    case "bird-personality":
    case "rock-personality":
      return {
        screen: "BirdPersonalityStack",
        params: { screen: "BirdPersonalityIntro" },
      };

    default:
      return null;
  }
}

function resolveMultiSegmentRoute(
  parts: string[]
): ResolvedRootNavigation | null {
  const [first, second, third] = parts;

  if (first === "feed" && second === "post" && third) {
    return {
      screen: "MainTabs",
      params: mainTabsParams({
        screen: "Feed",
        params: {
          screen: "PostDetails",
          params: { postId: third },
        },
      }),
    };
  }

  if ((first === "sighting" || first === "bird") && second) {
    return {
      screen: "MainTabs",
      params: mainTabsParams({
        screen: "Catalogue",
        params: {
          screen: "BirdDetails",
          params: {
            mushroomId: second,
            source: "catalogue",
          },
        },
      }),
    };
  }

  return null;
}

export function parseDeepLinkUrl(url: string): ResolvedRootNavigation | null {
  if (!isDeepLinkUrl(url)) return null;

  const parsed = parseUrlParts(url);
  if (!parsed) return null;

  const { scheme, parts } = parsed;

  if (isCustomSchemeUrl(url) && !isDeepLinkSchemeForCurrentEnv(scheme)) {
    return null;
  }

  if (parts.length === 0) {
    return resolveHomeNavigation();
  }

  if (parts.length === 1 && isHostingHostnameSegment(parts[0])) {
    return resolveHomeNavigation();
  }

  if (parts.length >= 2) {
    const multi = resolveMultiSegmentRoute(parts);
    if (multi) return multi;
  }

  const segment = parts[0];
  if (!segment || isHostingHostnameSegment(segment)) {
    return resolveHomeNavigation();
  }

  if (!isSupportedRoute(segment)) {
    return null;
  }

  return resolveStaticRoute(segment);
}
