/**
 * Deep-link authentication flow (Trackzio / Rockzy pattern).
 * Ensures a guest or account session exists before applying marketing deep links,
 * and skips first-run onboarding gates for deep-link entry.
 */

import type { NavigationContainerRef } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../../features/auth/auth.store";
import { useOnboardingStore } from "../../features/onboarding/onboarding.store";
import { usePostAuthOnboardingStore } from "../../features/post-auth-onboarding/post-auth-onboarding.store";
import { UI_STATE_KEYS } from "../../constants/storageConstants";
import {
  selectIsPremium,
  useSubscriptionStore,
} from "../../features/subscription/subscription.store";
import type { RootStackParamList } from "../types";
import type { RootNavigateFn } from "../../services/notifications/notificationRouting";
import { NavigationService } from "../../utils/navigation";
import {
  deepLinkManager,
  hasAppSessionForDeepLink,
  hasPendingMarketingDeepLink,
} from "./deepLinkManager";

/** Routes that block marketing deep links until the user finishes first-run gates. */
export const DEEP_LINK_GATE_ROUTE_NAMES = [
  "Splash",
  "Onboarding",
  "PostAuthOnboarding",
  "AuthStack",
] as const;

/** Routes that must be left before apply (Splash stays until apply so the user sees it). */
const DEEP_LINK_BLOCKING_GATE_ROUTES = [
  "Onboarding",
  "PostAuthOnboarding",
  "AuthStack",
] as const;

const AUTH_HYDRATION_WAIT_MS = 4000;
const AUTH_HYDRATION_POLL_MS = 50;
/** Same key as `TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY` — kept here to avoid UI import in this module. */
const TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY = "app_logs_tooltip_eligible_signup";

export type DeepLinkGateRouteName =
  (typeof DEEP_LINK_GATE_ROUTE_NAMES)[number];

export type ApplyMarketingDeepLinkEscapeOptions = {
  getActiveRoute: () => string | undefined;
  isNavigatorReady: () => boolean;
  navigate: RootNavigateFn;
  navigationRef?: NavigationContainerRef<RootStackParamList> | null;
  /** Fires after the deep link target is applied — use to lock bootstrap routing. */
  onDeepLinkApplied?: () => void;
};

export type ApplyMarketingDeepLinkEscapeResult =
  | "no_pending"
  | "waiting_navigator"
  | "waiting_gate"
  | "guest_login_failed"
  | "applied";

export function isDeepLinkGateRoute(
  routeName: string | undefined
): routeName is DeepLinkGateRouteName {
  return (
    routeName != null &&
    (DEEP_LINK_GATE_ROUTE_NAMES as readonly string[]).includes(routeName)
  );
}

function isBlockingGateRoute(routeName: string | undefined): boolean {
  return (
    routeName != null &&
    (DEEP_LINK_BLOCKING_GATE_ROUTES as readonly string[]).includes(routeName)
  );
}

/** Skip first-run and post-auth onboarding gates for deep-link entry. */
export function prepareAppForDeepLinkEntry(): void {
  useOnboardingStore.getState().setHasCompletedOnboarding(true);
  usePostAuthOnboardingStore.getState().markCompleted();
  void suppressFtueForDeepLinkEntry();
}

/** Guest login enables Home FTUE; deep links must not stay on Home for that tour. */
export async function suppressFtueForDeepLinkEntry(): Promise<void> {
  try {
    await AsyncStorage.setItem(UI_STATE_KEYS.APP_LOGS_TOOLTIP_SHOWN, "true");
    await AsyncStorage.removeItem(TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY);
  } catch {
    // Best-effort; navigation still proceeds.
  }
}

/**
 * Wait until auth persist has rehydrated so guest login cannot be overwritten.
 * Treats missing `_hasHydrated` as already ready (unit tests / non-persist mocks).
 */
export async function waitForAuthHydration(
  timeoutMs = AUTH_HYDRATION_WAIT_MS
): Promise<boolean> {
  if (useAuthStore.getState()._hasHydrated !== false) {
    return true;
  }

  const startedAt = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      if (useAuthStore.getState()._hasHydrated !== false) {
        resolve(true);
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        resolve(false);
        return;
      }
      setTimeout(tick, AUTH_HYDRATION_POLL_MS);
    };
    tick();
  });
}

/**
 * Reset away from onboarding/auth gate screens when a marketing link is queued.
 * Does not require a session — guest login may still be running.
 */
