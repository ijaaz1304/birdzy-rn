import { useEffect, useRef } from "react";
import {
  recordUnsuccessfulScan,
  scanQuota,
} from "../services/session/scanQuota";

/** A failure popup may refresh displayed backend usage; it never charges a scan. */
export function useUnsuccessfulScanPopup(
  visible: boolean,
  attemptId: string,
  onRemaining?: (remaining: number) => void
): void {
  const owner = useRef({ attemptId, identity: scanQuota.currentScope() });
  if (owner.current.attemptId !== attemptId) {
    owner.current = { attemptId, identity: scanQuota.currentScope() };
  }
  const identity = owner.current.identity;
  useEffect(() => {
    if (!visible || identity !== scanQuota.currentScope()) return;
    let active = true;
    recordUnsuccessfulScan(attemptId, identity)
      .then((allowance) => {
        if (active && allowance.known && identity === scanQuota.currentScope())
          onRemaining?.(allowance.remaining);
      })
      .catch((error) => {
        console.warn("[ScanQuota] Could not refresh backend scan usage", error);
      });
    return () => {
      active = false;
    };
  }, [visible, attemptId, identity, onRemaining]);
}
