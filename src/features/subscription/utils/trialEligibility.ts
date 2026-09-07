/**
 * Final Android/iOS trial UI + purchase eligibility.
 *
 * Play / App Store offer data is the only source for whether a trial offer exists.
 * Backend `user.hasUsedTrial` + current entitlement decide whether we may present it.
 */

import { useAuthStore } from "../../auth/auth.store";
import { selectIsPremium, useSubscriptionStore } from "../subscription.store";

export type UserSubscriptionTrialState = {
  userHasActiveSubscription: boolean;
  userHasConsumedTrial: boolean;
  userHasPreviouslyPurchased: boolean;
};

export type TrialEligibilityInput = {
  productId?: string | null;
  playOfferIsTrial: boolean;
  playTrialDays: number;
  userHasActiveSubscription: boolean;
  userHasConsumedTrial: boolean;
  userHasPreviouslyPurchased?: boolean;
};

export type TrialEligibilityDecision = {
  shouldShowTrial: boolean;
  trialDays: number;
  playOfferIsTrial: boolean;
  playTrialDays: number;
  userHasActiveSubscription: boolean;
  userHasConsumedTrial: boolean;
  userHasPreviouslyPurchased: boolean;
};

function asBoolean(value: unknown): boolean {
  return value === true;
}

/** Existing backend + entitlement sources — do not invent a second subscription system. */
export function getUserSubscriptionTrialState(): UserSubscriptionTrialState {
  const user = useAuthStore.getState().user;
  const subState = useSubscriptionStore.getState();
  const userHasActiveSubscription = selectIsPremium(subState);
  const userHasConsumedTrial = asBoolean(user?.hasUsedTrial);
  const userHasPreviouslyPurchased =
    userHasConsumedTrial ||
    userHasActiveSubscription ||
    Boolean(user?.subscriptionDate) ||
    Boolean(subState.subscription?.planId);

  return {
    userHasActiveSubscription,
    userHasConsumedTrial,
    userHasPreviouslyPurchased,
  };
}

/**
 * Prefer a paid Play offer when the current user must not start another trial.
 * Does not manufacture a trial; only suppresses using one Play already returned.
 */
export function shouldPreferPaidAndroidOffer(
  state: UserSubscriptionTrialState = getUserSubscriptionTrialState()
): boolean {
  return state.userHasConsumedTrial || state.userHasActiveSubscription;
}

export function resolveTrialUiState(
  input: TrialEligibilityInput
): TrialEligibilityDecision {
  const playTrialDays =
    input.playOfferIsTrial && input.playTrialDays > 0 ? input.playTrialDays : 0;
  const userHasPreviouslyPurchased = asBoolean(
    input.userHasPreviouslyPurchased ??
      (input.userHasConsumedTrial || input.userHasActiveSubscription)
  );
  const shouldShowTrial =
    playTrialDays > 0 &&
    !input.userHasActiveSubscription &&
    !input.userHasConsumedTrial;

  return {
    shouldShowTrial,
    trialDays: shouldShowTrial ? playTrialDays : 0,
    playOfferIsTrial: input.playOfferIsTrial,
    playTrialDays,
    userHasActiveSubscription: input.userHasActiveSubscription,
    userHasConsumedTrial: input.userHasConsumedTrial,
    userHasPreviouslyPurchased,
  };
}

export function applyStoreTrialDaysForCurrentUser(
  playTrialDays: number
): number {
  const user = getUserSubscriptionTrialState();
  return resolveTrialUiState({
    playOfferIsTrial: playTrialDays > 0,
    playTrialDays,
    ...user,
  }).trialDays;
}

export function logTrialEligibilityDebug(
  productId: string | undefined,
  decision: TrialEligibilityDecision
): void {
  const payload = {
    productId: productId ?? "unknown",
    playOfferIsTrial: decision.playOfferIsTrial,
    playTrialDays: decision.playTrialDays,
    userHasActiveSubscription: decision.userHasActiveSubscription,
    userHasPreviouslyPurchased: decision.userHasPreviouslyPurchased,
    userHasConsumedTrial: decision.userHasConsumedTrial,
    shouldShowTrial: decision.shouldShowTrial,
  };
  console.log("[IAP-DEBUG] user subscription state", {
    productId: payload.productId,
    userHasActiveSubscription: payload.userHasActiveSubscription,
    userHasPreviouslyPurchased: payload.userHasPreviouslyPurchased,
    userHasConsumedTrial: payload.userHasConsumedTrial,
  });
  console.log("[IAP-DEBUG] trial eligibility", payload);
}

/** Keep the existing `hasUsedTrial` field current after a trial purchase. */
export function markCurrentUserHasUsedTrial(): void {
  const user = useAuthStore.getState().user;
  if (!user || user.hasUsedTrial) return;
  useAuthStore.getState().setUser({ ...user, hasUsedTrial: true });
}