export function bootstrapNavigationForDeepLink(
  getActiveRoute: () => string | undefined
): boolean {
  if (!hasPendingMarketingDeepLink()) return false;

  const active = getActiveRoute();
  if (!isBlockingGateRoute(active)) return false;

  prepareAppForDeepLinkEntry();
  const pending = deepLinkManager.getPendingDestination();
  if (
    !pending ||
    !NavigationService.resetToResolvedDestination(pending)
  ) {
    NavigationService.reset("MainTabs");
  }

  if (__DEV__) {
    console.log("[DEEP_LINK] bootstrap escaped gate (was", active, ")");
  }
  return true;
}

let escapePipelinePromise: Promise<ApplyMarketingDeepLinkEscapeResult> | null =
  null;

function applyPendingDestination(
  options: ApplyMarketingDeepLinkEscapeOptions
): boolean {
  const applied = deepLinkManager.applyPendingIfNeeded(
    options.navigate,
    options.navigationRef
  );
  if (applied) {
    options.onDeepLinkApplied?.();
    if (__DEV__) {
      console.log("[DEEP_LINK] escape complete — target applied");
    }
  }
  return applied;
}

function landOnHome(
  options: ApplyMarketingDeepLinkEscapeOptions
): ApplyMarketingDeepLinkEscapeResult {
  prepareAppForDeepLinkEntry();
  const pending = deepLinkManager.getPendingDestination();
  if (pending && NavigationService.resetToResolvedDestination(pending, options.navigationRef)) {
    deepLinkManager.clearPending();
    options.onDeepLinkApplied?.();
    if (__DEV__) {
      console.log("[DEEP_LINK] escape fallback applied pending destination");
    }
    return "applied";
  }
  NavigationService.reset("MainTabs");
  options.onDeepLinkApplied?.();
  if (__DEV__) {
    console.log("[DEEP_LINK] escape fallback -> MainTabs");
  }
  return "applied";
}

/** Apply the queued destination without first resetting onto Home. */
function applyPendingOrRetry(
  options: ApplyMarketingDeepLinkEscapeOptions
): Promise<ApplyMarketingDeepLinkEscapeResult> {
  if (applyPendingDestination(options)) {
    return Promise.resolve("applied");
  }
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      if (applyPendingDestination(options)) {
        resolve("applied");
        return;
      }
      resolve(landOnHome(options));
    });
  });
}

async function runMarketingDeepLinkEscape(
  options: ApplyMarketingDeepLinkEscapeOptions
): Promise<ApplyMarketingDeepLinkEscapeResult> {
  if (!hasPendingMarketingDeepLink()) return "no_pending";

  prepareAppForDeepLinkEntry();
  const hasSession = await ensureGuestSessionForDeepLink();
  if (!hasSession) return "guest_login_failed";
  await suppressFtueForDeepLinkEntry();

  if (!options.isNavigatorReady()) return "waiting_navigator";

  const active = options.getActiveRoute();
  const leavingSplash = active === "Splash" || active == null;

  // Cold start: stay on Splash until apply, then reset directly to the link target.
  if (leavingSplash) {
    prepareAppForDeepLinkEntry();
    return applyPendingOrRetry(options);
  }

  const escapedGate = bootstrapNavigationForDeepLink(options.getActiveRoute);

  if (escapedGate) {
    return applyPendingOrRetry(options);
  }

  if (applyPendingDestination(options)) {
    return "applied";
  }

  return landOnHome(options);
}

/**
 * Single entry path for marketing deep links: guest login (if needed), skip gate
 * screens, apply target, and notify caller so bootstrap cannot overwrite.
 */
export function applyMarketingDeepLinkEscape(
  options: ApplyMarketingDeepLinkEscapeOptions
): Promise<ApplyMarketingDeepLinkEscapeResult> {
  if (escapePipelinePromise) return escapePipelinePromise;

  escapePipelinePromise = runMarketingDeepLinkEscape(options).finally(() => {
    escapePipelinePromise = null;
  });
  return escapePipelinePromise;
}

/**
 * Create or reuse a guest session when a marketing deep link arrives without auth.
 * Waits for persist rehydration first so the new session is not overwritten.
 * Returns true when `hasAppSessionForDeepLink()` is satisfied.
 */
export async function ensureGuestSessionForDeepLink(): Promise<boolean> {
  await waitForAuthHydration();

  if (hasAppSessionForDeepLink()) {
    useSubscriptionStore.getState().syncFromAuthStore();
    return true;
  }

  const auth = useAuthStore.getState();
  try {
    await auth.guestLogin(auth.guestId || undefined);
    useSubscriptionStore.getState().syncFromAuthStore();
    return hasAppSessionForDeepLink();
  } catch (error) {
    if (__DEV__) {
      console.warn("[DEEP_LINK] guest login failed", error);
    }
    return false;
  }
}

/** Whether subscription deep link should land on Home instead of paywall. */
export function shouldDeepLinkSubscriptionOpenHome(): boolean {
  return selectIsPremium(useSubscriptionStore.getState());
}
