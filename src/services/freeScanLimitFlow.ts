import {
  selectIsPremium,
  useSubscriptionStore,
} from "../features/subscription/subscription.store";
import { canIdentify } from "./session/usageLimit.service";
import { requestFreeScanLimitPrompt } from "./freeScanLimitPrompt";
/** Used before camera entry as well as immediately before submission. */
export async function requestFreeScanLimitIfBlocked(): Promise<boolean> {
  try {
    if (await canIdentify()) return false;
    // Entitlements may change while persisted quota is being read.
    if (selectIsPremium(useSubscriptionStore.getState())) return false;
    requestFreeScanLimitPrompt();
    return true;
  } catch {
    return false;
  }
}
export async function runWithFreeScanAccess(
  proceed: () => void
): Promise<boolean> {
  if (await requestFreeScanLimitIfBlocked()) return false;
  proceed();
  return true;
}
