import AsyncStorage from "@react-native-async-storage/async-storage";
import { scanQuota } from "./session/scanQuota";
import { canIdentify } from "./session/usageLimit.service";
import { requestFreeScanLimitPrompt } from "./freeScanLimitPrompt";
import {
  selectIsPremium,
  useSubscriptionStore,
} from "../features/subscription/subscription.store";
let checking: Promise<void> | null = null;
/** The introduction is per identity; submission gates remain exhaustion-only. */
export function requestFreeScanCameraEntry(
  isActive = () => true
): Promise<void> {
  if (checking)
    return checking.then(() => {
      if (isActive()) return requestFreeScanCameraEntry(isActive);
    });
  checking = (async () => {
    if (!isActive() || selectIsPremium(useSubscriptionStore.getState())) return;
    // Exhaustion is shown on the next Submit, never merely on camera entry.
    if (!(await canIdentify())) return;
    const scope = scanQuota.currentScope();
    const key = `freeScanIntroductionShown_v2:${scope}`;
    if ((await AsyncStorage.getItem(key)) === "true") return;
    if (
      !isActive() ||
      selectIsPremium(useSubscriptionStore.getState()) ||
      scanQuota.currentScope() !== scope
    )
      return;
    requestFreeScanLimitPrompt(true, async () => {
      if (scanQuota.currentScope() === scope)
        await AsyncStorage.setItem(key, "true");
    });
  })()
    .catch(() => {
      // Retry on the next camera visit if storage is unavailable.
    })
    .finally(() => {
      checking = null;
    });
  return checking;
}
