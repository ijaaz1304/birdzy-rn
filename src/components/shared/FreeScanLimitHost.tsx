import {
  scanQuota,
  subscribeToScanQuotaChanges,
} from "../../services/session/scanQuota";
import { dismissFreeScanLimitPrompt } from "../../services/freeScanLimitPrompt";
import React from "react";
import { FreeScanLimitDialog } from "./FreeScanLimitDialog";
import {
  selectIsPremium,
  useSubscriptionStore,
} from "../../features/subscription/subscription.store";
export function FreeScanLimitHost({ onUpgrade }: { onUpgrade: () => void }) {
  React.useEffect(() => {
    let scope = scanQuota.currentScope();
    return subscribeToScanQuotaChanges(() => {
      const next = scanQuota.currentScope();
      if (next !== scope) {
        scope = next;
        dismissFreeScanLimitPrompt();
      }
    });
  }, []);
  const premium = useSubscriptionStore(selectIsPremium);
  return (
    <FreeScanLimitDialog active isPremium={premium} onUpgrade={onUpgrade} />
  );
}
