import { useEffect, useRef } from "react";
import {
  recordUnsuccessfulScan,
  scanQuota,
} from "../services/session/scanQuota";

/** The visible failure popup defines an unsuccessful scan, irrespective of API error type. */
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
    if (!visible) return;
    let active = true;
    recordUnsuccessfulScan(attemptId, identity)
      .then((allowance) => {
        if (active) onRemaining?.(allowance.remaining);
      })
      .catch((error) => {
        console.warn("[ScanQuota] Failed to persist unsuccessful scan", error);
      });
    return () => {
      active = false;
    };
  }, [visible, attemptId, identity, onRemaining]);
}
