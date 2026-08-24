/**
 * Diagnostics for collection creation vs free-user limits.
 * Scans and feed use the same `selectIsPremium` source; this module logs whether a block is
 * from the frontend gate or from the API so support can tell BE sync issues from client state.
 */

import {
  selectIsPremium,
  useSubscriptionStore,
} from "../../features/subscription/subscription.store";
import { useAuthStore } from "../../features/auth/auth.store";
import { useAppLogsStore } from "../../features/app-logs/app-logs.store";
import { FREE_COLLECTION_LIMIT } from "../../constants/appConstants";

const LOG_PREFIX = "[CollectionLimit]";

export function getCollectionLimitPremiumSnapshot(): Record<string, unknown> {
  const sub = useSubscriptionStore.getState();
  const user = useAuthStore.getState().user;
  return {
    clientSelectIsPremium: selectIsPremium(sub),
    subscriptionTier: sub.subscription?.tier ?? null,
    subscriptionRecordIsActive: sub.subscription?.isActive ?? null,
    localPremiumOverride: sub.localPremiumOverride,
    devForcePremium: sub.devForcePremium,
    authProfileIsSubscribed: user?.isSubscribed ?? null,
    subscriptionPlanId: sub.subscription?.planId ?? null,
    howOtherFeaturesWork:
      "identify: canIdentify() returns true immediately when selectIsPremium. feed: daily post cap runs only when !isPremium. collection FAB uses the same selectIsPremium; a 403 on create still means the server rejected the request.",
  };
}

export function logCollectionUiGate(
  phase: string,
  meta: Record<string, unknown>
): void {
  useAppLogsStore.getState().info(`${LOG_PREFIX} ${phase}`, {
    gate: "frontend",
    ...meta,
    freeCollectionLimit: FREE_COLLECTION_LIMIT,
    ...getCollectionLimitPremiumSnapshot(),
  });
}

/** Sync subscription mirror and return whether the collection limit paywall should be shown. */
export function shouldShowCollectionLimitPaywall(): boolean {
  useSubscriptionStore.getState().syncFromAuthStore();
  return !selectIsPremium(useSubscriptionStore.getState());
}

export function logCollectionCreateApiResult(payload: {
  httpStatus?: number;
  reason?: string;
  message?: string;
  treatedAsLimitOrUpgrade: boolean;
}): void {
  const snap = getCollectionLimitPremiumSnapshot();
  const premium = snap.clientSelectIsPremium === true;
  if (!payload.treatedAsLimitOrUpgrade) {
    useAppLogsStore.getState().info(`${LOG_PREFIX} create_collection_api`, {
      gate: "backend",
      interpretation: "non_limit_error",
      ...payload,
      ...snap,
    });
    return;
  }
  if (premium) {
    useAppLogsStore.getState().warn(`${LOG_PREFIX} create_collection_api`, {
      gate: "backend",
      interpretation:
        "device_premium_but_api_rejected: client considers user premium (selectIsPremium) but API returned limit/forbidden — check server subscription / collection entitlements.",
      ...payload,
      ...snap,
    });
  } else {
    useAppLogsStore.getState().info(`${LOG_PREFIX} create_collection_api`, {
      gate: "backend",
      interpretation:
        "expected_free_or_nonpremium_limit: API limit response matches non-premium client state.",
      ...payload,
      ...snap,
    });
  }
}
