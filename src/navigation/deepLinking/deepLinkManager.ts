/**
 * Central deep link queue and navigation applier (Trackzio / Banknote pattern).
 * Pending links apply after auth session is ready. Guest login + onboarding skip
 * are handled in deepLinkAuthFlow + RootNavigator bootstrap.
 */

import type { NavigationContainerRef } from "@react-navigation/native";
import { DeviceEventEmitter } from "react-native";
import type { NavigatorScreenParams } from "@react-navigation/native";
import { useAuthStore } from "../../features/auth/auth.store";
import type { MainTabParamList, RootStackParamList } from "../types";
import type {
  ResolvedRootNavigation,
  RootNavigateFn,
} from "../../services/notifications/notificationRouting";
import {
  selectIsPremium,
  useSubscriptionStore,
} from "../../features/subscription/subscription.store";
import { NavigationService } from "../../utils/navigation";
import {
  logDeepLinkApplied,
  logDeepLinkReceived,
  logDeepLinkSkipped,
} from "./deepLinkAnalytics";
import { parseDeepLinkUrl } from "./parseDeepLinkUrl";

export const DEEP_LINK_RECEIVED_EVENT = "trackzio.deepLinkReceived";

const DUPLICATE_LINK_DEBOUNCE_MS = 500;

let pendingDestination: ResolvedRootNavigation | null = null;
let pendingSourceUrl: string | null = null;
let lastHandledUrl: string | null = null;
let lastHandledAt = 0;
let applyInFlight = false;

export function hasAppSessionForDeepLink(): boolean {
  const auth = useAuthStore.getState();
  return auth.isAuthenticated && Boolean(auth.token) && auth.user != null;
}

export function hasPendingMarketingDeepLink(): boolean {
  return pendingDestination != null;
}

export function isSubscriptionDeepLinkDestination(
  destination: ResolvedRootNavigation
): boolean {
  return destination.screen === "SubscriptionStack";
}

function mainTabsHome(): ResolvedRootNavigation {
  return {
    screen: "MainTabs",
    params: {
      screen: "Home",
    } as unknown as NavigatorScreenParams<MainTabParamList>,
  };
}

/** Resolve subscription campaign links after subscription status is known. */
export function resolveDeepLinkDestinationForApply(
  destination: ResolvedRootNavigation
): ResolvedRootNavigation {
  if (!isSubscriptionDeepLinkDestination(destination)) {
    return destination;
  }

  if (selectIsPremium(useSubscriptionStore.getState())) {
    return mainTabsHome();
  }

  return {
    screen: "SubscriptionStack",
    params: {
      screen: "SubscriptionMain",
      params: { comingFrom: "deepLink" },
    },
  };
}

function logDeepLink(message: string, url?: string) {
  if (__DEV__) {
    console.log(url ? `✅ ${message}: ${url}` : `✅ ${message}`);
  }
}

function logDeepLinkSkip(reason: string, url?: string) {
  if (__DEV__) {
    console.log(
      url
        ? `⚠️ Deep link skipped (${reason}): ${url}`
        : `⚠️ Deep link skipped (${reason})`
    );
  }
  logDeepLinkSkipped(reason, url);
}

function dispatchReceived() {
  DeviceEventEmitter.emit(DEEP_LINK_RECEIVED_EVENT);
}

export const deepLinkManager = {
  getPendingDestination(): ResolvedRootNavigation | null {
    return pendingDestination;
  },

  getPendingSourceUrl(): string | null {
    return pendingSourceUrl;
  },

  clearPending(): void {
    pendingDestination = null;
    pendingSourceUrl = null;
  },

  /** Clears pending destination and debounce guards (tests only). */
  _resetStateForTests(): void {
    pendingDestination = null;
    pendingSourceUrl = null;
    lastHandledUrl = null;
    lastHandledAt = 0;
    applyInFlight = false;
  },

  handle(url: string): void {
    const trimmed = url?.trim();
    if (!trimmed) return;

    const now = Date.now();
    if (
      trimmed === lastHandledUrl &&
      now - lastHandledAt < DUPLICATE_LINK_DEBOUNCE_MS
    ) {
      logDeepLinkSkip("duplicate debounce", trimmed);
      return;
    }

    const destination = parseDeepLinkUrl(trimmed);
    logDeepLinkReceived(trimmed, Boolean(destination));
    if (!destination) {
      logDeepLinkSkip("unrecognized path", trimmed);
      return;
    }

    lastHandledUrl = trimmed;
    lastHandledAt = now;
    pendingDestination = destination;
    pendingSourceUrl = trimmed;
    logDeepLink("Deep link parsed", trimmed);
    dispatchReceived();
  },

  applyDestination(
    destination: ResolvedRootNavigation,
    navigate: RootNavigateFn,
    navigationRef?: NavigationContainerRef<RootStackParamList> | null
  ): boolean {
    if (!hasAppSessionForDeepLink()) {
      logDeepLinkSkip("no session");
      return false;
    }

    if (applyInFlight) {
      logDeepLinkSkip("apply in flight");
      return false;
    }

    applyInFlight = true;
    const sourceUrl = pendingSourceUrl;
    try {
      const resolved = resolveDeepLinkDestinationForApply(destination);
      pendingDestination = null;
      pendingSourceUrl = null;

      const didReset = NavigationService.resetToResolvedDestination(
        {
          screen: resolved.screen as string,
          params: resolved.params as object | undefined,
        },
        navigationRef
      );

      if (!didReset) {
        navigate(resolved.screen as string, resolved.params as object);
      }

      if (sourceUrl) {
        logDeepLinkApplied(sourceUrl, resolved.screen as string);
      }
      logDeepLink(`Deep link applied: ${resolved.screen}`);
      return true;
    } finally {
      applyInFlight = false;
    }
  },

  applyPendingIfNeeded(
    navigate: RootNavigateFn,
    navigationRef?: NavigationContainerRef<RootStackParamList> | null
  ): boolean {
    if (!pendingDestination) return false;
    return this.applyDestination(pendingDestination, navigate, navigationRef);
  },
};
