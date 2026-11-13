import { useAuthStore } from "../../features/auth/auth.store";
import {
  selectIsPremium,
  useSubscriptionStore,
} from "../../features/subscription/subscription.store";
import { getBackendAiUsage, subscribeBackendAiUsage } from "./backendAiUsage";
import {
  newScanAttemptId,
  type ScanAttempt,
  type ScanOutcome,
} from "./scanAllowance";

const active = new Map<string, ScanAttempt>();
const refreshing = new Map<string, Promise<void>>();
const currentIdentity = () => useAuthStore.getState().user?.id ?? "";
const currentScope = () => `backend:${currentIdentity()}`;

export const isFreeScanExempt = () =>
  selectIsPremium(useSubscriptionStore.getState()) ||
  useAuthStore.getState().user?.isSubscribed === true ||
  useAuthStore.getState().user?.isRewarded === true;

export function getCurrentBackendAiUsage() {
  return getBackendAiUsage(currentIdentity())?.usage;
}

async function refreshUsage(): Promise<void> {
  const identity = currentIdentity();
  if (!identity) return;
  const snapshot = getBackendAiUsage(identity);
  if (snapshot && Date.now() - snapshot.receivedAt < 60000) return;
  let pending = refreshing.get(identity);
  if (!pending) {
    pending = useAuthStore
      .getState()
      .refreshProfileSilent()
      .then(() => undefined)
      .catch(() => {
        // The identify endpoint still enforces the quota if profile refresh fails.
      })
      .finally(() => {
        refreshing.delete(identity);
      });
    refreshing.set(identity, pending);
  }
  await pending;
}

async function getAllowance() {
  const scope = currentScope();
  await refreshUsage();
  if (scope !== currentScope()) return getAllowance();
  const usage = getCurrentBackendAiUsage();
  return {
    scope,
    used: usage?.successCount ?? 0,
    failures: usage?.errorCount ?? 0,
    limit: usage?.successThreshold ?? 0,
    known: usage !== undefined,
    remaining: usage
      ? Math.max(0, usage.successThreshold - usage.successCount)
      : 0,
  };
}

/** Backend counts are authoritative. Attempt handles only prevent duplicate submissions. */
export const scanQuota = {
  currentScope,
  get: getAllowance,
  subscribe: subscribeBackendAiUsage,
  cancel(attempt: ScanAttempt) {
    if (active.get(attempt.scope) === attempt) active.delete(attempt.scope);
  },
};

export async function beginFreeScanAttempt(id = newScanAttemptId()) {
  const allowance = await getAllowance();
  if (!isFreeScanExempt() && allowance.known && allowance.remaining === 0) {
    return { status: "blocked" as const };
  }
  if (active.has(allowance.scope)) return { status: "busy" as const };
  const attempt: ScanAttempt = {
    id,
    scope: allowance.scope,
    identity: allowance.scope,
    premium: isFreeScanExempt(),
  };
  active.set(attempt.scope, attempt);
  return { status: "ready" as const, attempt };
}

export async function completeFreeScanAttempt(
  attempt: ScanAttempt,
  _outcome: ScanOutcome
) {
  scanQuota.cancel(attempt);
  return getAllowance();
}

export const cancelFreeScanAttempt = (attempt: ScanAttempt) =>
  scanQuota.cancel(attempt);

export function subscribeToScanQuotaChanges(listener: () => void): () => void {
  const unsubscribeUsage = subscribeBackendAiUsage(listener);
  const unsubscribeAuth = useAuthStore.subscribe(listener);
  const unsubscribeSubscription = useSubscriptionStore.subscribe(listener);
  return () => {
    unsubscribeUsage();
    unsubscribeAuth();
    unsubscribeSubscription();
  };
}

/** Showing a popup, preprocessing failure or network failure never charges usage locally. */
export const recordUnsuccessfulScan = (
  _id: string,
  _identity = currentScope()
) => getAllowance();
