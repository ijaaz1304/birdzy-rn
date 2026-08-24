/**
 * Pure runtime subscription plan resolver.
 *
 * RULES (enforced):
 * - Functions accept arguments ONLY: (firstAppOpenAt, isPremium).
 * - MUST NOT import or read: useSubscriptionStore, getCachedFirstAppOpenAt, React hooks, app logs.
 *
 * Flow: discountTimer → getRuntimeSubscriptionPlans(firstAppOpenAt, isPremium) → useSubscriptionPlansWithPrices() → UI
 */

import { isDiscountPhaseActive } from "../../discount/discountTimer.store";
import { getSubscriptionPlans } from "../../../data/subscription/subscriptionPlansLoader";
import type { LoadedSubscriptionPlan } from "@/data/subscription/subscriptionPlansLoader";
import { useSubscriptionStore } from "../subscription.store";

export function getRuntimeSubscriptionPlans(
  firstAppOpenAt: number | null,
  isPremium: boolean
): LoadedSubscriptionPlan[] {
  if (useSubscriptionStore.getState().devDisable50Discount) {
    return getSubscriptionPlans(firstAppOpenAt, isPremium, false);
  }
  if (!firstAppOpenAt || isPremium) {
    return getSubscriptionPlans(null, isPremium);
  }
  const offerActive = isDiscountPhaseActive(firstAppOpenAt);
  return getSubscriptionPlans(firstAppOpenAt, isPremium, offerActive);
}

export function getDefaultSelectedPlanId(
  firstAppOpenAt: number | null,
  isPremium: boolean
): string {
  const plans = getRuntimeSubscriptionPlans(firstAppOpenAt, isPremium);
  return plans[0]?.id ?? "yearly_birdzy_pack";
}
