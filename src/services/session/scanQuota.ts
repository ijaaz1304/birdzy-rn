import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../../features/auth/auth.store";
import {
  selectIsPremium,
  useSubscriptionStore,
} from "../../features/subscription/subscription.store";
import {
  createScanAllowance,
  newScanAttemptId,
  type ScanAttempt,
  type ScanOutcome,
} from "./scanAllowance";

export const scanQuota = createScanAllowance({
  getIdentity: () => {
    const state = useAuthStore.getState();
    const user = state.user as {
      id?: string;
      _id?: string;
      isGuest?: boolean;
    } | null;
    return {
      accountId: user?.id || user?._id,
      // Guest sessions may receive a new server ID after signing out. Keep one local guest allowance.
      guestId:
        state.guestId ||
        user?.isGuest ||
        (state as { isGuest?: boolean }).isGuest
          ? "device"
          : null,
      isGuest:
        !!user?.isGuest ||
        !!(state as { isGuest?: boolean }).isGuest ||
        !state.isAuthenticated,
    };
  },
  readLegacyUsage: async () => {
    const [legacy, photo, sound] = await Promise.all([
      AsyncStorage.getItem("identificationUsageCount"),
      AsyncStorage.getItem("photoIdentificationUsageCount"),
      AsyncStorage.getItem("soundIdentificationUsageCount"),
    ]);
    const count = (value: string | null) => Math.max(0, Number(value) || 0);
    // Legacy count mirrors photo usage; never charge it twice.
    return Math.max(count(legacy), count(photo)) + count(sound);
  },
  chargeSuccessfulScans: true,
});
export const beginFreeScanAttempt = (id = newScanAttemptId()) =>
  scanQuota.begin(id, () => selectIsPremium(useSubscriptionStore.getState()));
export const completeFreeScanAttempt = async (
  attempt: ScanAttempt,
  outcome: ScanOutcome
) => {
  const result = await scanQuota.complete(attempt, outcome, () =>
    selectIsPremium(useSubscriptionStore.getState())
  );
  if (selectIsPremium(useSubscriptionStore.getState()))
    return { ...result, remaining: 30 };
  return scanQuota.currentScope() === attempt.identity
    ? result
    : scanQuota.get();
};
export const cancelFreeScanAttempt = (attempt: ScanAttempt) =>
  scanQuota.cancel(attempt);
export function subscribeToScanQuotaChanges(listener: () => void): () => void {
  const unsubscribeLedger = scanQuota.subscribe(listener);
  const unsubscribeAuth = useAuthStore.subscribe(listener);
  return () => {
    unsubscribeLedger();
    unsubscribeAuth();
  };
}

/** Idempotent completion for any attempt that displays the cannot-identify popup. */
export const recordUnsuccessfulScan = (
  id: string,
  identity = scanQuota.currentScope()
) =>
  scanQuota.recordFailure(
    id,
    () => selectIsPremium(useSubscriptionStore.getState()),
    identity
  );
